"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { QuestionWithRelations } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionList } from "@/components/questions/question-list";
import { useSearchStore } from "@/store";

type Topic = { id: string; name: string };

export function GlobalSearch({ topics, basePath }: { topics: Topic[], basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters, setFilter, resetFilters } = useSearchStore();
  const [questions, setQuestions] = useState<QuestionWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get("query");
    if (q) setFilter("query", q);
  }, [searchParams, setFilter]);

  async function performSearch(pageNum = 1) {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", String(pageNum));
    params.set("limit", "10");

    const res = await fetch(`/api/search?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.data);
      setTotal(data.total);
      setPage(pageNum);
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    performSearch(1);
    router.push(`/search?query=${filters.query}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Questions</h1>
        <p className="text-muted-foreground">
          Search by title, tags, topic, difficulty, or faculty name.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Search</Label>
              <Input
                placeholder="Title, tags..."
                value={filters.query}
                onChange={(e) => setFilter("query", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={filters.difficulty}
                onValueChange={(v) =>
                  setFilter("difficulty", !v || v === "all" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select
                value={filters.topicId}
                onValueChange={(v) =>
                  setFilter("topicId", !v || v === "all" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Faculty Name</Label>
              <Input
                placeholder="Faculty name"
                value={filters.facultyName}
                onChange={(e) => setFilter("facultyName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter("dateFrom", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilter("dateTo", e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button type="submit" disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">{total} results found</p>
          <QuestionList questions={questions} showActions={false} basePath={basePath} />
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => performSearch(page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
              Page {page} of {Math.ceil(total / 10)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / 10)}
              onClick={() => performSearch(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
