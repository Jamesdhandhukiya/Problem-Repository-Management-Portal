import { notFound } from "next/navigation";
import { getQuestionById } from "@/services/question.service";
import { ModeratorQuestionView } from "@/components/questions/moderator-question-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ModeratorReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = await getQuestionById(id);

  if (!question) notFound();

  return (
    <div className="py-6 max-w-4xl mx-auto">
      <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
        <Link href="/moderator/reviews">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reviews
        </Link>
      </Button>
      <ModeratorQuestionView question={question} />
    </div>
  );
}
