import { requireRole } from "@/lib/auth";
import { getStudentBookmarks } from "@/services/question.service";
import { QuestionList } from "@/components/questions/question-list";

export default async function StudentBookmarksPage() {
  const user = await requireRole(["STUDENT"]);
  const bookmarks = await getStudentBookmarks(user.id);
  const questions = bookmarks.map((b) => b.question);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
        <p className="text-muted-foreground">Your saved questions.</p>
      </div>
      <QuestionList questions={questions} showActions={false} />
    </div>
  );
}
