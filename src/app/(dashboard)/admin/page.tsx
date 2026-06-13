import {
  getAdminDashboardStats,
  getFacultyContribution,
  getMonthlySubmissions,
  getQuestionsByDifficulty,
  getQuestionsByTopic,
} from "@/services/analytics.service";
import {
  BarChartCard,
  LineChartCard,
  PieChartCard,
  StatCard,
} from "@/components/analytics/charts";
import { requireRole } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const user = await requireRole(["ADMIN"]);
  const [stats, byDifficulty, byTopic, monthly, faculty] = await Promise.all([
    getAdminDashboardStats(),
    getQuestionsByDifficulty(),
    getQuestionsByTopic(),
    getMonthlySubmissions(),
    getFacultyContribution(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-muted-foreground">
          System overview and analytics for the problem repository.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Questions" value={stats.totalQuestions} />
        <StatCard title="Approved" value={stats.approvedQuestions} />
        <StatCard title="Rejected" value={stats.rejectedQuestions} />
        <StatCard title="Pending" value={stats.pendingQuestions} />
        <StatCard title="Active Faculty" value={stats.activeFaculty} />
        <StatCard title="Active Students" value={stats.activeStudents} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BarChartCard
          title="Questions by Difficulty"
          description="Distribution across difficulty levels"
          data={byDifficulty}
        />
        <PieChartCard
          title="Questions by Topic"
          description="Topic-wise distribution"
          data={byTopic}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LineChartCard
          title="Monthly Submissions"
          description="Question submissions over the last 6 months"
          data={monthly}
        />
        <BarChartCard
          title="Faculty Contribution"
          description="Top contributors by question count"
          data={faculty}
        />
      </div>
    </div>
  );
}
