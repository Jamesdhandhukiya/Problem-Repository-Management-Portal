import {
  getModeratorDashboardStats,
  getModeratorPendingBacklog,
  getModeratorReviewPerformance,
} from "@/services/analytics.service";
import { requireRole } from "@/lib/auth";
import {
  BarChartCard,
  PieChartCard,
  StatCard,
} from "@/components/analytics/charts";

export default async function ModeratorDashboardPage() {
  const user = await requireRole(["MODERATOR"]);

  const [stats, performance, backlog] = await Promise.all([
    getModeratorDashboardStats(user.id),
    getModeratorReviewPerformance(user.id),
    getModeratorPendingBacklog(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-muted-foreground">
          Review performance and pending question backlog.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Pending Reviews" value={stats.pendingReviews} />
        <StatCard title="Total Approved" value={stats.totalApproved} />
        <StatCard title="Total Rejected" value={stats.totalRejected} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BarChartCard
          title="Review Performance"
          description="Your review actions breakdown"
          data={performance}
        />
        <PieChartCard
          title="Pending Backlog"
          description="Questions awaiting review by status"
          data={backlog}
        />
      </div>
    </div>
  );
}
