import type { QuestionWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DIFFICULTY_LABELS } from "@/types";
import { format } from "date-fns";
import { CODING_DOMAINS } from "@/lib/domains";
import { QuestionStatusBadge } from "./question-status-badge";
import { 
  ExternalLink, 
  Clock, 
  HardDrive, 
  User, 
  Calendar, 
  Building,
  Bookmark,
  CheckCircle,
  Link2,
  Tag,
  Code2,
  FileText
} from "lucide-react";

export function QuestionDetail({
  question,
  showReviews = false,
  actions,
}: {
  question: QuestionWithRelations;
  showReviews?: boolean;
  actions?: React.ReactNode;
}) {
  const isCoding = question.topic.name in CODING_DOMAINS;
  const questionType = isCoding ? "Algorithmic Problem Solving Challenges" : "Project Definition / Idea / Prototype";

  // Difficulty badge colors
  const difficultyColors = {
    EASY: "border-green-500/20 text-green-700 bg-green-500/5 dark:text-green-400",
    MEDIUM: "border-amber-500/20 text-amber-700 bg-amber-500/5 dark:text-amber-400",
    HARD: "border-red-500/20 text-red-700 bg-red-500/5 dark:text-red-400",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Meta header */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <Badge variant="outline" className={`font-semibold border-indigo-500/20 text-indigo-700 bg-indigo-500/5 dark:text-indigo-400`}>
          {questionType === "Algorithmic Problem Solving Challenges" ? <Code2 className="mr-1 h-3.5 w-3.5 inline" /> : <FileText className="mr-1 h-3.5 w-3.5 inline" />}
          {questionType}
        </Badge>
        <Badge variant="outline" className="border-slate-200 text-slate-700 dark:text-slate-300 px-2.5 py-1">
          <span className="font-semibold text-slate-500 mr-1.5 uppercase text-[10px] tracking-wider">Domain:</span>
          {question.topic.name}
        </Badge>
        {question.subtopic && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-1">
            <span className="font-semibold text-slate-500 mr-1.5 uppercase text-[10px] tracking-wider">Sub-Domain:</span>
            {question.subtopic.name}
          </Badge>
        )}
        <Badge variant="outline" className={`font-semibold ${difficultyColors[question.difficulty]}`}>
          {DIFFICULTY_LABELS[question.difficulty]}
        </Badge>
        <QuestionStatusBadge status={question.status} />
      </div>

      {/* Action buttons (bookmark, solved, etc.) */}
      {actions && (
        <div className="flex flex-wrap gap-2.5 items-center bg-muted/40 p-3 rounded-xl border border-border/60">
          {actions}
        </div>
      )}

      {/* Problem Statement Card */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            {!isCoding ? "Problem Definition" : "Problem Statement"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed font-sans prose prose-slate dark:prose-invert max-w-none">
            {question.statement}
          </div>
        </CardContent>
      </Card>

      {/* Coding fields - Constraints, Inputs, Outputs */}
      {isCoding && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {question.constraints && (
              <Card className="border border-border/80 shadow-sm md:col-span-1">
                <CardHeader className="py-4 border-b border-border/40">
                  <CardTitle className="text-base font-semibold">Constraints</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-3 rounded-lg border">
                    {question.constraints}
                  </pre>
                </CardContent>
              </Card>
            )}
            {question.inputFormat && (
              <Card className="border border-border/80 shadow-sm md:col-span-1">
                <CardHeader className="py-4 border-b border-border/40">
                  <CardTitle className="text-base font-semibold">Input Format</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-3 rounded-lg border">
                    {question.inputFormat}
                  </pre>
                </CardContent>
              </Card>
            )}
            {question.outputFormat && (
              <Card className="border border-border/80 shadow-sm md:col-span-1">
                <CardHeader className="py-4 border-b border-border/40">
                  <CardTitle className="text-base font-semibold">Output Format</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-3 rounded-lg border">
                    {question.outputFormat}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {question.sampleInput && (
              <Card className="border border-border/80 shadow-sm">
                <CardHeader className="py-4 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-base font-semibold">Sample Input</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="rounded-xl bg-muted/80 p-4 font-mono text-sm border shadow-inner">
                    {question.sampleInput}
                  </pre>
                </CardContent>
              </Card>
            )}
            {question.sampleOutput && (
              <Card className="border border-border/80 shadow-sm">
                <CardHeader className="py-4 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-base font-semibold">Sample Output</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="rounded-xl bg-muted/80 p-4 font-mono text-sm border shadow-inner">
                    {question.sampleOutput}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Theory specific fields */}
      {!isCoding && (
        <div className="grid gap-6 md:grid-cols-2">
          {question.inputFormat && (
            <Card className="border border-border/80 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border/50">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  Suggested Technology Stack
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed font-sans">
                  {question.inputFormat}
                </div>
              </CardContent>
            </Card>
          )}
          {question.outputFormat && (
            <Card className="border border-border/80 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border/50">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Expected Outcome
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed font-sans">
                  {question.outputFormat}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Solution Approach */}
      {isCoding && question.solutionApproach && (
        <Card className="border border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/50">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Solution Approach
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed font-sans">
              {question.solutionApproach}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reference Links */}
      {question.referenceLinks && question.referenceLinks.length > 0 && (
        <Card className="border border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/50">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Link2 className="h-4 w-4 text-indigo-500" />
              {!isCoding ? "Source Links" : "Reference Links & Resources"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="grid gap-2 sm:grid-cols-2">
              {question.referenceLinks.map((link, idx) => (
                <li key={idx} className="flex items-center gap-2 bg-muted/30 p-2.5 rounded-lg border">
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={link.startsWith("http") ? link : `https://${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline font-medium text-sm truncate"
                    title={link}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Topic and Company Tags */}
      <div className="grid gap-6 md:grid-cols-2">
        {question.tags && question.tags.length > 0 && (
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="py-3.5 border-b border-border/40 bg-muted/10">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Topic Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 pt-4">
              {question.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="px-3 py-1 text-xs font-semibold rounded-lg">
                  {tag}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}
        {question.companyTags && question.companyTags.length > 0 && (
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="py-3.5 border-b border-border/40 bg-muted/10">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Building className="h-4 w-4" />
                {!isCoding ? "Interdisciplinary Areas" : "Company Tags"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 pt-4">
              {question.companyTags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-indigo-500/20 text-indigo-600 bg-indigo-500/5 dark:text-indigo-400 px-3 py-1 text-xs font-bold rounded-lg">
                  {tag}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coding Complexities */}
      {isCoding && (question.expectedTimeComplexity || question.expectedSpaceComplexity) && (
        <div className="flex flex-wrap gap-4 items-center bg-muted/20 p-4 rounded-xl border">
          {question.expectedTimeComplexity && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Time Complexity:</span>
              <strong className="text-foreground font-mono">{question.expectedTimeComplexity}</strong>
            </div>
          )}
          {question.expectedSpaceComplexity && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HardDrive className="h-4 w-4 text-emerald-500" />
              <span>Space Complexity:</span>
              <strong className="text-foreground font-mono">{question.expectedSpaceComplexity}</strong>
            </div>
          )}
        </div>
      )}

      {/* Submission Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground bg-muted/10 p-3 rounded-lg border border-dashed">
        <div className="flex items-center gap-1.5">
          <User className="h-4 w-4 text-primary/70" />
          <span>Faculty: <strong className="text-foreground font-medium">{question.createdBy.name}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Building className="h-4 w-4 text-primary/70" />
          <span>Department: <strong className="text-foreground font-medium">{question.createdBy.department || "Unassigned"}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-primary/70" />
          <span>Submitted on: <strong className="text-foreground font-medium">{format(new Date(question.createdAt), "MMMM d, yyyy")}</strong></span>
        </div>
      </div>

      {/* Moderator Review Logs */}
      {showReviews && question.reviews && question.reviews.some(r => r.status !== "APPROVED") && (
        <>
          <Separator className="my-6" />
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-destructive">
              Review History
            </h3>
            {question.reviews.filter(r => r.status !== "APPROVED").map((review) => (
              <Card key={review.id} className="border-red-200 dark:border-red-900/30 overflow-hidden">
                <CardHeader className="bg-red-500/5 py-3.5 border-b border-red-100 dark:border-red-900/20">
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive" className="font-semibold">
                      {review.status.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(review.reviewedAt), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0 bg-muted rounded-full p-1 border">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Moderator: {review.moderator.name}</p>
                      {review.comments ? (
                        <p className="mt-2 text-sm text-foreground/80 leading-relaxed italic">
                          &ldquo;{review.comments}&rdquo;
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground italic">No feedback comments provided.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
