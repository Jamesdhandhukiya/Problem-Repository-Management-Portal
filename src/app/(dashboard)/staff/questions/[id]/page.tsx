import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getQuestionById, getTopics } from "@/services/question.service";
import { QuestionForm } from "@/components/questions/question-form";
import { QuestionDetail } from "@/components/questions/question-detail";
import { ModeratorQuestionView } from "@/components/questions/moderator-question-view";
import { Badge } from "@/components/ui/badge";
import { QuestionStatusBadge } from "@/components/questions/question-status-badge";

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

  if (question.status === "APPROVED" || question.status === "PUBLISHED") {
    return (
      <div className="py-6 max-w-4xl mx-auto">
        <ModeratorQuestionView question={question} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{question.title}</h1>
          <div className="mt-2">
            <QuestionStatusBadge status={question.status} />
          </div>
        </div>
      </div>

      {canEdit ? (
        <QuestionForm
          topics={topics}
          initialData={{
            id: question.id,
            title: question.title,
            statement: question.statement,
            difficulty: question.difficulty,
            topicId: question.topic?.name || question.topicId,
            subtopicId: question.subtopicId,
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
      ) : (
        <QuestionDetail question={question} showReviews />
      )}
    </div>
  );
}
