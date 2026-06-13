"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import type { Topic } from "@prisma/client";
import { createQuestionAction, updateQuestionAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { questionSchema, type QuestionInput } from "@/validations";

type QuestionFormProps = {
  topics: (Topic & { subtopics: { id: string; name: string }[] })[];
  initialData?: Partial<QuestionInput> & { id?: string };
  type?: string;
  userDomain?: string | null;
};

export function QuestionForm({ topics, initialData, type, userDomain }: QuestionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema) as Resolver<QuestionInput>,
    defaultValues: {
      difficulty: "EASY",
      referenceLinks: [],
      tags: [],
      companyTags: [],
      topicId: initialData?.topicId || "",
      ...initialData,
    },
  });

  async function onSave(data: QuestionInput, saveAs: "DRAFT" | "SUBMITTED") {
    setLoading(true);

    const payload = {
      ...data,
      tags: data.tags?.length ? data.tags : parseCommaList(watch("tags") as unknown as string),
      companyTags: data.companyTags?.length
        ? data.companyTags
        : parseCommaList(watch("companyTags") as unknown as string),
      referenceLinks: data.referenceLinks?.length
        ? data.referenceLinks
        : parseCommaList(watch("referenceLinks") as unknown as string),
    };

    const result = initialData?.id
      ? await updateQuestionAction(initialData.id, payload, saveAs)
      : await createQuestionAction(payload, saveAs);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      saveAs === "DRAFT" ? "Draft saved" : "Question submitted for review"
    );
    router.push("/staff/questions");
    router.refresh();
  }

  return (
    <form className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input {...register("title")} placeholder="Two Sum Problem" />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              defaultValue={initialData?.difficulty ?? "EASY"}
              onValueChange={(v) =>
                v && setValue("difficulty", v as QuestionInput["difficulty"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Domain</Label>
            <Input value={userDomain || "Unassigned"} disabled className="bg-muted text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input {...register("topicId")} placeholder="e.g. Arrays, Graph, NLP" />
            {errors.topicId && (
              <p className="text-sm text-destructive">{errors.topicId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input placeholder="array, hash-map" {...register("tags" as keyof QuestionInput)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Problem Statement</Label>
            <Textarea
              {...register("statement")}
              rows={6}
              placeholder="Describe the problem..."
            />
            {errors.statement && (
              <p className="text-sm text-destructive">{errors.statement.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {type !== "theory" && (
        <Card>
        <CardHeader>
          <CardTitle>Input / Output</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Constraints</Label>
            <Textarea {...register("constraints")} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Input Format</Label>
            <Textarea {...register("inputFormat")} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Output Format</Label>
            <Textarea {...register("outputFormat")} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Sample Input</Label>
            <Textarea {...register("sampleInput")} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Sample Output</Label>
            <Textarea {...register("sampleOutput")} rows={3} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Hidden Test Cases</Label>
            <Textarea {...register("hiddenTestCases")} rows={3} />
          </div>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Solution & Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Solution Approach</Label>
            <Textarea {...register("solutionApproach")} rows={4} />
          </div>

          <div className="space-y-2">
            <Label>Company Tags (Optional, comma-separated)</Label>
            <Input placeholder="Google, Amazon" {...register("companyTags" as keyof QuestionInput)} />
          </div>
          <div className="space-y-2">
            <Label>Reference Links (Optional, comma-separated URLs)</Label>
            <Input placeholder="https://..." {...register("referenceLinks" as keyof QuestionInput)} />
          </div>
          {type !== "theory" && (
            <>
              <div className="space-y-2">
                <Label>Expected Time Complexity</Label>
                <Input placeholder="O(n)" {...register("expectedTimeComplexity")} />
              </div>
              <div className="space-y-2">
                <Label>Expected Space Complexity</Label>
                <Input placeholder="O(1)" {...register("expectedSpaceComplexity")} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/staff/questions">Cancel</Link>
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={handleSubmit((data) => onSave(data, "DRAFT"))}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Draft
        </Button>
        <Button
          type="button"
          disabled={loading}
          onClick={handleSubmit((data) => onSave(data, "SUBMITTED"))}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Send className="mr-2 h-4 w-4" />
          Submit for Review
        </Button>
      </div>
    </form>
  );
}

function parseCommaList(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
