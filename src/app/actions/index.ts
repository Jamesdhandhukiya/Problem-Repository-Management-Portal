"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isStudentEmail, detectDepartmentFromEmail } from "@/lib/student-utils";
import { prisma } from "@/lib/prisma";
import { logLogin } from "@/services/user.service";
import {
  createQuestion,
  reviewQuestion,
  submitQuestionForReview,
  toggleBookmark,
  toggleSolved,
  updateQuestion,
} from "@/services/question.service";
import { createUser, updateUser, deleteUser } from "@/services/user.service";
import {
  createUserSchema,
  questionSchema,
  reviewSchema,
  updateUserSchema,
} from "@/validations";

export async function recordLoginAction(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) return { success: false, error: "User not found" };

    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });

    const session = await prisma.sessionLog.create({
      data: {
        userId: user.id,
        loginAt: now,
      },
    });

    return { success: true, sessionId: session.id };
  } catch (error) {
    console.error("Failed to record login:", error);
    return { success: false };
  }
}

export async function recordLogoutAction(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) return { success: false, error: "User not found" };

    const now = new Date();
    
    // Find the most recent active session for this user
    const lastSession = await prisma.sessionLog.findFirst({
      where: { 
        userId: user.id,
        logoutAt: null 
      },
      orderBy: { loginAt: 'desc' },
    });

    if (lastSession) {
      const durationSeconds = Math.floor((now.getTime() - lastSession.loginAt.getTime()) / 1000);
      await prisma.sessionLog.update({
        where: { id: lastSession.id },
        data: { 
          logoutAt: now,
          duration: durationSeconds 
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to record logout:", error);
    return { success: false };
  }
}

export async function signOutAction() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user?.email) {
    await recordLogoutAction(session.user.email);
  }

  await supabase.auth.signOut();
  redirect("/login");
}

export async function syncSessionAction() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const dbUser = await getCurrentUser();
  if (dbUser) {
    await logLogin(dbUser.id);
    return dbUser;
  }

  return null;
}

export async function createQuestionAction(
  data: unknown,
  saveAs: "DRAFT" | "SUBMITTED" = "DRAFT"
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STAFF") {
    return { error: "Unauthorized" };
  }

  const parsed = questionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const question = await createQuestion(user.id, parsed.data, saveAs);
    revalidatePath("/staff/questions");
    return { success: true, question };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create question" };
  }
}

export async function updateQuestionAction(
  questionId: string,
  data: unknown,
  saveAs?: "DRAFT" | "SUBMITTED"
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STAFF") {
    return { error: "Unauthorized" };
  }

  const parsed = questionSchema.partial().safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    console.log("[DEBUG] updateQuestionAction topicId:", parsed.data.topicId);
    const question = await updateQuestion(
      user.id,
      questionId,
      parsed.data,
      saveAs === "SUBMITTED" ? "SUBMITTED" : undefined
    );
    revalidatePath("/staff/questions");
    revalidatePath(`/staff/questions/${questionId}`);
    return { success: true, question };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update question" };
  }
}

export async function submitQuestionAction(questionId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STAFF") {
    return { error: "Unauthorized" };
  }

  try {
    const question = await submitQuestionForReview(user.id, questionId);
    revalidatePath("/staff/questions");
    revalidatePath("/moderator/reviews");
    return { success: true, question };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to submit question" };
  }
}

export async function reviewQuestionAction(data: unknown) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MODERATOR") {
    return { error: "Unauthorized" };
  }

  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const result = await reviewQuestion(
      user.id,
      parsed.data.questionId,
      parsed.data.status,
      parsed.data.comments
    );
    revalidatePath("/moderator/reviews");
    revalidatePath("/staff/questions");
    return { success: true, ...result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to review question" };
  }
}

export async function createUserAction(data: unknown) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const newUser = await createUser(parsed.data as any, user.id);
    revalidatePath("/admin/staff");
    revalidatePath("/admin/moderators");
    return { success: true, user: newUser };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create user" };
  }
}

export async function updateUserAction(userId: string, data: unknown) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const updated = await updateUser(userId, parsed.data, user.id);
    revalidatePath("/admin/staff");
    revalidatePath("/admin/moderators");
    return { success: true, user: updated };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update user" };
  }
}

export async function deleteUserAction(userId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const deleted = await deleteUser(userId, user.id);
    revalidatePath("/admin/staff");
    revalidatePath("/admin/moderators");
    return { success: true, user: deleted };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete user" };
  }
}

export async function toggleBookmarkAction(questionId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const result = await toggleBookmark(user.id, questionId);
  revalidatePath("/student/questions");
  revalidatePath(`/student/questions/${questionId}`);
  return { success: true, ...result };
}

export async function toggleSolvedAction(questionId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const result = await toggleSolved(user.id, questionId);
  revalidatePath("/student/questions");
  revalidatePath(`/student/questions/${questionId}`);
  return { success: true, ...result };
}

export async function deleteQuestionAction(questionId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return { error: "Question not found" };
    }

    await prisma.question.delete({
      where: { id: questionId }
    });

    revalidatePath("/admin/questions");
    revalidatePath("/student/questions");
    revalidatePath("/staff/questions");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_QUESTION]", error);
    return { error: "Failed to delete question" };
  }
}

export async function updatePasswordAction(formData: FormData) {
  const currentPassword = formData.get("current-password") as string;
  const newPassword = formData.get("new-password") as string;
  const confirmPassword = formData.get("confirm-password") as string;

  if (!currentPassword) {
    return { error: "Current password is required." };
  }

  if (!newPassword || newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }
  
  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();

  // Get current user to retrieve email
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { error: "User session not found." };
  }

  // Verify current password by attempting to sign in
  const finalCurrentPassword = currentPassword.length < 6 ? currentPassword.padEnd(6, '0') : currentPassword;
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: finalCurrentPassword,
  });

  if (signInError) {
    return { error: "Incorrect current password." };
  }

  // Current password is correct, proceed to update
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  await recordLogoutAction(user.email);
  await supabase.auth.signOut();
  redirect("/login");
}

export async function redirectToDashboard(role: UserRole) {
  redirect(getDashboardPath(role));
}

// ─── Student Self-Onboarding ────────────────────────────────────────────────


/**
 * Called after a student successfully signs in with Supabase.
 * Returns whether the student needs to complete their profile setup.
 */
export async function checkStudentSetupNeeded(): Promise<{
  needsSetup: boolean;
  email?: string;
  department?: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser || !authUser.email) return { needsSetup: false };

  // Check if DB profile exists
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  if (dbUser) return { needsSetup: false };

  return {
    needsSetup: true,
    email: authUser.email,
    department: detectDepartmentFromEmail(authUser.email),
  };
}

const studentSetupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  studentId: z.string().min(2, "Student ID is required"),
  department: z.enum(["DCS", "DCE", "DIT"]),
  semester: z.coerce.number().min(1).max(8),
  domain: z.string().min(1, "Domain is required"),
});

/**
 * Completes the first-time student profile setup.
 * Creates the DB User record for the authenticated Supabase user.
 */
export async function completeStudentProfileAction(formData: {
  name: string;
  studentId: string;
  department: string;
  semester: number;
  domain: string;
  newPassword?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser || !authUser.email) {
    return { error: "Not authenticated. Please log in again." };
  }

  const parsed = studentSetupSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Validate new password if provided
  if (formData.newPassword) {
    if (formData.newPassword.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }
  }

  // Check if profile already exists
  const existing = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });
  if (existing) {
    return { success: true, redirectUrl: getDashboardPath("STUDENT") };
  }

  try {
    await prisma.user.create({
      data: {
        id: parsed.data.studentId,
        supabaseId: authUser.id,
        name: parsed.data.name,
        email: authUser.email,
        role: "STUDENT",
        department: parsed.data.department,
        semester: parsed.data.semester,
        domain: parsed.data.domain,
        status: "ACTIVE",
      },
    });

    // Update password if the student chose a new one
    if (formData.newPassword) {
      const { error: pwError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });
      if (pwError) {
        return { error: "Profile saved but password update failed: " + pwError.message };
      }
    }

    revalidatePath("/student");
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete profile setup",
    };
  }

  return { success: true, redirectUrl: "/student" };
}


/**
 * Allows a student to sign up with the default password (depstar@charusat).
 * This is called when a student tries to log in for the first time.
 */
export async function signUpStudentWithDefaultPassword(email: string) {
  if (!isStudentEmail(email)) {
    return { error: "Only university student emails are allowed." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: "depstar@charusat",
    options: {
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Programmatically confirms a student's email by updating the auth.users table directly.
 * Bypasses Supabase SMTP email verification requirements during development.
 */
export async function autoConfirmStudentEmailAction(email: string) {
  if (!isStudentEmail(email)) {
    return { error: "Only university student emails can be auto-confirmed." };
  }

  try {
    // Update email_confirmed_at in Supabase's auth.users table directly.
    // Note: confirmed_at is a generated column in Supabase and will update automatically.
    await prisma.$executeRawUnsafe(
      `UPDATE auth.users 
       SET email_confirmed_at = NOW()
       WHERE email = $1`,
      email
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to auto-confirm user:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to auto-confirm email in database",
    };
  }
}

export async function submitSuggestionAction(questionId: string, facultyId: string, content: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  if (!content || content.trim().length === 0) {
    return { error: "Suggestion content cannot be empty" };
  }

  try {
    const suggestion = await prisma.suggestion.create({
      data: {
        content: content.trim(),
        questionId,
        facultyId,
      },
    });

    revalidatePath(`/student/questions/${questionId}`);
    return { success: true, suggestion };
  } catch (error) {
    console.error("[SUBMIT_SUGGESTION]", error);
    return { error: "Failed to submit suggestion" };
  }
}

export async function importQuestionsAction(
  questions: any[],
  type: "ALGORITHMIC" | "PROJECT"
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STAFF") {
    return { error: "Unauthorized" };
  }

  let successCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    const raw = questions[i];
    try {
      let topicId = raw.topicId;
      if (!topicId && raw.topicName) {
        // First try to check if the provided name is actually a valid topic ID
        let topic = await prisma.topic.findUnique({
          where: { id: raw.topicName }
        });

        // If not found by ID, try searching by name
        if (!topic) {
          topic = await prisma.topic.findFirst({
            where: { name: { equals: raw.topicName, mode: "insensitive" } }
          });
        }

        // If still not found, create a new one
        if (!topic) {
          const slug = raw.topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          topic = await prisma.topic.create({
            data: {
              name: raw.topicName,
              slug: slug || "topic-" + Date.now(),
            }
          });
        }
        topicId = topic.id;
      }

      if (!topicId) {
        throw new Error("Topic is required");
      }

      const questionData = {
        ...raw,
        topicId
      };

      const parsed = questionSchema.safeParse(questionData);
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map(iss => `${iss.path.join('.')}: ${iss.message}`).join(", ") ?? "Invalid input");
      }

      // Automatically submit imported questions for review
      await createQuestion(user.id, parsed.data, "SUBMITTED");
      successCount++;
    } catch (err: any) {
      errors.push(`Row ${i + 1} (${raw.title || 'Untitled'}): ${err.message}`);
    }
  }

  revalidatePath("/staff/questions");
  return { success: true, count: successCount, errors };
}
