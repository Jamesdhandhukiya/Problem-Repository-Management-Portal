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
                <TableHead>Question Title</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewedQuestions.map(q => {
                return (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">
                      {q.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {q.reviews.length + (q.status === "SUBMITTED" ? 1 : 0)}
                    </TableCell>
                    <TableCell>
                      <QuestionStatusBadge status={q.status as any} />
                    </TableCell>
                    <TableCell>{format(new Date(q.updatedAt), "MMM d, yyyy 'at' h:mm a")}</TableCell>
                    <TableCell>
                      <ModerationActions 
                        questionId={q.id} 
                        status={q.status} 
                        reviews={q.reviews || []} 
                      />
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
