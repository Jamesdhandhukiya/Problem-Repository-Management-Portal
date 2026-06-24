"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { QuestionWithRelations } from "@/types";
import { reviewQuestionAction } from "@/app/actions";
import { ModeratorQuestionView } from "@/components/questions/moderator-question-view";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ModeratorReviewClient({
  question,
}: {
  question: QuestionWithRelations;
}) {
  const router = useRouter();
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  const canReview = ["SUBMITTED", "CHANGES_REQUIRED"].includes(question.status);

  async function handleApprove() {
    setLoading(true);
    const result = await reviewQuestionAction({
      questionId: question.id,
      status: "APPROVED",
      comments: comments.trim() ? comments.trim() : undefined,
    });
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Question approved and published");
    router.refresh();
  }

  async function handleReject() {
    if (!comments.trim()) {
      toast.error("Please provide comments explaining the required changes or reason for rejection");
      return;
    }

    setLoading(true);
    const result = await reviewQuestionAction({
      questionId: question.id,
      status: "REJECTED",
      comments: comments.trim(),
    });
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Question changes requested/rejected");
    router.refresh();
  }

  return (
    <div className="py-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" asChild className="mb-2 -ml-4 text-muted-foreground hover:text-foreground">
        <Link href="/moderator/reviews">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reviews
        </Link>
      </Button>

      {/* Review Actions Panel */}
      {canReview && (
        <Card className="border-2 border-primary/20 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2 text-primary">
              <AlertCircle className="h-5 w-5" />
              Review Moderation Panel
            </CardTitle>
            <CardDescription>
              Submit your feedback for this question. Approving will publish it immediately to students. Rejecting will send it back to the faculty member with your comments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review-comments" className="font-semibold">Reviewer Comments</Label>
              <Textarea
                id="review-comments"
                placeholder="Write clear instructions for changes, or reason for approval/rejection..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                Request Changes / Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Approve & Publish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Details View */}
      <ModeratorQuestionView question={question} />
    </div>
  );
}
