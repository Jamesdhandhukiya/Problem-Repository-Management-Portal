import type { QuestionWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DIFFICULTY_LABELS, QUESTION_STATUS_LABELS } from "@/types";
import { format } from "date-fns";
import { QuestionStatusBadge } from "./question-status-badge";

export function QuestionDetail({
  question,
  showReviews = false,
  actions,
}: {
  question: QuestionWithRelations;
  showReviews?: boolean;
  actions?: React.ReactNode;
}) {
  const isCoding = Boolean(
    question.inputFormat || 
    question.outputFormat || 
    question.sampleInput || 
    question.sampleOutput || 
    question.hiddenTestCases ||
    question.expectedTimeComplexity ||
    question.expectedSpaceComplexity ||
    question.constraints ||
    !['aptitude', 'theory', 'cs core', 'fundamentals'].includes(question.topic.name.toLowerCase())
  );
  const questionType = isCoding ? "Coding" : "Theory";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-primary/20 text-primary">{questionType}</Badge>
        <Badge variant="outline">{question.topic.name}</Badge>
        {question.subtopic && (
          <Badge variant="secondary">{question.subtopic.name}</Badge>
        )}
        <Badge>{DIFFICULTY_LABELS[question.difficulty]}</Badge>
        <QuestionStatusBadge status={question.status} />
      </div>

      {actions && <div className="flex gap-2">{actions}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Problem Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{question.statement}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {question.constraints && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Constraints</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">{question.constraints}</pre>
            </CardContent>
          </Card>
        )}
        {question.inputFormat && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Input Format</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">{question.inputFormat}</pre>
            </CardContent>
          </Card>
        )}
        {question.outputFormat && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Output Format</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">{question.outputFormat}</pre>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {question.sampleInput && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sample Input</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-muted p-4 text-sm">{question.sampleInput}</pre>
            </CardContent>
          </Card>
        )}
        {question.sampleOutput && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sample Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-muted p-4 text-sm">{question.sampleOutput}</pre>
            </CardContent>
          </Card>
        )}
      </div>

      {question.solutionApproach && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Solution Approach</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{question.solutionApproach}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {question.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
        {question.companyTags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>

      {(question.expectedTimeComplexity || question.expectedSpaceComplexity) && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          {question.expectedTimeComplexity && (
            <span>Time: {question.expectedTimeComplexity}</span>
          )}
          {question.expectedSpaceComplexity && (
            <span>Space: {question.expectedSpaceComplexity}</span>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Submitted on {format(new Date(question.createdAt), "MMM d, yyyy")}
      </p>

      {showReviews && question.reviews && question.reviews.some(r => r.status !== "APPROVED") && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Comments</h3>
            {question.reviews.filter(r => r.status !== "APPROVED").map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive">{review.status.replace("_", " ")}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.reviewedAt), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                  {review.comments && (
                    <p className="mt-2 text-sm">{review.comments}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
