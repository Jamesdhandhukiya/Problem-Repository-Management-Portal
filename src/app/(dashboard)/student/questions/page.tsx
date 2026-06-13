import { requireRole } from "@/lib/auth";
import { searchQuestions, getStudentBookmarks, getStudentSolved } from "@/services/question.service";
import { QuestionList } from "@/components/questions/question-list";

export default async function StudentQuestionsPage() {
  const user = await requireRole(["STUDENT"]);
  
  const [questionsResult, bookmarks, solved] = await Promise.all([
    searchQuestions({ page: 1, limit: 1000 }, "STUDENT"),
    getStudentBookmarks(user.id),
    getStudentSolved(user.id)
  ]);

  const bookmarkedIds = bookmarks.map(b => b.questionId);
  const solvedIds = solved.map(s => s.questionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Questions</h1>
        <p className="text-muted-foreground">
          Explore approved programming and technical problems.
        </p>
      </div>
      <QuestionList 
        questions={questionsResult.data} 
        userBookmarks={bookmarkedIds}
        userSolved={solvedIds}
      />
    </div>
  );
}
