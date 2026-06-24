import { notFound, redirect } from "next/navigation";
import { getQuestionById } from "@/services/question.service";
import { StudentQuestionView } from "@/components/questions/student-question-view";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentQuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    redirect("/login");
  }

  const { id } = await params;
  const question = await getQuestionById(id);

  if (!question || question.status !== "PUBLISHED") {
    notFound();
  }

  // Fetch student specific interaction states
  const bookmark = await prisma.bookmark.findUnique({
    where: {
      studentId_questionId: {
        studentId: user.id,
        questionId: id,
      },
    },
  });

  const solved = await prisma.solvedQuestion.findUnique({
    where: {
      studentId_questionId: {
        studentId: user.id,
        questionId: id,
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{question.title}</h1>
      <StudentQuestionView 
        question={question} 
        isBookmarked={Boolean(bookmark)}
        isSolved={Boolean(solved)}
      />
    </div>
  );
}
