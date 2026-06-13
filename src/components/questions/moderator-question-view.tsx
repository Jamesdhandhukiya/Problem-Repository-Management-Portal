import type { QuestionWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DIFFICULTY_LABELS } from "@/types";
import { format } from "date-fns";
import { QuestionStatusBadge } from "./question-status-badge";
import { Check } from "lucide-react";

export function ModeratorQuestionView({
  question,
}: {
  question: QuestionWithRelations;
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

  // Prepare reviews for display: chronological order to get submission numbers, then reversed for display
  const rejectedReviews = [...(question.reviews || [])]
    .filter(r => r.status !== "APPROVED")
    .sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime());
  
  const displayReviews = [...rejectedReviews].reverse();

  return (
    <div className="max-w-4xl mx-auto bg-card border rounded-xl shadow-sm p-6 md:p-10 mb-12">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">{question.title}</h1>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline" className="bg-primary/5">{question.topic.name}</Badge>
          {question.subtopic && (
            <Badge variant="secondary" className="bg-secondary/20">{question.subtopic.name}</Badge>
          )}
          <Badge variant="outline" className="border-primary/20 text-primary">{questionType}</Badge>
          <Badge className="bg-primary">{DIFFICULTY_LABELS[question.difficulty]}</Badge>
          <QuestionStatusBadge status={question.status} />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Date:</span>
            {format(new Date(question.createdAt), "MMMM d, yyyy")}
          </div>
          {(question.expectedTimeComplexity || question.expectedSpaceComplexity) && (
            <>
              <div className="hidden sm:block text-border">•</div>
              <div className="flex items-center gap-4">
                {question.expectedTimeComplexity && (
                  <span><span className="font-medium text-foreground">Time:</span> {question.expectedTimeComplexity}</span>
                )}
                {question.expectedSpaceComplexity && (
                  <span><span className="font-medium text-foreground">Space:</span> {question.expectedSpaceComplexity}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Main Content */}
      <div className="space-y-10 max-w-none">
        {/* Statement */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground border-b pb-2">Problem Statement</h2>
          <div className="whitespace-pre-wrap text-foreground leading-relaxed text-sm">
            {question.statement}
          </div>
        </section>

        {/* Requirements Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {question.inputFormat && (
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Input Format</h3>
              <div className="bg-muted/30 border rounded-lg p-4">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{question.inputFormat}</p>
              </div>
            </section>
          )}
          
          {question.outputFormat && (
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Output Format</h3>
              <div className="bg-muted/30 border rounded-lg p-4">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{question.outputFormat}</p>
              </div>
            </section>
          )}
        </div>

        {/* Constraints */}
        {question.constraints && (
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground border-b pb-2">Constraints</h3>
            <div className="bg-muted/50 border rounded-lg p-4 text-sm text-foreground">
              <pre className="whitespace-pre-wrap font-mono m-0 p-0">{question.constraints}</pre>
            </div>
          </section>
        )}

        {/* Sample I/O */}
        {(question.sampleInput || question.sampleOutput) && (
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground border-b pb-2">Sample Test Cases</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {question.sampleInput && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sample Input</div>
                  <pre className="bg-slate-950 dark:bg-black text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto border">
                    {question.sampleInput}
                  </pre>
                </div>
              )}
              {question.sampleOutput && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sample Output</div>
                  <pre className="bg-slate-950 dark:bg-black text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto border">
                    {question.sampleOutput}
                  </pre>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Solution Approach */}
        {question.solutionApproach && (
          <section>
            <h3 className="text-xl font-semibold mb-4 text-foreground border-b pb-2">Author's Solution Approach</h3>
            <div className="bg-muted/30 border rounded-lg p-6">
              <p className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">
                {question.solutionApproach}
              </p>
            </div>
          </section>
        )}

        {/* Review History */}
        {displayReviews.length > 0 && (
          <section className="mt-12">
            <h3 className="text-xl font-semibold mb-6 text-foreground border-b pb-2">Moderation History</h3>
            <div className="space-y-4">
              {displayReviews.map((review, idx) => {
                const submissionNumber = rejectedReviews.length - idx;
                return (
                  <div key={review.id} className="text-sm bg-amber-50/50 p-4 rounded-md border-l-4 border-amber-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-amber-800 text-base">Submission {submissionNumber}</span>
                      {idx === 0 && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Latest Feedback</Badge>}
                      <span className="text-xs text-amber-700/70 ml-auto">{format(new Date(review.reviewedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                    {review.comments && (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                        {review.comments}
                      </div>
                    )}
                  </div>
              )})}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
