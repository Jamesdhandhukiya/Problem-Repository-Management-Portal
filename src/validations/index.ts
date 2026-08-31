import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  role: z.enum(["ADMIN", "STAFF", "MODERATOR", "STUDENT"]),
  domain: z.string().optional(),
  department: z.string().optional(),
  semester: z.coerce.number().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "STAFF", "MODERATOR", "STUDENT"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  domain: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  semester: z.coerce.number().nullable().optional(),
  password: z.string().min(4, "Password must be at least 4 characters").optional(),
});
const commaSeparatedToArray = (val: any) => {
  if (typeof val === "string") {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return val;
};

export const questionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  statement: z.string().min(20, "Problem statement must be at least 20 characters"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  topicId: z.string().min(1, "Topic is required"),
  constraints: z.string().optional(),
  inputFormat: z.string().optional(),
  outputFormat: z.string().optional(),
  sampleInput: z.string().optional(),
  sampleOutput: z.string().optional(),
  hiddenTestCases: z.string().optional(),
  solutionApproach: z.string().optional(),
  referenceLinks: z.preprocess(commaSeparatedToArray, z.array(z.string())).default([]),
  tags: z.preprocess(commaSeparatedToArray, z.array(z.string())).default([]),
  companyTags: z.preprocess(commaSeparatedToArray, z.array(z.string())).default([]),
  expectedTimeComplexity: z.string().optional(),
  expectedSpaceComplexity: z.string().optional(),
});

export const reviewSchema = z.object({
  questionId: z.string(),
  status: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUIRED"]),
  comments: z.string().optional(),
});

export const searchSchema = z.object({
  query: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  topicId: z.string().optional(),
  status: z
    .enum(["DRAFT", "SUBMITTED", "CHANGES_REQUIRED", "APPROVED", "REJECTED", "PUBLISHED"])
    .optional(),
  facultyName: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
