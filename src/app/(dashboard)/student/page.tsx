import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getStudentDashboardStats,
  getStudentDifficultyProgress,
  getStudentTopicProgress,
} from "@/services/analytics.service";
import {
  BarChartCard,
  PieChartCard,
  StatCard,
} from "@/components/analytics/charts";

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  // First-time login — redirect to setup
  if (!user) {
    redirect("/student/setup");
  }

  if (user.role !== "STUDENT") {
    redirect("/login");
  }


  const [stats, topicProgress, difficultyProgress] = await Promise.all([
    getStudentDashboardStats(user.id),
    getStudentTopicProgress(user.id),
    getStudentDifficultyProgress(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-muted-foreground">
          Track your progress solving programming problems.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Questions Solved" value={stats.questionsSolved} />
        <StatCard title="Bookmarked Questions" value={stats.bookmarkedQuestions} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BarChartCard
          title="Topic-wise Progress"
          description="Problems solved by topic"
          data={topicProgress}
        />
        <PieChartCard
          title="Difficulty-wise Progress"
          description="Problems solved by difficulty"
          data={difficultyProgress}
        />
      </div>
    </div>
  );
}
