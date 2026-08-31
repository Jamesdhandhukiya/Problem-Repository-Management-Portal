"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";
import { MessageSquare, Edit } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type ReviewHistory = {
  id: string;
  comments: string | null;
  reviewedAt: Date;
  status: string;
};

export function ModerationActions({ questionId, status, reviews }: { questionId: string, status: string, reviews: ReviewHistory[] }) {
  const [open, setOpen] = useState(false);

  const canRevise = status === "REJECTED" || status === "CHANGES_REQUIRED";
  const hasComments = reviews && reviews.length > 0;

  if (!canRevise && !hasComments) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <div className="flex gap-2">
      {hasComments && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <MessageSquare className="w-4 h-4 mr-2" />
          View Feedback
        </Button>
      )}
      {canRevise && (
        <Button size="sm" asChild>
          <Link href={`/staff/questions/${questionId}`}>
            <Edit className="w-4 h-4 mr-2" />
            Revise
          </Link>
        </Button>
      )}

      {hasComments && (      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderation Feedback</DialogTitle>
            <DialogDescription>
              Please address the following comments before resubmitting.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {reviews.map((r, index) => {
              const submissionNumber = reviews.length - index;
              return (
                <div key={r.id} className="p-4 rounded-md bg-muted border-l-4 border-amber-500 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline">Submission {submissionNumber}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(r.reviewedAt), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {r.comments || "No comments provided."}
                  </div>
                </div>
              );
            })}
            {reviews.length === 0 && (
              <div className="p-4 rounded-md bg-muted text-sm text-muted-foreground">
                No comments available.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
