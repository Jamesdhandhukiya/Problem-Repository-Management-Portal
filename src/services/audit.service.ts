import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type AuditLogInput = {
  userId?: string | null;
  action: string;
  module: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
};

export async function createAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      module: input.module,
      oldValue: input.oldValue ?? undefined,
      newValue: input.newValue ?? undefined,
    },
  });
}

export async function getAuditLogs(options?: {
  page?: number;
  limit?: number;
  module?: string;
  role?: "ADMIN" | "STAFF" | "MODERATOR" | "STUDENT";
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};
  if (options?.module) where.module = options.module;
  if (options?.role) where.user = { role: options.role };

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
