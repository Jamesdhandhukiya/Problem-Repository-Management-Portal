import { notFound } from "next/navigation";
import { getQuestionById } from "@/services/question.service";
import { StudentQuestionView } from "@/components/questions/student-question-view";

export default async function StudentQuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = await getQuestionById(id);

  if (!question || question.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{question.title}</h1>
      <StudentQuestionView question={question} />
    </div>
  );
}
