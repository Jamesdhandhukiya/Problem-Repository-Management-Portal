import { notFound, redirect } from "next/navigation";
import { getQuestionById } from "@/services/question.service";
import { getCurrentUser } from "@/lib/auth";
import { QuestionDetail } from "@/components/questions/question-detail";
import { prisma } from "@/lib/prisma";
import { QuestionSuggestions } from "@/components/questions/question-suggestions";

export default async function AdminQuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;
  const question = await getQuestionById(id);

  if (!question) {
    notFound();
  }

  const suggestions = await prisma.suggestion.findMany({
    where: { questionId: id },
    include: {
      faculty: {
        select: {
          name: true,
          department: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{question.title}</h1>
      <QuestionDetail question={question} />
      <QuestionSuggestions suggestions={suggestions} isAdmin={true} />
    </div>
  );
}
