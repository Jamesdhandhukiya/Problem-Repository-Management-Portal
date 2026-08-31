import { getTopics } from "@/services/question.service";
import { QuestionForm } from "@/components/questions/question-form";
import { requireRole } from "@/lib/auth";

export default async function NewQuestionPage(props: { searchParams: Promise<{ type?: string }> }) {
  const searchParams = await props.searchParams;
  const topics = await getTopics();
  const user = await requireRole(["STAFF"]);

  const type = searchParams?.type;

  const initialData: any = {};
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Question</h1>
        <p className="text-muted-foreground">
          Fill in the problem details and submit for moderator review.
        </p>
      </div>
      <QuestionForm 
        key={type ?? "default"} 
        topics={topics} 
        initialData={initialData} 
        type={type}
        userDomain={user.domain || user.department}
      />
    </div>
  );
}
