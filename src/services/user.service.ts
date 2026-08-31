import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";
import { createAuditLog } from "@/services/audit.service";

export type CreateUserInput = {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  domain?: string;
  department?: string;
  semester?: number;
};

export async function createUser(input: CreateUserInput, adminId: string) {
  const supabase = await createServiceClient();

  const finalPassword = input.password.length < 6 ? input.password.padEnd(6, '0') : input.password;

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: input.email,
      password: finalPassword,
      email_confirm: true,
      app_metadata: { role: input.role },
    });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Failed to create auth user");
  }

  const user = await prisma.user.create({
    data: {
      id: input.id,
      supabaseId: authData.user.id,
      name: input.name,
      email: input.email,
      role: input.role,
      domain: input.domain,
      department: input.department,
      semester: input.semester,
      status: "ACTIVE",
    },
  });

  await createAuditLog({
    userId: adminId,
    action: "CREATE",
    module: "USER",
    newValue: { id: user.id, email: user.email, role: user.role },
  });

  return user;
}

export async function updateUser(
  userId: string,
  data: { 
    name?: string; 
    role?: UserRole; 
    status?: UserStatus; 
    domain?: string | null;
    department?: string | null;
    semester?: number | null;
    password?: string;
  },
  adminId: string
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw new Error("User not found");

  const { password, ...prismaData } = data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: prismaData,
  });

  if ((data.role || password) && existing.supabaseId) {
    const supabase = await createServiceClient();
    
    const updatePayload: any = {};
    if (data.role) {
      updatePayload.app_metadata = { role: data.role };
    }
    if (password) {
      updatePayload.password = password.length < 6 ? password.padEnd(6, '0') : password;
    }
    
    await supabase.auth.admin.updateUserById(existing.supabaseId, updatePayload);
  }

  await createAuditLog({
    userId: adminId,
    action: "EDIT",
    module: "USER",
    oldValue: { id: existing.id, name: existing.name, role: existing.role, status: existing.status },
    newValue: { id: user.id, name: user.name, role: user.role, status: user.status },
  });

  return user;
}

export async function deleteUser(userId: string, adminId: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw new Error("User not found");

  await prisma.$transaction(async (tx) => {
    // Delete bookmarks
    await tx.bookmark.deleteMany({ where: { studentId: userId } });
    // Delete solved questions
    await tx.solvedQuestion.deleteMany({ where: { studentId: userId } });
    // Delete notifications
    await tx.notification.deleteMany({ where: { userId } });
    
    // Delete reviews by this user
    await tx.review.deleteMany({ where: { moderatorId: userId } });
    
    // For questions created by this user:
    const userQuestions = await tx.question.findMany({ where: { createdById: userId } });
    const questionIds = userQuestions.map((q) => q.id);
    if (questionIds.length > 0) {
      await tx.review.deleteMany({ where: { questionId: { in: questionIds } } });
      await tx.bookmark.deleteMany({ where: { questionId: { in: questionIds } } });
      await tx.solvedQuestion.deleteMany({ where: { questionId: { in: questionIds } } });
      await tx.question.deleteMany({ where: { createdById: userId } });
    }

    // Delete the user record
    await tx.user.delete({ where: { id: userId } });
  });

  // Delete from Supabase Auth
  if (existing.supabaseId) {
    const supabase = await createServiceClient();
    const { error: authError } = await supabase.auth.admin.deleteUser(existing.supabaseId);
    if (authError && authError.status !== 404) {
      throw new Error(authError.message);
    }
  }

  await createAuditLog({
    userId: adminId,
    action: "DELETE",
    module: "USER",
    oldValue: { id: existing.id, email: existing.email, role: existing.role },
  });

  return existing;
}

export async function getUsers(filters?: {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}) {
  const where = {
    ...(filters?.role ? { role: filters.role } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { email: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questionsCreated: true } } },
  });
}

export async function syncUserFromAuth(
  supabaseId: string,
  email: string,
  name: string,
  role: UserRole
) {
  return prisma.user.upsert({
    where: { email },
    update: { supabaseId, name },
    create: { supabaseId, email, name, role, status: "ACTIVE" },
  });
}

export async function logLogin(userId: string) {
  await createAuditLog({
    userId,
    action: "LOGIN",
    module: "AUTH",
    newValue: { timestamp: new Date().toISOString() },
  });
}

export async function getPreviousSession(userId: string) {
  const sessions = await prisma.sessionLog.findMany({
    where: { userId },
    orderBy: { loginAt: "desc" },
    take: 2,
  });
  
  if (sessions.length < 2) return null;
  return sessions[1].loginAt;
}
