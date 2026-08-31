"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import type { QuestionWithRelations } from "@/types";
import { reviewQuestionAction } from "@/app/actions";
import { QuestionDetail } from "@/components/questions/question-detail";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DIFFICULTY_LABELS, QUESTION_STATUS_LABELS } from "@/types";
import { format } from "date-fns";
import { THEORY_DOMAINS } from "@/lib/domains";
import { QuestionStatusBadge } from "./question-status-badge";

export function ReviewPanel({ 
  questions,
  history 
}: { 
  questions: QuestionWithRelations[];
  history: QuestionWithRelations[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<QuestionWithRelations | null>(null);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  const toggleHistory = (id: string) => setExpandedHistory(prev => ({ ...prev, [id]: !prev[id] }));

  async function handleApprove(question: QuestionWithRelations) {
    setLoading(true);
    const result = await reviewQuestionAction({
      questionId: question.id,
      status: "APPROVED",
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Question approved");
    router.refresh();
  }

  async function handleReject() {
    if (!selected) return;
    if (!comments.trim()) {
      toast.error("Please provide comments for rejection");
      return;
    }
    setLoading(true);

    const result = await reviewQuestionAction({
      questionId: selected.id,
      status: "REJECTED",
      comments,
    });

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Question rejected");
    setSelected(null);
    setComments("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Queue & History</h1>
        <p className="text-muted-foreground">
          Review submitted questions and view past reviews.
        </p>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList>
          <TabsTrigger value="queue">Pending Reviews ({questions.length})</TabsTrigger>
          <TabsTrigger value="history">Review History ({history.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="queue" className="mt-4">
          <div className="rounded-xl border">
            <div className="divide-y">
              {questions.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  No questions pending review.
                </div>
              ) : (
                questions.map((q) => {
                  const rejections = [...(q.reviews || [])]
                    .filter(r => r.status === "REJECTED")
                    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
                  const submissionCount = q.reviews?.length ? q.reviews.length + 1 : 1;

                  const isProject = Boolean(q.inputFormat?.trim() || q.outputFormat?.trim()) || (q.topic.name in THEORY_DOMAINS);
                  const questionType = isProject ? "Project Definition / Idea / Prototype" : "Algorithmic Problem Solving Challenges";

                  return (
                    <div
                      key={q.id}
                      className="flex flex-col p-4 hover:bg-muted/50 border-b last:border-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-4">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{q.title}</p>
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                              Submission {submissionCount}
                            </Badge>
                          </div>
                          <div className="mt-1 flex gap-2">
                            <Badge variant="outline" className="border-primary/20 text-primary">{questionType}</Badge>
                            <Badge variant="outline">{q.topic.name}</Badge>
                            <Badge>{DIFFICULTY_LABELS[q.difficulty]}</Badge>
                            <QuestionStatusBadge status={q.status} />
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Submitted on {format(new Date(q.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/moderator/reviews/${q.id}`}>View</Link>
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setSelected(q)} disabled={loading}>
                            Reject
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(q)} disabled={loading}>
                            Approve
                          </Button>
                        </div>
                      </div>
                      {rejections.length > 0 && (
                        <div className="mt-4 space-y-2 pl-2">
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Past Rejection History:</p>
                          {rejections.map((r, idx) => {
                            const isLatest = idx === 0;
                            const submissionNumber = rejections.length - idx;
                            return (
                              <div key={r.id} className="text-sm bg-amber-50/50 p-3 rounded-md border-l-4 border-amber-500">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-amber-800">Submission {submissionNumber}</span>
                                  {isLatest && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Latest Feedback</Badge>}
                                  <span className="text-xs text-amber-700/70 ml-auto">{format(new Date(r.reviewedAt), "MMM d, yyyy")}</span>
                                </div>
                                <span className="text-muted-foreground block whitespace-pre-wrap">{r.comments}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <div className="rounded-xl border">
            <div className="divide-y">
              {history.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  No review history found.
                </div>
              ) : (
                history.map((q) => {
                  const sortedReviews = [...(q.reviews || [])].sort(
                    (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
                  );
                  
                  const isProject = Boolean(q.inputFormat?.trim() || q.outputFormat?.trim()) || (q.topic.name in THEORY_DOMAINS);
                  const questionType = isProject ? "Project Definition / Idea / Prototype" : "Algorithmic Problem Solving Challenges";
                  return (
                    <div
                      key={q.id}
                      className="flex flex-col p-4 hover:bg-muted/50 border-b last:border-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-4">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{q.title}</p>
                          </div>
                          <div className="mt-1 flex gap-2">
                            <Badge variant="outline" className="border-primary/20 text-primary">{questionType}</Badge>
                            <Badge variant="outline">{q.topic.name}</Badge>
                            <Badge>{DIFFICULTY_LABELS[q.difficulty]}</Badge>
                            <QuestionStatusBadge status={q.status} />
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Submitted on {format(new Date(q.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/moderator/reviews/${q.id}`}>View Question</Link>
                          </Button>
                          {sortedReviews.length > 0 && (
                            <Button variant="outline" size="sm" onClick={() => toggleHistory(q.id)}>
                              {expandedHistory[q.id] ? "Hide Submissions" : "View Submissions"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {sortedReviews.length > 0 && expandedHistory[q.id] && (
                        <div className="mt-4 space-y-2 pl-2">
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Past Review History:</p>
                          {sortedReviews.map((r, idx) => {
                            const isLatest = idx === 0;
                            const isApproved = r.status === "APPROVED";
                            const submissionNumber = sortedReviews.length - idx;

                            if (isApproved) {
                              return (
                                <div key={r.id} className="p-3 rounded-md bg-green-50/40 border border-green-100 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-1 rounded-full text-green-600">
                                      <Check className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-medium text-green-800">Status: APPROVED</p>
                                  </div>
                                  <Button variant="ghost" size="sm" className="h-6 text-xs text-green-700 hover:text-green-800 hover:bg-green-100/50" asChild>
                                    <Link href={`/moderator/reviews/${q.id}`}>View Question</Link>
                                  </Button>
                                </div>
                              );
                            }

                            return (
                              <div key={r.id} className="text-sm p-3 rounded-md border-l-4 bg-amber-50/50 border-amber-500">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-amber-800">
                                    Submission {submissionNumber}
                                  </span>
                                  {isLatest && <Badge variant="destructive" className="h-5 px-1.5 text-[10px] ml-1">Latest</Badge>}
                                  <span className="text-xs ml-auto text-amber-700/70">
                                    {format(new Date(r.reviewedAt), "MMM d, yyyy")}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground block whitespace-pre-wrap flex-1">
                                    {r.comments || "No comments provided."}
                                  </span>
                                  <Button variant="ghost" size="sm" className="h-6 text-xs ml-4" asChild>
                                    <Link href={`/moderator/reviews/${q.id}`}>Review Changes</Link>
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject: {selected?.title}</DialogTitle>
            <DialogDescription>
              Please provide the reason for rejection. This will be sent to the staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Comments</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Explain why this question needs changes..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={handleReject}
            >
              <X className="mr-2 h-4 w-4" />
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
