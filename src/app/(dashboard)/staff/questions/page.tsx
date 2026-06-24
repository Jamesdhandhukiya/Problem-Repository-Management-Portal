import Link from "next/link";
import { Plus } from "lucide-react";
import { NewQuestionDialog } from "@/components/questions/new-question-dialog";
import { QuestionStatusBadge } from "@/components/questions/question-status-badge";
import { requireRole } from "@/lib/auth";
import { getStaffQuestions } from "@/services/question.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/shared";
import { BookOpen } from "lucide-react";
import { DIFFICULTY_LABELS, QUESTION_STATUS_LABELS } from "@/types";
import { format } from "date-fns";

export default async function StaffQuestionsPage() {
  const user = await requireRole(["STAFF"]);
  const questions = await getStaffQuestions(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Questions</h1>
          <p className="text-muted-foreground">Manage your submitted questions.</p>
        </div>
        <NewQuestionDialog />
      </div>

      {questions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Create your first question to get started."
          icon={BookOpen}
          action={<NewQuestionDialog />}
        />
      ) : (
        <div className="rounded-xl border border-black overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/20 text-primary">
                      {Boolean(
                        q.inputFormat?.trim() || 
                        q.outputFormat?.trim() || 
                        q.sampleInput?.trim() || 
                        q.sampleOutput?.trim() || 
                        q.hiddenTestCases?.trim() ||
                        q.constraints?.trim() ||
                        q.expectedTimeComplexity?.trim() ||
                        q.expectedSpaceComplexity?.trim()
                      ) ? "Coding" : "Theory"}
                    </Badge>
                  </TableCell>
                  <TableCell>{q.topic.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{DIFFICULTY_LABELS[q.difficulty]}</Badge>
                  </TableCell>
                  <TableCell>
                    <QuestionStatusBadge status={q.status} />
                  </TableCell>
                  <TableCell>{format(new Date(q.updatedAt), "MMM d, yyyy 'at' h:mm a")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/staff/questions/${q.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
