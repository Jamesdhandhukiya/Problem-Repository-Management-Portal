import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  getApprovalReportData,
  getFacultyReportData,
  getQuestionsReportData,
} from "@/services/analytics.service";

type ReportType = "questions" | "faculty" | "approval";

export async function generatePdfReport(type: ReportType): Promise<Buffer> {
  const doc = new jsPDF();

  const titles = {
    questions: "Questions Report",
    faculty: "Faculty Contribution Report",
    approval: "Approval Report",
  };

  doc.setFontSize(18);
  doc.text(titles[type], 14, 22);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  if (type === "questions") {
    const data = await getQuestionsReportData();
    autoTable(doc, {
      startY: 38,
      head: [["Title", "Topic", "Difficulty", "Status", "Author", "Created"]],
      body: data.map((q) => [
        q.title,
        q.topic.name,
        q.difficulty,
        q.status,
        q.createdBy.name,
        new Date(q.createdAt).toLocaleDateString(),
      ]),
    });
  }

  if (type === "faculty") {
    const data = await getFacultyReportData();
    autoTable(doc, {
      startY: 38,
      head: [["Name", "Email", "Total Questions", "Published", "Rejected"]],
      body: data.map((u) => {
        const published = u.questionsCreated.filter(
          (q) => q.status === "PUBLISHED" || q.status === "APPROVED"
        ).length;
        const rejected = u.questionsCreated.filter((q) => q.status === "REJECTED").length;
        return [u.name, u.email, u._count.questionsCreated, published, rejected];
      }),
    });
  }

  if (type === "approval") {
    const data = await getApprovalReportData();
    autoTable(doc, {
      startY: 38,
      head: [["Question", "Moderator", "Status", "Reviewed At"]],
      body: data.map((r) => [
        r.question.title,
        r.moderator.name,
        r.status,
        new Date(r.reviewedAt).toLocaleString(),
      ]),
    });
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export async function generateExcelReport(type: ReportType): Promise<Buffer> {
  let rows: Record<string, unknown>[] = [];

  if (type === "questions") {
    const data = await getQuestionsReportData();
    rows = data.map((q) => ({
      Title: q.title,
      Topic: q.topic.name,
      Difficulty: q.difficulty,
      Status: q.status,
      Author: q.createdBy.name,
      Email: q.createdBy.email,
      Created: q.createdAt,
    }));
  }

  if (type === "faculty") {
    const data = await getFacultyReportData();
    rows = data.map((u) => ({
      Name: u.name,
      Email: u.email,
      "Total Questions": u._count.questionsCreated,
      Published: u.questionsCreated.filter(
        (q) => q.status === "PUBLISHED" || q.status === "APPROVED"
      ).length,
      Rejected: u.questionsCreated.filter((q) => q.status === "REJECTED").length,
    }));
  }

  if (type === "approval") {
    const data = await getApprovalReportData();
    rows = data.map((r) => ({
      Question: r.question.title,
      Moderator: r.moderator.name,
      Status: r.status,
      "Reviewed At": r.reviewedAt,
    }));
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer);
}
