import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { MessageSquare, Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default async function AdminSuggestionsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  // Get all unique questions that have suggestions
  const questionsWithSuggestions = await prisma.question.findMany({
    where: {
      suggestions: {
        some: {}
      }
    },
    include: {
      topic: true,
      createdBy: true,
      suggestions: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      _count: {
        select: { suggestions: true }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Question Suggestions</h1>
        <p className="text-muted-foreground">
          View all questions that have received anonymous student feedback.
        </p>
      </div>

      {questionsWithSuggestions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No suggestions yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            When students submit suggestions or point out issues in questions, they will appear here.
          </p>
        </Card>
      ) : (
        <div className="rounded-xl border border-black overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-center w-[80px] border-r border-slate-300 dark:border-slate-700">Sr. No.</TableHead>
                <TableHead className="text-center min-w-[200px] border-r border-slate-300 dark:border-slate-700">Title</TableHead>
                <TableHead className="text-center min-w-[150px] border-r border-slate-300 dark:border-slate-700">Author</TableHead>
                <TableHead className="text-center min-w-[150px] border-r border-slate-300 dark:border-slate-700">Department</TableHead>
                <TableHead className="text-center w-[120px] border-r border-slate-300 dark:border-slate-700">Suggestions</TableHead>
                <TableHead className="text-center min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionsWithSuggestions.map((q, index) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium text-muted-foreground text-center border-r border-slate-300 dark:border-slate-700">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium text-center border-r border-slate-300 dark:border-slate-700">
                    <span className="max-w-[200px] sm:max-w-[300px] lg:max-w-[400px] mx-auto whitespace-normal break-words block">
                      <Link
                        href={`/admin/questions/${q.id}`}
                        className="hover:underline text-foreground"
                      >
                        {q.title}
                      </Link>
                    </span>
                  </TableCell>
                  <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                    {q.createdBy.name}
                  </TableCell>
                  <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                    {q.createdBy.department || "-"}
                  </TableCell>
                  <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                      {q._count.suggestions}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View Suggestions"
                        className="transition-all hover:scale-110 hover:text-primary hover:bg-primary/10"
                        asChild
                      >
                        <Link href={`/admin/questions/${q.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
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
