import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  getApprovalReportData,
  getFacultyReportData,
  getQuestionsReportData,
} from "@/services/analytics.service";

type ReportType = "questions" | "faculty" | "approval";

interface AutoTableDoc extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export async function generatePdfReport(type: ReportType): Promise<Buffer> {
  const doc: AutoTableDoc = new jsPDF();

  const titles = {
    questions: "Questions Report",
    faculty: "Faculty Contribution Report",
    approval: "Approval Report",
  };

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(titles[type], 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);

  if (type === "questions") {
    const data = await getQuestionsReportData();

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Total Questions: ${data.length}`, 14, 33);

    // 1. Overview Summary Table
    autoTable(doc, {
      startY: 37,
      head: [["#", "Title", "Topic / Domain", "Difficulty", "Status", "Author", "Department"]],
      body: data.map((q, idx) => [
        idx + 1,
        q.title,
        q.topic.name,
        q.difficulty,
        q.status,
        q.createdBy?.name || "N/A",
        q.createdBy?.department || "N/A",
      ]),
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8 },
    });

    let currentY = (doc.lastAutoTable?.finalY ?? 37) + 12;

    // 2. Detailed Question Cards
    for (let idx = 0; idx < data.length; idx++) {
      const q = data[idx];

      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      // Question Header Box
      autoTable(doc, {
        startY: currentY,
        head: [[`Question #${idx + 1}: ${q.title}`]],
        headStyles: {
          fillColor: [37, 99, 235],
          fontSize: 10,
          fontStyle: "bold",
          textColor: [255, 255, 255],
        },
        margin: { left: 14, right: 14 },
      });
      currentY = doc.lastAutoTable?.finalY ?? currentY;

      // Metadata Grid
      const metadataRows = [
        [
          `Topic / Domain: ${q.topic.name}`,
          `Author: ${q.createdBy?.name || "N/A"}`,
        ],
        [
          `Difficulty: ${q.difficulty}`,
          `Department: ${q.createdBy?.department || "N/A"}`,
        ],
        [
          `Status: ${q.status}`,
          `Time / Space: ${q.expectedTimeComplexity || "N/A"} / ${q.expectedSpaceComplexity || "N/A"}`,
        ],
        [
          `Created: ${new Date(q.createdAt).toLocaleDateString()}`,
          `Updated: ${new Date(q.updatedAt).toLocaleDateString()}`,
        ],
      ];

      autoTable(doc, {
        startY: currentY,
        body: metadataRows,
        styles: { fontSize: 8, cellPadding: 2.5 },
        theme: "plain",
        margin: { left: 14, right: 14 },
      });
      currentY = doc.lastAutoTable?.finalY ?? currentY;

      // Detailed Fields Section
      const detailsBody: [string, string][] = [];

      if (q.statement) {
        detailsBody.push(["Problem Description", q.statement]);
      }
      if (q.constraints) {
        detailsBody.push(["Constraints", q.constraints]);
      }
      if (q.inputFormat) {
        detailsBody.push(["Input Format", q.inputFormat]);
      }
      if (q.outputFormat) {
        detailsBody.push(["Output Format", q.outputFormat]);
      }
      if (q.sampleInput) {
        detailsBody.push(["Sample Input", q.sampleInput]);
      }
      if (q.sampleOutput) {
        detailsBody.push(["Sample Output", q.sampleOutput]);
      }
      if (q.hiddenTestCases) {
        detailsBody.push(["Hidden Test Cases", q.hiddenTestCases]);
      }
      if (q.solutionApproach) {
        detailsBody.push(["Solution / Approach", q.solutionApproach]);
      }
      if (Array.isArray(q.tags) && q.tags.length > 0) {
        detailsBody.push(["Tags", q.tags.join(", ")]);
      }
      if (Array.isArray(q.companyTags) && q.companyTags.length > 0) {
        detailsBody.push(["Company Tags", q.companyTags.join(", ")]);
      }
      if (Array.isArray(q.referenceLinks) && q.referenceLinks.length > 0) {
        detailsBody.push(["Reference Links", q.referenceLinks.join(", ")]);
      }

      if (detailsBody.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [["Field", "Details"]],
          body: detailsBody,
          columnStyles: {
            0: { cellWidth: 40, fontStyle: "bold", fillColor: [248, 250, 252] },
            1: { cellWidth: "auto" },
          },
          styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
          headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
          margin: { left: 14, right: 14 },
        });
        currentY = (doc.lastAutoTable?.finalY ?? currentY) + 10;
      } else {
        currentY += 10;
      }
    }
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
      headStyles: { fillColor: [30, 41, 59] },
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
      headStyles: { fillColor: [30, 41, 59] },
    });
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export async function generateExcelReport(type: ReportType): Promise<Buffer> {
  let rows: Record<string, unknown>[] = [];

  if (type === "questions") {
    const data = await getQuestionsReportData();
    rows = data.map((q, idx) => ({
      "S.No": idx + 1,
      Title: q.title,
      "Topic / Domain": q.topic.name,
      Difficulty: q.difficulty,
      Status: q.status,
      "Problem Statement / Description": q.statement || "",
      Constraints: q.constraints || "",
      "Input Format": q.inputFormat || "",
      "Output Format": q.outputFormat || "",
      "Sample Input": q.sampleInput || "",
      "Sample Output": q.sampleOutput || "",
      "Hidden Test Cases": q.hiddenTestCases || "",
      "Solution / Solution Approach": q.solutionApproach || "",
      "Time Complexity": q.expectedTimeComplexity || "",
      "Space Complexity": q.expectedSpaceComplexity || "",
      Tags: Array.isArray(q.tags) ? q.tags.join(", ") : "",
      "Company Tags": Array.isArray(q.companyTags) ? q.companyTags.join(", ") : "",
      "Reference Links": Array.isArray(q.referenceLinks) ? q.referenceLinks.join(", ") : "",
      "Author Name": q.createdBy?.name || "",
      "Author Department": q.createdBy?.department || "",
      "Created At": new Date(q.createdAt).toLocaleString(),
      "Updated At": new Date(q.updatedAt).toLocaleString(),
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

  if (type === "questions" && rows.length > 0) {
    const colKeys = Object.keys(rows[0]);
    worksheet["!cols"] = colKeys.map((key) => {
      if (
        key === "Problem Statement / Description" ||
        key === "Solution / Solution Approach" ||
        key === "Constraints" ||
        key === "Input Format" ||
        key === "Output Format" ||
        key === "Sample Input" ||
        key === "Sample Output" ||
        key === "Hidden Test Cases"
      ) {
        return { wch: 40 };
      }
      return { wch: Math.max(key.length + 3, 15) };
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer);
}
