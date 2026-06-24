import { notFound } from "next/navigation";
import { getQuestionById } from "@/services/question.service";
import { ModeratorReviewClient } from "@/components/questions/moderator-review-client";

export default async function ModeratorReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = await getQuestionById(id);

  if (!question) notFound();

  return <ModeratorReviewClient question={question as any} />;
}
