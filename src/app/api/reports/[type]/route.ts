import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateExcelReport, generatePdfReport } from "@/services/report.service";

const VALID_TYPES = ["questions", "faculty", "approval"] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "pdf";
  const reportType = type as (typeof VALID_TYPES)[number];

  if (format === "xlsx") {
    const buffer = await generateExcelReport(reportType);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}-report.xlsx"`,
      },
    });
  }

  const buffer = await generatePdfReport(reportType);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${type}-report.pdf"`,
    },
  });
}
