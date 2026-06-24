"use client";

import { useRouter } from "next/navigation";
import { Bookmark, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { QuestionWithRelations } from "@/types";
import { toggleBookmarkAction, toggleSolvedAction } from "@/app/actions";
import { QuestionDetail } from "@/components/questions/question-detail";
import { Button } from "@/components/ui/button";

export function StudentQuestionView({ 
  question,
  isBookmarked,
  isSolved
}: { 
  question: QuestionWithRelations;
  isBookmarked: boolean;
  isSolved: boolean;
}) {
  const router = useRouter();

  async function handleBookmark() {
    const result = await toggleBookmarkAction(question.id);
    if ("error" in result && result.error) {
      toast.error(result.error);
    } else if ("bookmarked" in result) {
      toast.success(result.bookmarked ? "Added to Bookmarks" : "Removed from Bookmarks");
    }
    router.refresh();
  }

  async function handleSolved() {
    const result = await toggleSolvedAction(question.id);
    if ("error" in result && result.error) {
      toast.error(result.error);
    } else if ("solved" in result) {
      toast.success(result.solved ? "Question marked as Solved" : "Question marked as Unsolved");
    }
    router.refresh();
  }

  return (
    <QuestionDetail
      question={question}
      actions={
        <>
          <Button 
            variant={isBookmarked ? "default" : "outline"} 
            onClick={handleBookmark}
            className={isBookmarked ? "bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm transition-all" : "font-medium"}
          >
            <Bookmark className={`mr-2 h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
            {isBookmarked ? "Bookmarked" : "Bookmark"}
          </Button>
          <Button 
            variant={isSolved ? "default" : "outline"} 
            onClick={handleSolved}
            className={isSolved ? "bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm transition-all" : "font-medium"}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isSolved ? "Solved" : "Mark Solved"}
          </Button>
        </>
      }
    />
  );
}
