"use client";

import { useRouter } from "next/navigation";
import { Bookmark, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { QuestionWithRelations } from "@/types";
import { toggleBookmarkAction, toggleSolvedAction } from "@/app/actions";
import { QuestionDetail } from "@/components/questions/question-detail";
import { Button } from "@/components/ui/button";

export function StudentQuestionView({ question }: { question: QuestionWithRelations }) {
  const router = useRouter();

  async function handleBookmark() {
    const result = await toggleBookmarkAction(question.id);
    if ("error" in result && result.error) toast.error(result.error);
    else if ("bookmarked" in result)
      toast.success(result.bookmarked ? "Bookmarked" : "Bookmark removed");
    router.refresh();
  }

  async function handleSolved() {
    const result = await toggleSolvedAction(question.id);
    if ("error" in result && result.error) toast.error(result.error);
    else if ("solved" in result)
      toast.success(result.solved ? "Marked as solved" : "Marked as unsolved");
    router.refresh();
  }

  return (
    <QuestionDetail
      question={question}
      actions={
        <>
          <Button variant="outline" onClick={handleBookmark}>
            <Bookmark className="mr-2 h-4 w-4" />
            Bookmark
          </Button>
          <Button onClick={handleSolved}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Solved
          </Button>
        </>
      }
    />
  );
}
