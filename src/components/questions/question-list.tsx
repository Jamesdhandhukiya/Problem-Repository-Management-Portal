"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Bookmark, CheckCircle, Search, BookOpen, Trash2 } from "lucide-react";
import type { QuestionWithRelations } from "@/types";
import { CODING_DOMAINS } from "@/lib/domains";
import { toggleBookmarkAction, toggleSolvedAction, deleteQuestionAction } from "@/app/actions";
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
  isAdmin = false,
  basePath = "/student/questions",
}: {
  questions: QuestionWithRelations[];
  showActions?: boolean;
  userBookmarks?: string[];
  userSolved?: string[];
  isAdmin?: boolean;
  basePath?: string;
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [domainFilter, setDomainFilter] = useState("ALL");
  const [subDomainFilter, setSubDomainFilter] = useState("ALL");

  const uniqueDomains = useMemo(() => {
    const domains = new Set(questions.map((q) => q.topic.name));
    return Array.from(domains).sort();
  }, [questions]);

  const uniqueSubDomains = useMemo(() => {
    let qs = questions;
    if (domainFilter !== "ALL") {
      qs = questions.filter(q => q.topic.name === domainFilter);
    }
    const subDomains = new Set(qs.map((q) => q.subtopic?.name).filter(Boolean));
    return Array.from(subDomains).sort() as string[];
  }, [questions, domainFilter]);

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
      const subDomain = (q.subtopic?.name || "").toLowerCase();
      const author = q.createdBy.name.toLowerCase();
      const title = q.title.toLowerCase();
      const srNoStr = String(q.srNo);

      const matchesSearch =
        !query ||
        title.includes(query) ||
        domain.includes(query) ||
        subDomain.includes(query) ||
        author.includes(query) ||
        srNoStr === query;

      // Difficulty logic
      const matchesDifficulty =
        difficultyFilter === "ALL" || q.difficulty === difficultyFilter;

      // Domain logic
      const matchesDomain =
        domainFilter === "ALL" || q.topic.name === domainFilter;
        
      // Sub-domain logic
      const matchesSubDomain =
        subDomainFilter === "ALL" || (q.subtopic?.name || "") === subDomainFilter;

      // Type logic
      const isCoding = q.topic.name in CODING_DOMAINS;
      const questionType = isCoding ? "Algorithmic Problem Solving Challenges" : "Project Definition / Idea / Prototype";
      const matchesType = typeFilter === "ALL" || questionType === typeFilter;

      return matchesSearch && matchesDifficulty && matchesDomain && matchesSubDomain && matchesType;
    });
  }, [questionsWithSrNo, searchQuery, difficultyFilter, typeFilter, domainFilter, subDomainFilter]);

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
            <Select value={domainFilter} onValueChange={(value) => {
              setDomainFilter(value as string);
              setSubDomainFilter("ALL");
            }}>
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
            <span className="text-sm font-medium text-muted-foreground">Sub-Domain:</span>
            <Select value={subDomainFilter} onValueChange={(value) => setSubDomainFilter(value as string)} disabled={uniqueSubDomains.length === 0}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {uniqueSubDomains.map((sd) => (
                  <SelectItem key={sd} value={sd}>
                    {sd}
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
                <SelectItem value="Algorithmic Problem Solving Challenges">Algorithmic Problem Solving Challenges</SelectItem>
                <SelectItem value="Project Definition / Idea / Prototype">Project Definition / Idea / Prototype</SelectItem>
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
              <TableHead>Domain</TableHead>
              <TableHead>Sub-Domain</TableHead>
              <TableHead>Difficulty</TableHead>
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
                const isCoding = q.topic.name in CODING_DOMAINS;
                const questionType = isCoding ? "Algorithmic Problem Solving Challenges" : "Project Definition / Idea / Prototype";

                return (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {q.srNo}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`${basePath}/${q.id}`}
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
                      <Badge variant="secondary" className="whitespace-nowrap">{q.topic.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{q.subtopic?.name || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {DIFFICULTY_LABELS[q.difficulty]}
                      </Badge>
                    </TableCell>
                    <TableCell>{q.createdBy.name}</TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex gap-1">
                          {isAdmin ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Question"
                              onClick={() => handleDelete(q.id)}
                              className="transition-all hover:scale-110 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
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
