import {
  Difficulty,
  Prisma,
  QuestionStatus,
  ReviewStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/services/audit.service";
import {
  notifyAdminPendingBacklog,
  notifyModeratorsNewSubmission,
  notifyStaffReviewResult,
} from "@/services/notification.service";
import type { PaginatedResult, QuestionWithRelations, SearchFilters } from "@/types";

export type QuestionInput = {
  title: string;
  statement: string;
  difficulty: Difficulty;
  topicId: string;
  subtopicId?: string | null;
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  sampleInput?: string;
  sampleOutput?: string;
  hiddenTestCases?: string;
  solutionApproach?: string;
  referenceLinks?: string[];
  tags?: string[];
  companyTags?: string[];
  expectedTimeComplexity?: string;
  expectedSpaceComplexity?: string;
};

const questionInclude = {
  topic: true,
  subtopic: true,
  createdBy: { select: { id: true, name: true, email: true, domain: true, department: true } },
  reviews: {
    include: { moderator: { select: { id: true, name: true, email: true } } },
    orderBy: { reviewedAt: "desc" as const },
  },
};

export async function createQuestion(
  userId: string,
  data: QuestionInput,
  status: "DRAFT" | "SUBMITTED" = "DRAFT"
) {
  const topicName = data.topicId;
  const topicSlug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const topic = await prisma.topic.upsert({
    where: { slug: topicSlug },
    update: { name: topicName },
    create: { name: topicName, slug: topicSlug },
  });

  let finalSubtopicId = null;
  if (data.subtopicId) {
    const subtopicName = data.subtopicId;
    const subtopic = await prisma.subtopic.upsert({
      where: { topicId_name: { topicId: topic.id, name: subtopicName } },
      update: {},
      create: { name: subtopicName, topicId: topic.id },
    });
    finalSubtopicId = subtopic.id;
  }

  const question = await prisma.question.create({
    data: {
      ...data,
      topicId: topic.id,
      subtopicId: finalSubtopicId,
      status,
      createdById: userId,
    },
    include: questionInclude,
  });

  await createAuditLog({
    userId,
    action: status === "DRAFT" ? "CREATE_DRAFT" : "SUBMIT",
    module: "QUESTION",
    newValue: { questionId: question.id, title: question.title, status },
  });

  if (status === "SUBMITTED") {
    await notifyModeratorsNewSubmission(question.title, question.createdBy.department);
    const pendingCount = await prisma.question.count({
      where: { status: { in: ["SUBMITTED", "CHANGES_REQUIRED"] } },
    });
    await notifyAdminPendingBacklog(pendingCount);
  }

  return question;
}

export async function updateQuestion(
  userId: string,
  questionId: string,
  data: Partial<QuestionInput>,
  status?: QuestionStatus
) {
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!existing) throw new Error("Question not found");

  let finalTopicId = data.topicId;
  if (data.topicId) {
    const topicName = data.topicId;
    const topicSlug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const topic = await prisma.topic.upsert({
      where: { slug: topicSlug },
      update: { name: topicName },
      create: { name: topicName, slug: topicSlug },
    });
    finalTopicId = topic.id;
  }

  let finalSubtopicId = undefined;
  if (data.subtopicId !== undefined) {
    if (data.subtopicId === null) {
      finalSubtopicId = null;
    } else {
      const topicToUse = finalTopicId || existing.topicId;
      const subtopicName = data.subtopicId;
      const subtopic = await prisma.subtopic.upsert({
        where: { topicId_name: { topicId: topicToUse, name: subtopicName } },
        update: {},
        create: { name: subtopicName, topicId: topicToUse },
      });
      finalSubtopicId = subtopic.id;
    }
  }

  const question = await prisma.question.update({
    where: { id: questionId },
    data: {
      ...data,
      ...(finalTopicId ? { topicId: finalTopicId } : {}),
      ...(finalSubtopicId !== undefined ? { subtopicId: finalSubtopicId } : {}),
      ...(status ? { status } : {}),
    },
    include: questionInclude,
  });

  await createAuditLog({
    userId,
    action: "EDIT",
    module: "QUESTION",
    oldValue: { id: existing.id, title: existing.title, status: existing.status },
    newValue: { id: question.id, title: question.title, status: question.status },
  });

  if (status === "SUBMITTED" && existing.status !== "SUBMITTED") {
    await notifyModeratorsNewSubmission(question.title, question.createdBy.department);
  }

  return question;
}

export async function submitQuestionForReview(userId: string, questionId: string) {
  return updateQuestion(userId, questionId, {}, "SUBMITTED");
}

export async function reviewQuestion(
  moderatorId: string,
  questionId: string,
  status: ReviewStatus,
  comments?: string
) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { createdBy: true },
  });

  if (!question) throw new Error("Question not found");

  const questionStatusMap: Record<ReviewStatus, QuestionStatus> = {
    APPROVED: "PUBLISHED",
    REJECTED: "REJECTED",
    CHANGES_REQUIRED: "CHANGES_REQUIRED",
  };

  const [review, updatedQuestion] = await prisma.$transaction([
    prisma.review.create({
      data: {
        questionId,
        moderatorId,
        comments,
        status,
      },
    }),
    prisma.question.update({
      where: { id: questionId },
      data: { status: questionStatusMap[status] },
      include: questionInclude,
    }),
  ]);

  const auditAction =
    status === "APPROVED" ? "APPROVE" : status === "REJECTED" ? "REJECT" : "REQUEST_CHANGES";

  await createAuditLog({
    userId: moderatorId,
    action: auditAction,
    module: "REVIEW",
    oldValue: { questionId, status: question.status },
    newValue: { questionId, status: updatedQuestion.status, reviewStatus: status },
  });

  await notifyStaffReviewResult(question.createdById, question.title, status);

  return { review, question: updatedQuestion };
}

export async function getQuestionById(id: string) {
  return prisma.question.findUnique({
    where: { id },
    include: questionInclude,
  });
}

export async function searchQuestions(
  filters: SearchFilters,
  role: UserRole
): Promise<PaginatedResult<QuestionWithRelations>> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: Prisma.QuestionWhereInput = {};

  if (role === "STUDENT") {
    where.status = "PUBLISHED";
  } else if (filters.status) {
    where.status = filters.status;
  }

  if (filters.difficulty) where.difficulty = filters.difficulty;
  if (filters.topicId) where.topicId = filters.topicId;

  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { tags: { has: filters.query } },
      { companyTags: { has: filters.query } },
    ];
  }

  if (filters.facultyName) {
    where.createdBy = {
      name: { contains: filters.facultyName, mode: "insensitive" },
    };
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }

  const [data, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: questionInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.question.count({ where }),
  ]);

  return {
    data: data as QuestionWithRelations[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getStaffQuestions(userId: string) {
  return prisma.question.findMany({
    where: { createdById: userId },
    include: questionInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPendingReviews() {
  return prisma.question.findMany({
    where: { 
      status: { in: ["SUBMITTED", "CHANGES_REQUIRED"] },
    },
    include: questionInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function getModeratorHistory() {
  return prisma.question.findMany({
    where: {
      status: {
        in: ["APPROVED", "REJECTED", "PUBLISHED"]
      }
    },
    include: questionInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function toggleBookmark(studentId: string, questionId: string) {
  const existing = await prisma.bookmark.findUnique({
    where: { studentId_questionId: { studentId, questionId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }

  await prisma.bookmark.create({ data: { studentId, questionId } });
  return { bookmarked: true };
}

export async function toggleSolved(studentId: string, questionId: string) {
  const existing = await prisma.solvedQuestion.findUnique({
    where: { studentId_questionId: { studentId, questionId } },
  });

  if (existing) {
    await prisma.solvedQuestion.delete({ where: { id: existing.id } });
    return { solved: false };
  }

  await prisma.solvedQuestion.create({ data: { studentId, questionId } });
  return { solved: true };
}

export async function getStudentBookmarks(studentId: string) {
  return prisma.bookmark.findMany({
    where: { studentId },
    include: { question: { include: questionInclude } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudentSolved(studentId: string) {
  return prisma.solvedQuestion.findMany({
    where: { studentId },
    include: { question: { include: questionInclude } },
    orderBy: { solvedAt: "desc" },
  });
}

export async function getTopics() {
  return prisma.topic.findMany({
    include: { subtopics: true },
    orderBy: { name: "asc" },
  });
}
