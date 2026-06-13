"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logLogin } from "@/services/user.service";
import {
  createQuestion,
  reviewQuestion,
  submitQuestionForReview,
  toggleBookmark,
  toggleSolved,
  updateQuestion,
} from "@/services/question.service";
import { createUser, updateUser } from "@/services/user.service";
import {
  createUserSchema,
  questionSchema,
  reviewSchema,
  updateUserSchema,
} from "@/validations";

export async function signOutAction() {
  const supabase = await createClient();
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
    revalidatePath("/admin/students");
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
    revalidatePath("/admin/students");
    return { success: true, user: updated };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update user" };
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
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
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

  await supabase.auth.signOut();
  redirect("/login");
}

export async function redirectToDashboard(role: UserRole) {
  redirect(getDashboardPath(role));
}
