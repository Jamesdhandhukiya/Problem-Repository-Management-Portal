import { prisma } from "@/lib/prisma";

type NotificationInput = {
  userId: string;
  title: string;
  message: string;
};

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({ data: input });
}

export async function createNotifications(inputs: NotificationInput[]) {
  return prisma.notification.createMany({ data: inputs });
}

export async function getUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function notifyModeratorsNewSubmission(questionTitle: string) {
  const moderators = await prisma.user.findMany({
    where: { role: "MODERATOR", status: "ACTIVE" },
    select: { id: true },
  });

  if (moderators.length === 0) return;

  await createNotifications(
    moderators.map((m) => ({
      userId: m.id,
      title: "New Question Submission",
      message: `"${questionTitle}" has been submitted for review.`,
    }))
  );
}

export async function notifyStaffReviewResult(
  staffId: string,
  questionTitle: string,
  status: "APPROVED" | "REJECTED" | "CHANGES_REQUIRED"
) {
  const titles = {
    APPROVED: "Question Approved",
    REJECTED: "Question Rejected",
    CHANGES_REQUIRED: "Changes Requested",
  };

  const messages = {
    APPROVED: `Your question "${questionTitle}" has been approved and published.`,
    REJECTED: `Your question "${questionTitle}" has been rejected.`,
    CHANGES_REQUIRED: `Changes have been requested for "${questionTitle}". Please review moderator comments.`,
  };

  await createNotification({
    userId: staffId,
    title: titles[status],
    message: messages[status],
  });
}

export async function notifyAdminPendingBacklog(count: number) {
  if (count < 10) return;

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });

  await createNotifications(
    admins.map((a) => ({
      userId: a.id,
      title: "Large Pending Backlog",
      message: `There are ${count} questions pending review. Consider assigning additional moderators.`,
    }))
  );
}
