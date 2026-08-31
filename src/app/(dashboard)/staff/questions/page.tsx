import Link from "next/link";
import { Plus } from "lucide-react";
import { NewQuestionDialog } from "@/components/questions/new-question-dialog";
import { ImportQuestionsDialog } from "@/components/questions/import-questions-dialog";
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
import { THEORY_DOMAINS } from "@/lib/domains";

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
        <div className="flex items-center gap-2">
          <ImportQuestionsDialog />
          <NewQuestionDialog />
        </div>
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
                <TableHead className="text-center w-[80px] border-r border-slate-300 dark:border-slate-700">Sr. No.</TableHead>
                <TableHead className="text-center min-w-[200px] border-r border-slate-300 dark:border-slate-700">Title</TableHead>
                <TableHead className="text-center min-w-[220px] border-r border-slate-300 dark:border-slate-700">Type</TableHead>
                <TableHead className="text-center min-w-[200px] border-r border-slate-300 dark:border-slate-700">Topic</TableHead>
                <TableHead className="text-center w-[120px] border-r border-slate-300 dark:border-slate-700">Difficulty</TableHead>
                <TableHead className="text-center w-[120px] border-r border-slate-300 dark:border-slate-700">Status</TableHead>
                <TableHead className="text-center min-w-[160px] border-r border-slate-300 dark:border-slate-700">Updated</TableHead>
                <TableHead className="text-center min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q, index) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium text-center text-muted-foreground border-r border-slate-300 dark:border-slate-700">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium text-center border-r border-slate-300 dark:border-slate-700">
                    <span>{q.title}</span>
                  </TableCell>
                  <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                    <Badge variant="outline" className="h-auto min-h-5 max-w-full whitespace-normal break-words text-center border-primary/20 text-primary">
                      {Boolean(q.inputFormat?.trim() || q.outputFormat?.trim()) || (q.topic.name in THEORY_DOMAINS)
                        ? "Project Definition / Idea / Prototype" 
                        : "Algorithmic Problem Solving Challenges"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                    <span>{q.topic.name}</span>
                  </TableCell>
                  <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                    <Badge variant="outline">{DIFFICULTY_LABELS[q.difficulty]}</Badge>
                  </TableCell>
                  <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                    <QuestionStatusBadge status={q.status} />
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap border-r border-slate-300 dark:border-slate-700">{format(new Date(q.updatedAt), "MMM d, yyyy 'at' h:mm a")}</TableCell>
                  <TableCell className="text-center">
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
