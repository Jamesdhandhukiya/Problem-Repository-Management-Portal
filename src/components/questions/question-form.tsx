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
import { THEORY_DOMAINS, CODING_DOMAINS, type TheoryDomainKey, type CodingDomainKey } from "@/lib/domains";

type QuestionFormProps = {
  topics: (Topic & { subtopics: { id: string; name: string }[] })[];
  initialData?: Partial<QuestionInput> & { id?: string };
  type?: string;
  userDomain?: string | null;
};

export function QuestionForm({ topics, initialData, type, userDomain }: QuestionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  let topicName = initialData?.topicId;
  // Fallback to searching by ID if the passed value isn't a known domain name
  if (topicName && !(topicName in CODING_DOMAINS) && !(topicName in THEORY_DOMAINS)) {
    topicName = topics.find(t => t.id === initialData?.topicId)?.name || topicName;
  }
  
  const isTheory = type === "theory" || (!type && topicName && !(topicName in CODING_DOMAINS));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema) as Resolver<QuestionInput>,
    defaultValues: {
      difficulty: (initialData?.difficulty && initialData.difficulty !== "EASY")
        ? initialData.difficulty
        : "MEDIUM",
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

  const currentDomains = isTheory ? THEORY_DOMAINS : CODING_DOMAINS;

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
              defaultValue={
                initialData?.difficulty && initialData.difficulty !== "EASY"
                  ? initialData.difficulty
                  : "MEDIUM"
              }
              onValueChange={(v) =>
                v && setValue("difficulty", v as QuestionInput["difficulty"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Domain</Label>
            <Select
              value={watch("topicId")}
              onValueChange={(v) => {
                setValue("topicId", v as any, { shouldValidate: true });
                setValue("subtopicId", undefined as any);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a Domain" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(currentDomains).map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.topicId && (
              <p className="text-sm text-destructive">{errors.topicId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Sub-Domain</Label>
            <Select
              disabled={!watch("topicId")}
              value={watch("subtopicId") || ""}
              onValueChange={(v) => setValue("subtopicId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a Sub-Domain" />
              </SelectTrigger>
              <SelectContent>
                {((currentDomains as any)[watch("topicId")] || []).map((sd: string) => (
                  <SelectItem key={sd} value={sd}>{sd}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input placeholder="array, hash-map" {...register("tags" as keyof QuestionInput)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{isTheory ? "Problem Definition" : "Problem Statement"}</Label>
            <Textarea
              {...register("statement")}
              rows={6}
              placeholder={isTheory ? "Define the problem clearly..." : "Describe the problem..."}
            />
            {errors.statement && (
              <p className="text-sm text-destructive">{errors.statement.message}</p>
            )}
          </div>
          {isTheory && (
            <>
              <div className="space-y-2 md:col-span-2">
                <Label>Suggested Technology Stack (Optional)</Label>
                <Textarea {...register("inputFormat")} rows={3} placeholder="e.g., React, Node.js, PostgreSQL" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Expected Outcome</Label>
                <Textarea {...register("outputFormat")} rows={3} placeholder="What is the expected result or deliverable?" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!isTheory && (
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
          <CardTitle>{isTheory ? "Metadata" : "Solution & Metadata"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {!isTheory && (
            <div className="space-y-2 md:col-span-2">
              <Label>Solution Approach</Label>
              <Textarea {...register("solutionApproach")} rows={4} />
            </div>
          )}

          <div className="space-y-2">
            <Label>{isTheory ? "Interdisciplinary Areas (Optional, comma-separated)" : "Company Tags (Optional, comma-separated)"}</Label>
            <Input placeholder={isTheory ? "e.g., Healthcare, IoT" : "Google, Amazon"} {...register("companyTags" as keyof QuestionInput)} />
          </div>
          <div className="space-y-2">
            <Label>{isTheory ? "Source Link (Optional, comma-separated URLs)" : "Reference Links (Optional, comma-separated URLs)"}</Label>
            <Input placeholder="https://..." {...register("referenceLinks" as keyof QuestionInput)} />
          </div>
          {!isTheory && (
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
