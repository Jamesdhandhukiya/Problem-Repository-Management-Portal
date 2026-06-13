import { Badge } from "@/components/ui/badge";
import { QuestionStatus } from "@prisma/client";
import { QUESTION_STATUS_LABELS } from "@/types";

export function QuestionStatusBadge({ status }: { status: QuestionStatus }) {
  switch (status) {
    case "PUBLISHED":
    case "APPROVED":
      return <Badge className="bg-green-600 hover:bg-green-700 text-white border-transparent">{QUESTION_STATUS_LABELS[status]}</Badge>;
    case "REJECTED":
    case "CHANGES_REQUIRED":
      return <Badge variant="destructive">{QUESTION_STATUS_LABELS[status]}</Badge>;
    case "SUBMITTED":
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent">{QUESTION_STATUS_LABELS[status]}</Badge>;
    case "DRAFT":
    default:
      return <Badge variant="secondary">{QUESTION_STATUS_LABELS[status]}</Badge>;
  }
}
