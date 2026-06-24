import { format, startOfMonth, subMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { ChartDataPoint, DashboardStats } from "@/types";

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const [
    totalQuestions,
    approvedQuestions,
    rejectedQuestions,
    pendingQuestions,
    activeFaculty,
    activeStudents,
  ] = await Promise.all([
    prisma.question.count(),
    prisma.question.count({ where: { status: { in: ["APPROVED", "PUBLISHED"] } } }),
    prisma.question.count({ where: { status: "REJECTED" } }),
    prisma.question.count({
      where: { status: { in: ["SUBMITTED", "CHANGES_REQUIRED"] } },
    }),
    prisma.user.count({
      where: { role: { in: ["STAFF", "MODERATOR"] }, status: "ACTIVE" },
    }),
    prisma.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
  ]);

  return {
    totalQuestions,
    approvedQuestions,
    rejectedQuestions,
    pendingQuestions,
    activeFaculty,
    activeStudents,
  };
}

export async function getQuestionsByDifficulty(): Promise<ChartDataPoint[]> {
  const results = await prisma.question.groupBy({
    by: ["difficulty"],
    _count: { id: true },
  });

  return results.map((r) => ({
    name: r.difficulty.charAt(0) + r.difficulty.slice(1).toLowerCase(),
    value: r._count.id,
  }));
}

export async function getQuestionsByTopic(): Promise<ChartDataPoint[]> {
  const topics = await prisma.topic.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { name: "asc" },
  });

  return topics
    .filter((t) => t._count.questions > 0)
    .map((t) => ({ name: t.name, value: t._count.questions }));
}

export async function getMonthlySubmissions(): Promise<ChartDataPoint[]> {
  const months: ChartDataPoint[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = startOfMonth(subMonths(now, i - 1));
    const count = await prisma.question.count({
      where: {
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    });
    months.push({
      name: format(monthStart, "MMM yyyy"),
      value: count,
    });
  }

  return months;
}

export async function getFacultyContribution(): Promise<ChartDataPoint[]> {
  const staff = await prisma.user.findMany({
    where: { role: "STAFF", status: "ACTIVE" },
    include: { _count: { select: { questionsCreated: true } } },
    orderBy: { questionsCreated: { _count: "desc" } },
    take: 10,
  });

  return staff.map((s) => ({
    name: s.name.split(" ")[0],
    value: s._count.questionsCreated,
  }));
}

export async function getStaffDashboardStats(userId: string) {
  const [totalSubmitted, approved, rejected, underReview] = await Promise.all([
    prisma.question.count({ where: { createdById: userId } }),
    prisma.question.count({
      where: { createdById: userId, status: { in: ["APPROVED", "PUBLISHED"] } },
    }),
    prisma.question.count({
      where: { createdById: userId, status: "REJECTED" },
    }),
    prisma.question.count({
      where: {
        createdById: userId,
        status: { in: ["SUBMITTED", "CHANGES_REQUIRED"] },
      },
    }),
  ]);

  return { totalSubmitted, approved, rejected, underReview };
}

export async function getStaffSubmissionTrend(userId: string): Promise<ChartDataPoint[]> {
  const months: ChartDataPoint[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = startOfMonth(subMonths(now, i - 1));
    const count = await prisma.question.count({
      where: {
        createdById: userId,
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    });
    months.push({ name: format(monthStart, "MMM"), value: count });
  }

  return months;
}

export async function getStaffApprovalRate(userId: string): Promise<ChartDataPoint[]> {
  const stats = await getStaffDashboardStats(userId);
  const total = stats.approved + stats.rejected;
  const rate = total > 0 ? Math.round((stats.approved / total) * 100) : 0;

  return [
    { name: "Approved", value: stats.approved },
    { name: "Rejected", value: stats.rejected },
    { name: "Approval Rate %", value: rate },
  ];
}

export async function getModeratorDashboardStats(moderatorId: string) {
  const moderator = await prisma.user.findUnique({
    where: { id: moderatorId },
    select: { department: true }
  });
  const dept = moderator?.department;

  const [pendingReviews, totalApproved, totalRejected] = await Promise.all([
    prisma.question.count({
      where: {
        status: { in: ["SUBMITTED", "CHANGES_REQUIRED"] },
        ...(dept ? {
          createdBy: {
            department: dept
          }
        } : {})
      },
    }),
    prisma.review.count({
      where: {
        moderatorId,
        status: "APPROVED",
      },
    }),
    prisma.review.count({
      where: {
        moderatorId,
        status: "REJECTED",
      },
    }),
  ]);

  return { pendingReviews, totalApproved, totalRejected };
}

export async function getModeratorReviewPerformance(
  moderatorId: string
): Promise<ChartDataPoint[]> {
  const results = await prisma.review.groupBy({
    by: ["status"],
    where: { moderatorId },
    _count: { id: true },
  });

  return results.map((r) => ({
    name: r.status.replace("_", " "),
    value: r._count.id,
  }));
}

export async function getModeratorPendingBacklog(moderatorId: string): Promise<ChartDataPoint[]> {
  const moderator = await prisma.user.findUnique({
    where: { id: moderatorId },
    select: { department: true }
  });
  const dept = moderator?.department;

  const pending = await prisma.question.groupBy({
    by: ["status"],
    where: {
      status: { in: ["SUBMITTED", "CHANGES_REQUIRED"] },
      ...(dept ? {
        createdBy: {
          department: dept
        }
      } : {})
    },
    _count: { id: true },
  });

  return pending.map((p) => ({
    name: p.status.replace("_", " "),
    value: p._count.id,
  }));
}

export async function getStudentDashboardStats(studentId: string) {
  const [questionsSolved, bookmarkedQuestions] = await Promise.all([
    prisma.solvedQuestion.count({ where: { studentId } }),
    prisma.bookmark.count({ where: { studentId } }),
  ]);

  return { questionsSolved, bookmarkedQuestions };
}

export async function getStudentTopicProgress(
  studentId: string
): Promise<ChartDataPoint[]> {
  const solved = await prisma.solvedQuestion.findMany({
    where: { studentId },
    include: { question: { include: { topic: true } } },
  });

  const topicMap = new Map<string, number>();
  solved.forEach((s) => {
    const name = s.question.topic.name;
    topicMap.set(name, (topicMap.get(name) ?? 0) + 1);
  });

  return Array.from(topicMap.entries()).map(([name, value]) => ({ name, value }));
}

export async function getStudentDifficultyProgress(
  studentId: string
): Promise<ChartDataPoint[]> {
  const solved = await prisma.solvedQuestion.findMany({
    where: { studentId },
    include: { question: true },
  });

  const diffMap = new Map<string, number>();
  solved.forEach((s) => {
    const name = s.question.difficulty;
    diffMap.set(name, (diffMap.get(name) ?? 0) + 1);
  });

  return Array.from(diffMap.entries()).map(([name, value]) => ({
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    value,
  }));
}

export async function getQuestionsReportData() {
  return prisma.question.findMany({
    include: {
      topic: true,
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFacultyReportData() {
  return prisma.user.findMany({
    where: { role: "STAFF" },
    include: {
      _count: { select: { questionsCreated: true } },
      questionsCreated: { select: { status: true } },
    },
  });
}

export async function getApprovalReportData() {
  return prisma.review.findMany({
    include: {
      question: { select: { title: true } },
      moderator: { select: { name: true, email: true } },
    },
    orderBy: { reviewedAt: "desc" },
  });
}
