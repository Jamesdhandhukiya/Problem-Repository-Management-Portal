import { requireRole } from "@/lib/auth";
import { getPendingReviews, getModeratorHistory } from "@/services/question.service";
import { ReviewPanel } from "@/components/questions/review-panel";

export default async function ModeratorReviewsPage() {
  const user = await requireRole(["MODERATOR"]);
  const questions = await getPendingReviews();
  const history = await getModeratorHistory(user.id);
  return <ReviewPanel questions={questions as Parameters<typeof ReviewPanel>[0]["questions"]} history={history as Parameters<typeof ReviewPanel>[0]["history"]} />;
}
