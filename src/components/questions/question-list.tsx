"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Bookmark, CheckCircle, Search, BookOpen } from "lucide-react";
import type { QuestionWithRelations } from "@/types";
import { toggleBookmarkAction, toggleSolvedAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
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
}: {
  questions: QuestionWithRelations[];
  showActions?: boolean;
  userBookmarks?: string[];
  userSolved?: string[];
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [domainFilter, setDomainFilter] = useState("ALL");

  const uniqueDomains = useMemo(() => {
    const domains = new Set(questions.map((q) => q.createdBy.domain || "Unassigned"));
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

  const filteredQuestions = useMemo(() => {
    return questionsWithSrNo.filter((q) => {
      // Search logic
      const query = searchQuery.toLowerCase();
      const domain = (q.createdBy.domain || "Unassigned").toLowerCase();
      const author = q.createdBy.name.toLowerCase();
      const topic = q.topic.name.toLowerCase();
      const title = q.title.toLowerCase();
      const srNoStr = String(q.srNo);

      const matchesSearch =
        !query ||
        title.includes(query) ||
        topic.includes(query) ||
        domain.includes(query) ||
        author.includes(query) ||
        srNoStr === query;

      // Difficulty logic
      const matchesDifficulty =
        difficultyFilter === "ALL" || q.difficulty === difficultyFilter;

      // Domain logic
      const matchesDomain =
        domainFilter === "ALL" || (q.createdBy.domain || "Unassigned") === domainFilter;

      // Type logic
      const isCoding = Boolean(
        q.inputFormat ||
        q.outputFormat ||
        q.sampleInput ||
        q.sampleOutput ||
        q.hiddenTestCases ||
        q.expectedTimeComplexity ||
        q.expectedSpaceComplexity ||
        q.constraints ||
        !["aptitude", "theory", "cs core", "fundamentals"].includes(
          q.topic.name.toLowerCase()
        )
      );
      const questionType = isCoding ? "Coding" : "Theory";
      const matchesType = typeFilter === "ALL" || questionType === typeFilter;

      return matchesSearch && matchesDifficulty && matchesDomain && matchesType;
    });
  }, [questionsWithSrNo, searchQuery, difficultyFilter, typeFilter, domainFilter]);

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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Domain:</span>
            <Select value={domainFilter} onValueChange={(value) => setDomainFilter(value as string)}>
              <SelectTrigger className="w-[140px]">
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

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Type:</span>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as string)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="Coding">Coding</SelectItem>
                <SelectItem value="Theory">Theory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Difficulty:</span>
            <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as string)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">Sr. No.</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Author</TableHead>
              {showActions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 8 : 7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No questions match your search and filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuestions.map((q) => {
                const isCoding = Boolean(
                  q.inputFormat ||
                  q.outputFormat ||
                  q.sampleInput ||
                  q.sampleOutput ||
                  q.hiddenTestCases ||
                  q.expectedTimeComplexity ||
                  q.expectedSpaceComplexity ||
                  q.constraints ||
                  !["aptitude", "theory", "cs core", "fundamentals"].includes(
                    q.topic.name.toLowerCase()
                  )
                );
                const questionType = isCoding ? "Coding" : "Theory";
                const domain = q.createdBy.domain || "Unassigned";

                return (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {q.srNo}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/student/questions/${q.id}`}
                        className="font-medium hover:underline"
                      >
                        {q.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isCoding
                            ? "border-primary/20 text-primary"
                            : "border-muted"
                        }
                      >
                        {questionType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{q.topic.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {DIFFICULTY_LABELS[q.difficulty]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {domain}
                    </TableCell>
                    <TableCell>{q.createdBy.name}</TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Bookmark"
                            onClick={() => handleBookmark(q.id)}
                            className={`transition-all hover:scale-110 hover:text-primary hover:bg-primary/10 ${userBookmarks.includes(q.id) ? "text-primary" : ""}`}
                          >
                            <Bookmark className={`h-4 w-4 ${userBookmarks.includes(q.id) ? "fill-current" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Mark as solved"
                            onClick={() => handleSolved(q.id)}
                            className={`transition-all hover:scale-110 hover:text-primary hover:bg-primary/10 ${userSolved.includes(q.id) ? "text-primary" : ""}`}
                          >
                            <CheckCircle className={`h-4 w-4 ${userSolved.includes(q.id) ? "fill-current text-primary" : ""}`} />
                          </Button>
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
