import { searchQuestions } from "@/services/question.service";
import { QuestionList } from "@/components/questions/question-list";

export default async function AdminQuestionsPage() {
  const { data: questions } = await searchQuestions({ page: 1, limit: 50 }, "ADMIN");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Questions</h1>
        <p className="text-muted-foreground">View all questions in the system.</p>
      </div>
      <QuestionList questions={questions} isAdmin={true} basePath="/admin/questions" />
    </div>
  );
}
