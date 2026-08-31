"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { importQuestionsAction } from "@/app/actions";

// CSV parser helper
function parseCSV(text: string, delimiter: string = ","): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let currentVal = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      row.push(currentVal);
      currentVal = "";
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(currentVal);
      result.push(row);
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  if (row.length > 0 || currentVal !== "") {
    row.push(currentVal);
    result.push(row);
  }
  return result;
}

export function ImportQuestionsDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questionType, setQuestionType] = useState<"ALGORITHMIC" | "PROJECT" | "">("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    if (!questionType) {
      toast.error("Please select a question type first");
      return;
    }

    let headers = [];
    if (questionType === "ALGORITHMIC") {
      headers = [
        "Title",
        "Difficulty",
        "Domain",
        "Problem Statement",
        "Solution Approach",
        "Company Tags",
        "Reference Links"
      ];
    } else {
      headers = [
        "Title",
        "Difficulty",
        "Domain",
        "Problem Definition",
        "Suggested Technology Stack",
        "Expected Outcome",
        "Interdisciplinary Areas",
        "Source Link"
      ];
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers.map(h => `"${h}"`).join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${questionType.toLowerCase()}-template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportErrors([]);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!questionType) {
      toast.error("Please select a question type first");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      let delimiter = ",";
      if (text.includes(";") && !text.includes(",")) delimiter = ";";
      else if (text.includes("\t") && !text.includes(",")) delimiter = "\t";

      const parsedRows = parseCSV(text, delimiter);
      if (parsedRows.length <= 1) {
        toast.error("CSV file is empty or has no data rows");
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const headers = parsedRows[0].map((h) => {
        let trimmed = h.trim().toLowerCase();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          trimmed = trimmed.substring(1, trimmed.length - 1);
        }
        return trimmed;
      });

      const questionsToImport = [];

      for (let i = 1; i < parsedRows.length; i++) {
        const values = parsedRows[i].map((v) => {
          let trimmed = v.trim();
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            trimmed = trimmed.substring(1, trimmed.length - 1);
          }
          return trimmed;
        });

        // Skip empty rows
        if (values.length === 0 || (values.length === 1 && values[0] === "")) continue;

        const data: any = {};

        headers.forEach((h, idx) => {
          const val = values[idx] || "";
          
          if (h === "title") data.title = val;
          if (h === "statement" || h === "problem statement" || h === "problem definition") data.statement = val;
          if (h === "difficulty") data.difficulty = val.toUpperCase();
          if (h === "topic" || h === "topic name" || h === "domain") data.topicName = val;
          
          if (h === "constraints") data.constraints = val;
          if (h === "input format" || h === "suggested technology stack") data.inputFormat = val;
          if (h === "output format" || h === "expected outcome") data.outputFormat = val;
          if (h === "sample input") data.sampleInput = val;
          if (h === "sample output") data.sampleOutput = val;
          if (h === "hidden test cases") data.hiddenTestCases = val;
          if (h === "solution approach") data.solutionApproach = val;
          if (h === "expected time complexity") data.expectedTimeComplexity = val;
          if (h === "expected space complexity") data.expectedSpaceComplexity = val;
          
          if (h === "reference links" || h === "source link") data.referenceLinks = val;
          if (h === "tags") data.tags = val;
          if (h === "company tags" || h === "interdisciplinary areas") data.companyTags = val;
        });

        if (!data.title || !data.statement || !data.difficulty || !data.topicName) {
          toast.error(`Row ${i + 1} is missing required fields (Title, Statement, Difficulty, or Topic)`);
          continue;
        }

        // Validate difficulty
        if (!["EASY", "MEDIUM", "HARD"].includes(data.difficulty)) {
          data.difficulty = "MEDIUM"; // fallback
        }

        questionsToImport.push(data);
      }

      if (questionsToImport.length === 0) {
        toast.error("No valid questions found to import");
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const res = await importQuestionsAction(questionsToImport, questionType as "ALGORITHMIC" | "PROJECT");
      
      if (res.error) {
        toast.error(res.error);
        setImportErrors([res.error]);
      } else {
        if (res.errors && res.errors.length > 0) {
          toast.warning(`Imported ${res.count} questions. Failed: ${res.errors.length}`);
          console.error("Import errors:", res.errors);
          setImportErrors(res.errors);
        } else {
          toast.success(`Successfully imported ${res.count} questions!`);
          setOpen(false);
        }
      }
    } catch (err: any) {
      toast.error("Failed to parse CSV: " + err.message);
    }
    
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setImportErrors([]); }}>
      <DialogTrigger render={
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import Questions
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Questions</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing questions. Ensure the file has the correct columns for your selected type.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Question Type</Label>
            <Select
              value={questionType}
              onValueChange={(val: string | null) => setQuestionType((val || "") as "ALGORITHMIC" | "PROJECT" | "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type of questions to import" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALGORITHMIC">Algorithmic Problem Solving Challenges</SelectItem>
                <SelectItem value="PROJECT">Project Definition / Idea / Prototype</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {questionType && (
            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg border border-black dark:border-white">
              <span className="text-sm">Need the exact format?</span>
              <Button variant="secondary" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              className="w-full"
              disabled={loading || !questionType}
              onClick={() => fileInputRef.current?.click()}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              {loading ? "Importing..." : "Select CSV File"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Rows missing required fields (Title, Statement, Difficulty, Topic) will be skipped.
            </p>
          </div>
          
          {importErrors.length > 0 && (
            <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm max-h-40 overflow-y-auto">
              <p className="font-semibold mb-1">Import Errors:</p>
              <ul className="list-disc pl-4 space-y-1">
                {importErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
