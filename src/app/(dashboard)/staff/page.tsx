import {
  getStaffApprovalRate,
  getStaffDashboardStats,
  getStaffSubmissionTrend,
} from "@/services/analytics.service";
import { getPreviousSession } from "@/services/user.service";
import { requireRole } from "@/lib/auth";
import { format } from "date-fns";
import {
  BarChartCard,
  LineChartCard,
  StatCard,
} from "@/components/analytics/charts";

export default async function StaffDashboardPage() {
  const user = await requireRole(["STAFF"]);

  const [stats, trend, approvalRate, previousSession] = await Promise.all([
    getStaffDashboardStats(user.id),
    getStaffSubmissionTrend(user.id),
    getStaffApprovalRate(user.id),
    getPreviousSession(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">
            Track your question submissions and review status.
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg flex flex-col shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Last Session</span>
          <span className="text-sm font-medium">{previousSession ? format(new Date(previousSession), "PPp") : "First Session"}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Submitted" value={stats.totalSubmitted} />
        <StatCard title="Approved" value={stats.approved} />
        <StatCard title="Rejected" value={stats.rejected} />
        <StatCard title="Under Review" value={stats.underReview} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LineChartCard
          title="Submission Trend"
          description="Your submissions over the last 6 months"
          data={trend}
        />
        <BarChartCard
          title="Approval Rate"
          description="Approved vs rejected questions"
          data={approvalRate.filter((d) => d.name !== "Approval Rate %")}
        />
      </div>
    </div>
  );
}
