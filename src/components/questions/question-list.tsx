"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Bookmark, CheckCircle, Search, BookOpen, Trash2, Filter, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { QuestionWithRelations } from "@/types";
import { CODING_DOMAINS, THEORY_DOMAINS } from "@/lib/domains";
import { toggleBookmarkAction, toggleSolvedAction, deleteQuestionAction } from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/shared";
import { DIFFICULTY_LABELS } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function QuestionList({
  questions,
  showActions = true,
  userBookmarks = [],
  userSolved = [],
  isAdmin = false,
  basePath = "/student/questions",
  showStatusFilter = true,
  showBookmarkAction = true,
  showSolveAction = true,
}: {
  questions: QuestionWithRelations[];
  showActions?: boolean;
  userBookmarks?: string[];
  userSolved?: string[];
  isAdmin?: boolean;
  basePath?: string;
  showStatusFilter?: boolean;
  showBookmarkAction?: boolean;
  showSolveAction?: boolean;
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [domainFilter, setDomainFilter] = useState("ALL");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const uniqueDomains = useMemo(() => {
    const domains = new Set(questions.map((q) => q.topic.name));
    return Array.from(domains).sort();
  }, [questions]);


  const questionsWithSrNo = useMemo(() => {
    return questions.map((q, idx) => ({ ...q, srNo: idx + 1 }));
  }, [questions]);

  async function handleBookmark(id: string) {
    const result = await toggleBookmarkAction(id);
    if ("error" in result && result.error) toast.error(result.error);
    else if ("bookmarked" in result)
      toast.success(result.bookmarked ? "Bookmarked" : "Bookmark removed");
    router.refresh();
  }

  async function handleSolved(id: string) {
    const result = await toggleSolvedAction(id);
    if ("error" in result && result.error) toast.error(result.error);
    else if ("solved" in result)
      toast.success(result.solved ? "Marked as solved" : "Marked as unsolved");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this question? This action cannot be undone and will remove it from the student page as well.")) return;

    const result = await deleteQuestionAction(id);
    if ("error" in result && result.error) toast.error(result.error);
    else toast.success("Question deleted successfully");
  }

  const filteredQuestions = useMemo(() => {
    return questionsWithSrNo.filter((q) => {
      // Search logic
      const query = searchQuery.toLowerCase();
      const domain = q.topic.name.toLowerCase();

      const author = q.createdBy.name.toLowerCase();
      const title = q.title.toLowerCase();
      const srNoStr = String(q.srNo);

      const matchesSearch =
        !query ||
        title.includes(query) ||
        domain.includes(query) ||

        author.includes(query) ||
        srNoStr === query;

      // Difficulty logic
      const matchesDifficulty =
        difficultyFilter === "ALL" || q.difficulty === difficultyFilter;

      // Domain logic
      const matchesDomain =
        domainFilter === "ALL" || q.topic.name === domainFilter;


      // Type logic
      const isProject = Boolean(q.inputFormat?.trim() || q.outputFormat?.trim()) || (q.topic.name in THEORY_DOMAINS);
      const questionType = isProject ? "Project Definition / Idea / Prototype" : "Algorithmic Problem Solving Challenges";
      const matchesType = typeFilter === "ALL" || questionType === typeFilter;

      // Status logic
      const isSolved = userSolved.includes(q.id);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "SOLVED" && isSolved) ||
        (statusFilter === "UNSOLVED" && !isSolved);

      return matchesSearch && matchesDifficulty && matchesDomain && matchesType && matchesStatus;
    });
  }, [questionsWithSrNo, searchQuery, difficultyFilter, typeFilter, domainFilter, statusFilter, userSolved]);

  if (questions.length === 0) {
    return (
      <EmptyState
        title="No questions found"
        description="Try adjusting your search filters."
        icon={BookOpen}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Sr No, title, topic, domain..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {!isAdmin && showStatusFilter && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as string)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="SOLVED">Solved</SelectItem>
                  <SelectItem value="UNSOLVED">Unsolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Popover>
            <PopoverTrigger className={buttonVariants({ variant: "outline", className: "flex items-center gap-2" })}>
              <Filter className="h-4 w-4" />
              Filters
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[300px] p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Domain:</span>
                <Select value={domainFilter} onValueChange={(value) => {
                  setDomainFilter(value as string);

                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {uniqueDomains.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Type:</span>
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="Algorithmic Problem Solving Challenges">Algorithmic Problem Solving Challenges</SelectItem>
                    <SelectItem value="Project Definition / Idea / Prototype">Project Definition / Idea / Prototype</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Difficulty:</span>
                <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="rounded-xl border border-black overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-center w-[80px] border-r border-slate-300 dark:border-slate-700">Sr. No.</TableHead>
              <TableHead className="text-center min-w-[200px] border-r border-slate-300 dark:border-slate-700">Title</TableHead>
              <TableHead className="text-center min-w-[220px] border-r border-slate-300 dark:border-slate-700">Type</TableHead>
              <TableHead className="text-center min-w-[200px] border-r border-slate-300 dark:border-slate-700">Domain</TableHead>
              <TableHead className="text-center w-[120px] border-r border-slate-300 dark:border-slate-700">Difficulty</TableHead>
              {isAdmin && <TableHead className="text-center w-[150px] border-r border-slate-300 dark:border-slate-700">Author</TableHead>}
              {showActions && <TableHead className="text-center min-w-[150px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 7 : 6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No questions match your search and filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuestions.map((q) => {
                const isProject = Boolean(q.inputFormat?.trim() || q.outputFormat?.trim()) || (q.topic.name in THEORY_DOMAINS);
                const questionType = isProject ? "Project Definition / Idea / Prototype" : "Algorithmic Problem Solving Challenges";
                const isCoding = !isProject;

                return (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium text-muted-foreground text-center border-r border-slate-300 dark:border-slate-700">
                      {q.srNo}
                    </TableCell>
                    <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                      <span className="max-w-[200px] sm:max-w-[300px] lg:max-w-[400px] mx-auto whitespace-normal break-words">
                        <Link
                          href={`${basePath}/${q.id}`}
                          className="font-medium hover:underline"
                        >
                          {q.title}
                        </Link>
                      </span>
                    </TableCell>
                    <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                      <Badge
                        variant="outline"
                        className={`h-auto min-h-5 max-w-full whitespace-normal text-center ${isCoding
                            ? "border-primary/20 text-primary"
                            : "border-muted"
                          }`}
                      >
                        {questionType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                      <span>
                        <Badge className="h-auto min-h-5 whitespace-normal text-center bg-slate-900 hover:bg-slate-800 text-slate-50 border-slate-900 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900">
                          {q.topic.name}
                        </Badge>
                      </span>
                    </TableCell>
                    <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">
                      <Badge variant="outline">
                        {DIFFICULTY_LABELS[q.difficulty]}
                      </Badge>
                    </TableCell>
                    {isAdmin && <TableCell className="text-center border-r border-slate-300 dark:border-slate-700">{q.createdBy.name}</TableCell>}
                    {showActions && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                          {isAdmin ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View Question"
                                className="transition-all hover:scale-110 hover:text-primary hover:bg-primary/10"
                                asChild
                              >
                                <Link href={`${basePath}/${q.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete Question"
                                onClick={() => handleDelete(q.id)}
                                className="transition-all hover:scale-110 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View Question"
                                className="transition-all hover:scale-110 hover:text-primary hover:bg-primary/10"
                                asChild
                              >
                                <Link href={`${basePath}/${q.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              {showBookmarkAction && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Bookmark"
                                  onClick={() => handleBookmark(q.id)}
                                  className={`transition-all hover:scale-110 hover:text-primary hover:bg-primary/10 ${userBookmarks.includes(q.id) ? "text-primary" : ""}`}
                                >
                                  <Bookmark className={`h-4 w-4 ${userBookmarks.includes(q.id) ? "fill-current" : ""}`} />
                                </Button>
                              )}
                              {showSolveAction && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Mark as solved"
                                  onClick={() => handleSolved(q.id)}
                                  className={`transition-all hover:scale-110 hover:text-primary hover:bg-primary/10 ${userSolved.includes(q.id) ? "text-primary" : ""}`}
                                >
                                  <CheckCircle className={`h-4 w-4 ${userSolved.includes(q.id) ? "fill-primary text-white" : ""}`} />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
