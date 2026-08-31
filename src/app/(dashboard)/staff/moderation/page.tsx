import { requireRole } from "@/lib/auth";
import { getStaffQuestions } from "@/services/question.service";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ModerationActions } from "./moderation-actions";
import { QuestionStatusBadge } from "@/components/questions/question-status-badge";

export default async function StaffModerationPage() {
  const user = await requireRole(["STAFF"]);
  const questions = await getStaffQuestions(user.id);
  
  // Filter questions that have reviews or are in progress
  const reviewedQuestions = questions.filter(q => (q.reviews && q.reviews.length > 0) || q.status === "SUBMITTED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moderation Status</h1>
        <p className="text-muted-foreground">Track the status of your submitted questions and view feedback.</p>
      </div>

      {reviewedQuestions.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed">
          <p className="text-muted-foreground">No submissions found yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-black overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-center w-[80px] border-r border-slate-300 dark:border-slate-700">Sr. No.</TableHead>
                <TableHead className="text-center min-w-[300px] border-r border-slate-300 dark:border-slate-700">Question Title</TableHead>
                <TableHead className="text-center w-[120px] border-r border-slate-300 dark:border-slate-700">Submissions</TableHead>
                <TableHead className="text-center w-[120px] border-r border-slate-300 dark:border-slate-700">Status</TableHead>
                <TableHead className="text-center min-w-[160px] border-r border-slate-300 dark:border-slate-700">Last Updated</TableHead>
                <TableHead className="text-center min-w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewedQuestions.map((q, index) => {
                return (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium text-center text-muted-foreground border-r border-slate-300 dark:border-slate-700">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-center border-r border-slate-300 dark:border-slate-700">
                      <span className="max-w-[400px] mx-auto whitespace-normal break-words">{q.title}</span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground border-r border-slate-300 dark:border-slate-700">
                      {q.reviews.length + (q.status === "SUBMITTED" ? 1 : 0)}
                    </TableCell>
                    <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                      <QuestionStatusBadge status={q.status as any} />
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap border-r border-slate-300 dark:border-slate-700">
                      {format(new Date(q.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ModerationActions 
                          questionId={q.id} 
                          status={q.status} 
                          reviews={q.reviews || []} 
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
