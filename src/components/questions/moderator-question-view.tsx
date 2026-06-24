import type { QuestionWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_LABELS } from "@/types";
import { format } from "date-fns";
import { QuestionStatusBadge } from "./question-status-badge";
import { 
  Calendar, 
  Clock, 
  HardDrive, 
  FileText, 
  Sliders, 
  Terminal, 
  BookOpen, 
  AlertCircle, 
  History,
  Link2,
  User
} from "lucide-react";

export function ModeratorQuestionView({
  question,
}: {
  question: QuestionWithRelations;
}) {
  const isCoding = Boolean(
    (question.inputFormat && question.inputFormat.trim() && question.inputFormat !== "null" && question.inputFormat !== "undefined") || 
    (question.outputFormat && question.outputFormat.trim() && question.outputFormat !== "null" && question.outputFormat !== "undefined") || 
    (question.sampleInput && question.sampleInput.trim() && question.sampleInput !== "null" && question.sampleInput !== "undefined") || 
    (question.sampleOutput && question.sampleOutput.trim() && question.sampleOutput !== "null" && question.sampleOutput !== "undefined") || 
    (question.hiddenTestCases && question.hiddenTestCases.trim() && question.hiddenTestCases !== "null" && question.hiddenTestCases !== "undefined") ||
    (question.constraints && question.constraints.trim() && question.constraints !== "null" && question.constraints !== "undefined") ||
    (question.expectedTimeComplexity && question.expectedTimeComplexity.trim() && question.expectedTimeComplexity !== "null" && question.expectedTimeComplexity !== "undefined") ||
    (question.expectedSpaceComplexity && question.expectedSpaceComplexity.trim() && question.expectedSpaceComplexity !== "null" && question.expectedSpaceComplexity !== "undefined")
  );
  const questionType = isCoding ? "Coding" : "Theory";

  // Prepare reviews for display: chronological order to get submission numbers, then reversed for display
  const rejectedReviews = [...(question.reviews || [])]
    .filter(r => r.status !== "APPROVED")
    .sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime());
  
  const displayReviews = [...rejectedReviews].reverse();

  // Color mappings for difficulty
  const difficultyColors = {
    EASY: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    MEDIUM: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    HARD: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  return (
    <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-md p-6 md:p-10 mb-12">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{question.title}</h1>
        
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-muted text-muted-foreground border border-border">
            {question.topic.name}
          </Badge>
          {question.subtopic && (
            <Badge variant="outline" className="border-border text-muted-foreground">
              {question.subtopic.name}
            </Badge>
          )}
          <Badge 
            variant="outline" 
            className={
              isCoding 
                ? "bg-indigo-500/5 text-indigo-600 border-indigo-500/20 dark:text-indigo-400" 
                : "bg-violet-500/5 text-violet-600 border-violet-500/20 dark:text-violet-400"
            }
          >
            {questionType}
          </Badge>
          <Badge variant="outline" className={difficultyColors[question.difficulty]}>
            {DIFFICULTY_LABELS[question.difficulty]}
          </Badge>
          <QuestionStatusBadge status={question.status} />
        </div>
        
        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Submitted on <span className="font-medium text-foreground">{format(new Date(question.createdAt), "MMMM d, yyyy")}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Author: <span className="font-medium text-foreground">{question.createdBy.name}</span> <span className="text-muted-foreground">({question.createdBy.department})</span></span>
          </div>
          {question.expectedTimeComplexity && question.expectedTimeComplexity !== "null" && question.expectedTimeComplexity !== "undefined" && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Time: <span className="font-mono font-medium text-foreground">{question.expectedTimeComplexity}</span></span>
            </div>
          )}
          {question.expectedSpaceComplexity && question.expectedSpaceComplexity !== "null" && question.expectedSpaceComplexity !== "undefined" && (
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span>Space: <span className="font-mono font-medium text-foreground">{question.expectedSpaceComplexity}</span></span>
            </div>
          )}
        </div>

        {/* Tags & Company Tags Row */}
        {(question.tags.length > 0 || question.companyTags.length > 0) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {question.tags.filter(Boolean).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-muted/60 text-muted-foreground hover:bg-muted/80">
                #{tag}
              </Badge>
            ))}
            {question.companyTags.filter(Boolean).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs border-primary/20 text-primary bg-primary/5 hover:bg-primary/10">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="mt-8 space-y-8">
        {/* Statement */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Problem Statement
          </h2>
          <div className="text-foreground leading-relaxed text-[15px] whitespace-pre-wrap pl-7">
            {question.statement}
          </div>
        </section>

        {/* Input/Output Format */}
        {(question.inputFormat || question.outputFormat) && (
          <div className="grid md:grid-cols-2 gap-6 pl-7">
            {question.inputFormat && question.inputFormat.trim() !== "null" && question.inputFormat.trim() !== "undefined" && (
              <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  Input Format
                </h3>
                <div className="bg-muted/40 border border-border rounded-xl p-4 text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {question.inputFormat}
                </div>
              </section>
            )}
            
            {question.outputFormat && question.outputFormat.trim() !== "null" && question.outputFormat.trim() !== "undefined" && (
              <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  Output Format
                </h3>
                <div className="bg-muted/40 border border-border rounded-xl p-4 text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {question.outputFormat}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Constraints */}
        {question.constraints && question.constraints.trim() !== "null" && question.constraints.trim() !== "undefined" && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" />
              Constraints
            </h2>
            <div className="pl-7">
              <div className="bg-slate-50 dark:bg-slate-900 border border-border border-l-4 border-l-primary rounded-r-xl p-4 text-sm font-mono text-foreground whitespace-pre-wrap">
                {question.constraints}
              </div>
            </div>
          </section>
        )}

        {/* Sample I/O */}
        {(question.sampleInput || question.sampleOutput) && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Sample Test Cases
            </h2>
            <div className="grid md:grid-cols-2 gap-6 pl-7">
              {question.sampleInput && question.sampleInput.trim() !== "null" && question.sampleInput.trim() !== "undefined" && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sample Input</div>
                  <pre className="bg-slate-950 dark:bg-black text-slate-100 p-4 rounded-xl font-mono text-sm overflow-x-auto border border-border shadow-sm">
                    {question.sampleInput}
                  </pre>
                </div>
              )}
              {question.sampleOutput && question.sampleOutput.trim() !== "null" && question.sampleOutput.trim() !== "undefined" && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sample Output</div>
                  <pre className="bg-slate-950 dark:bg-black text-slate-100 p-4 rounded-xl font-mono text-sm overflow-x-auto border border-border shadow-sm">
                    {question.sampleOutput}
                  </pre>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Solution Approach */}
        {question.solutionApproach && question.solutionApproach.trim() !== "null" && question.solutionApproach.trim() !== "undefined" && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Solution Approach
            </h2>
            <div className="pl-7">
              <div className="bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl p-5 text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">
                {question.solutionApproach}
              </div>
            </div>
          </section>
        )}

        {/* Reference Links */}
        {question.referenceLinks && question.referenceLinks.filter(Boolean).length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Reference Links
            </h2>
            <div className="pl-7 space-y-1.5">
              {question.referenceLinks.filter(Boolean).map((link) => (
                <a
                  key={link}
                  href={link.startsWith("http") ? link : `https://${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center gap-1.5 w-fit"
                >
                  <span>{link}</span>
                  <span className="text-xs text-muted-foreground">↗</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Review History */}
        {displayReviews.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-amber-500" />
              Moderation History
            </h2>
            <div className="space-y-4 pl-7">
              {displayReviews.map((review, idx) => {
                const submissionNumber = rejectedReviews.length - idx;
                return (
                  <div key={review.id} className="text-sm bg-amber-500/[0.03] dark:bg-amber-500/[0.01] p-4 rounded-xl border border-amber-500/20 border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-amber-800 dark:text-amber-400 text-sm">Submission #{submissionNumber} Feedback</span>
                      {idx === 0 && <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded">Latest</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto">{format(new Date(review.reviewedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                    {review.comments && (
                      <div className="text-sm text-foreground whitespace-pre-wrap mt-1">
                        {review.comments}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
