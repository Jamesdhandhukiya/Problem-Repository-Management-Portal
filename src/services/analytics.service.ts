import { format, startOfMonth, subMonths, startOfDay, endOfDay, subDays } from "date-fns";
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
      where: { role: "STAFF", status: "ACTIVE" },
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
  });

  const merged = topics.reduce((acc, t) => {
    const name = t.name.trim();
    const existing = acc.find((a) => a.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.value += t._count.questions;
    } else {
      acc.push({ name, value: t._count.questions });
    }
    return acc;
  }, [] as ChartDataPoint[]);

  return merged.sort((a, b) => a.name.localeCompare(b.name));
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
  });

  return staff.map((s) => ({
    name: s.name,
    value: s._count.questionsCreated,
    department: s.department,
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

export async function getModeratorDashboardStats() {
  const [pendingReviews, totalApproved, totalRejected] = await Promise.all([
    prisma.question.count({
      where: {
        status: { in: ["SUBMITTED", "CHANGES_REQUIRED"] },
      },
    }),
    prisma.question.count({
      where: {
        status: { in: ["APPROVED", "PUBLISHED"] },
      },
    }),
    prisma.question.count({
      where: {
        status: "REJECTED",
      },
    }),
  ]);

  return { pendingReviews, totalApproved, totalRejected };
}

export async function getModeratorReviewPerformance(): Promise<ChartDataPoint[]> {
  const results = await prisma.question.groupBy({
    by: ["status"],
    where: {
      status: { not: "DRAFT" },
    },
    _count: { id: true },
  });

  return results.map((r) => ({
    name: r.status.replace("_", " "),
    value: r._count.id,
  }));
}

export async function getModeratorPendingBacklog(): Promise<ChartDataPoint[]> {
  const pending = await prisma.question.groupBy({
    by: ["status"],
    where: {
      status: { in: ["SUBMITTED", "CHANGES_REQUIRED"] },
    },
    _count: { id: true },
  });

  return pending.map((p) => ({
    name: p.status.replace("_", " "),
    value: p._count.id,
  }));
}

export async function getModeratorDepartmentStats(): Promise<ChartDataPoint[]> {
  const questions = await prisma.question.findMany({
    where: {
      status: { not: "DRAFT" },
    },
    include: {
      createdBy: { select: { department: true } }
    }
  });

  const deptMap = new Map<string, number>();
  questions.forEach(q => {
    const dept = q.createdBy.department || "Unassigned";
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
  });

  return Array.from(deptMap.entries()).map(([name, value]) => ({ name, value }));
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

export async function getWeeklyAccessGraph(): Promise<ChartDataPoint[]> {
  const days: ChartDataPoint[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const start = startOfDay(subDays(now, i));
    const end = endOfDay(subDays(now, i));
    
    const sessions = await prisma.sessionLog.aggregate({
      where: { loginAt: { gte: start, lte: end } },
      _sum: { duration: true },
    });
    
    days.push({
      name: format(start, "EEE"), // Mon, Tue, etc.
      value: Math.round(((sessions._sum.duration || 0) / 60) * 10) / 10, // minutes, rounded to 1 decimal
    });
  }
  return days;
}

export async function getMonthlyStudentLogins(): Promise<ChartDataPoint[]> {
  const months: ChartDataPoint[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const start = startOfMonth(subMonths(now, i));
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const count = await prisma.sessionLog.count({
      where: { 
        loginAt: { gte: start, lte: end },
        user: { role: "STUDENT" }
      },
    });
    
    months.push({
      name: format(start, "MMM"),
      value: count,
    });
  }
  return months;
}

export async function getLastLogins() {
  return prisma.user.findMany({
    where: { role: { in: ["STAFF", "MODERATOR"] } },
    select: { name: true, role: true, lastLoginAt: true, email: true },
    orderBy: { lastLoginAt: { sort: "desc", nulls: "last" } },
  });
}
