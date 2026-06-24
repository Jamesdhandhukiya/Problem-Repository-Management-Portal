import type {
  AuditLog,
  Bookmark,
  Difficulty,
  Notification,
  Question,
  QuestionStatus,
  Review,
  ReviewStatus,
  SolvedQuestion,
  Subtopic,
  Topic,
  User,
  UserRole,
  UserStatus,
} from "@prisma/client";

export type {
  AuditLog,
  Bookmark,
  Difficulty,
  Notification,
  Question,
  QuestionStatus,
  Review,
  ReviewStatus,
  SolvedQuestion,
  Subtopic,
  Topic,
  User,
  UserRole,
  UserStatus,
};

export type QuestionWithRelations = Question & {
  topic: Topic;
  subtopic: Subtopic | null;
  createdBy: Pick<User, "id" | "name" | "email" | "domain" | "department">;
  reviews?: (Review & {
    moderator: Pick<User, "id" | "name" | "email">;
  })[];
  _count?: { bookmarks: number; solvedBy: number };
};

export type UserWithStats = User & {
  _count?: { questionsCreated: number };
};

export type DashboardStats = {
  totalQuestions: number;
  approvedQuestions: number;
  rejectedQuestions: number;
  pendingQuestions: number;
  activeFaculty: number;
  activeStudents: number;
};

export type ChartDataPoint = {
  name: string;
  value: number;
  fill?: string;
};

export type SearchFilters = {
  query?: string;
  difficulty?: Difficulty;
  topicId?: string;
  status?: QuestionStatus;
  facultyName?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  ADMIN: "/admin",
  STAFF: "/staff",
  MODERATOR: "/moderator",
  STUDENT: "/student",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Under Review",
  CHANGES_REQUIRED: "Changes Required",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PUBLISHED: "Published",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  MODERATOR: "Moderator",
  STUDENT: "Student",
};
