"use client";

import { useRouter } from "next/navigation";
import { Bookmark, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { QuestionWithRelations } from "@/types";
import { toggleBookmarkAction, toggleSolvedAction, submitSuggestionAction } from "@/app/actions";
import { QuestionDetail } from "@/components/questions/question-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState } from "react";

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

  const [suggestion, setSuggestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSuggestionSubmit() {
    if (!suggestion.trim()) {
      toast.error("Please enter a suggestion first.");
      return;
    }

    setIsSubmitting(true);
    const result = await submitSuggestionAction(question.id, question.createdById, suggestion);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Suggestion submitted successfully! The faculty will review it anonymously.");
      setSuggestion("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <QuestionDetail
      question={question}
      showAuthor={false}
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

      {/* Suggestion Box */}
      <Card className="max-w-5xl mx-auto shadow-sm overflow-hidden border border-border/80">
        <div className="bg-muted/30 px-6 py-4 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2 font-bold text-foreground">
            <Send className="h-4 w-4 text-foreground/70" />
            Submit a Suggestion
          </CardTitle>
          <CardDescription className="mt-1">
            Found an issue or have a suggestion to improve this problem? Let the faculty know anonymously.
          </CardDescription>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <Textarea 
              placeholder="Write your suggestion here (e.g., 'The second sample output seems incorrect...')"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              rows={3}
              className="resize-none bg-background focus-visible:ring-slate-400"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSuggestionSubmit} 
                disabled={isSubmitting || !suggestion.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-slate-50 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 shadow-sm font-medium"
              >
                {isSubmitting ? "Submitting..." : "Send Suggestion"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
