import { requireRole } from "@/lib/auth";
import { getStudentSolved } from "@/services/question.service";
import { QuestionList } from "@/components/questions/question-list";

export default async function StudentSolvedPage() {
  const user = await requireRole(["STUDENT"]);
  const solved = await getStudentSolved(user.id);
  const questions = solved.map((s) => s.question);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Solved Questions</h1>
        <p className="text-muted-foreground">Questions you have completed.</p>
      </div>
      <QuestionList questions={questions} showActions={false} />
    </div>
  );
}
