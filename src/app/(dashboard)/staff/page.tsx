import {
  getStaffApprovalRate,
  getStaffDashboardStats,
  getStaffSubmissionTrend,
} from "@/services/analytics.service";
import { requireRole } from "@/lib/auth";
import {
  BarChartCard,
  LineChartCard,
  StatCard,
} from "@/components/analytics/charts";

export default async function StaffDashboardPage() {
  const user = await requireRole(["STAFF"]);

  const [stats, trend, approvalRate] = await Promise.all([
    getStaffDashboardStats(user.id),
    getStaffSubmissionTrend(user.id),
    getStaffApprovalRate(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-muted-foreground">
          Track your question submissions and review status.
        </p>
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
