import {
  getModeratorDashboardStats,
  getModeratorPendingBacklog,
  getModeratorReviewPerformance,
  getModeratorDepartmentStats,
} from "@/services/analytics.service";
import { getPreviousSession } from "@/services/user.service";
import { requireRole } from "@/lib/auth";
import { format } from "date-fns";
import {
  BarChartCard,
  PieChartCard,
  StatCard,
} from "@/components/analytics/charts";

export default async function ModeratorDashboardPage() {
  const user = await requireRole(["MODERATOR"]);

  const [stats, performance, backlog, departmentStats, previousSession] = await Promise.all([
    getModeratorDashboardStats(),
    getModeratorReviewPerformance(),
    getModeratorPendingBacklog(),
    getModeratorDepartmentStats(),
    getPreviousSession(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">
            Review performance and pending question backlog.
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg flex flex-col shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Last Session</span>
          <span className="text-sm font-medium">{previousSession ? format(new Date(previousSession), "PPp") : "First Session"}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Pending Reviews" value={stats.pendingReviews} />
        <StatCard title="Total Approved" value={stats.totalApproved} />
        <StatCard title="Total Rejected" value={stats.totalRejected} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BarChartCard
          title="Overall Question Statuses"
          description="Platform wide question status breakdown"
          data={performance}
        />
        <PieChartCard
          title="Pending Backlog"
          description="Questions awaiting review by status"
          data={backlog}
        />
        <BarChartCard
          title="Department Submissions"
          description="All time submissions by department"
          data={departmentStats}
        />
      </div>
    </div>
  );
}
