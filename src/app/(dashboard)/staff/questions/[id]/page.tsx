import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getQuestionById, getTopics } from "@/services/question.service";
import { QuestionForm } from "@/components/questions/question-form";
import { ModeratorQuestionView } from "@/components/questions/moderator-question-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { QuestionSuggestions } from "@/components/questions/question-suggestions";

export default async function StaffQuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["STAFF"]);
  const { id } = await params;
  const question = await getQuestionById(id);

  if (!question || question.createdById !== user.id) {
    notFound();
  }

  const topics = await getTopics();
  const canEdit = ["DRAFT", "CHANGES_REQUIRED", "REJECTED"].includes(question.status);

  const suggestions = await prisma.suggestion.findMany({
    where: { questionId: id, facultyId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!canEdit) {
    return (
      <div className="py-6 max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild className="mb-2 -ml-4 text-muted-foreground hover:text-foreground">
          <Link href="/staff/questions">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Questions
          </Link>
        </Button>
        <ModeratorQuestionView question={question as any} />
        <QuestionSuggestions suggestions={suggestions} isAdmin={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{question.title}</h1>
        </div>
      </div>

      <QuestionForm
        topics={topics}
        initialData={{
          id: question.id,
          title: question.title,
          statement: question.statement,
          difficulty: question.difficulty,
          topicId: question.topic?.name || question.topicId,

          constraints: question.constraints ?? undefined,
          inputFormat: question.inputFormat ?? undefined,
          outputFormat: question.outputFormat ?? undefined,
          sampleInput: question.sampleInput ?? undefined,
          sampleOutput: question.sampleOutput ?? undefined,
          hiddenTestCases: question.hiddenTestCases ?? undefined,
          solutionApproach: question.solutionApproach ?? undefined,
          referenceLinks: question.referenceLinks,
          tags: question.tags,
          companyTags: question.companyTags,
          expectedTimeComplexity: question.expectedTimeComplexity ?? undefined,
          expectedSpaceComplexity: question.expectedSpaceComplexity ?? undefined,
        }}
        userDomain={user.domain || user.department}
      />
      <QuestionSuggestions suggestions={suggestions} isAdmin={false} />
    </div>
  );
}
