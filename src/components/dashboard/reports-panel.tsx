"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const reports = [
  {
    id: "questions",
    title: "Questions Report",
    description: "Export all questions with topic, difficulty, status, and author.",
  },
  {
    id: "faculty",
    title: "Faculty Contribution Report",
    description: "Export faculty submission and approval statistics.",
  },
  {
    id: "approval",
    title: "Approval Report",
    description: "Export moderator review actions and timestamps.",
  },
];

export function ReportsPanel() {
  function downloadReport(type: string, format: "pdf" | "xlsx") {
    window.open(`/api/reports/${type}?format=${format}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and export system reports in PDF or Excel format.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReport(report.id, "pdf")}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReport(report.id, "xlsx")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
