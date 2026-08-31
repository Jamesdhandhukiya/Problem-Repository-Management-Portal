import {
  getAdminDashboardStats,
  getFacultyContribution,
  getMonthlySubmissions,
  getQuestionsByDifficulty,
  getQuestionsByTopic,
  getWeeklyAccessGraph,
  getMonthlyStudentLogins,
  getLastLogins,
} from "@/services/analytics.service";
import { getPreviousSession } from "@/services/user.service";
import {
  BarChartCard,
  LineChartCard,
  StatCard,
  DistributionListCard,
} from "@/components/analytics/charts";
import { requireRole } from "@/lib/auth";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminDashboardPage() {
  const user = await requireRole(["ADMIN"]);
  const [stats, byDifficulty, byTopic, monthly, faculty, weeklyAccess, monthlyStudents, lastLogins, previousSession] = await Promise.all([
    getAdminDashboardStats(),
    getQuestionsByDifficulty(),
    getQuestionsByTopic(),
    getMonthlySubmissions(),
    getFacultyContribution(),
    getWeeklyAccessGraph(),
    getMonthlyStudentLogins(),
    getLastLogins(),
    getPreviousSession(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">
            System overview and analytics for the problem repository.
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg flex flex-col shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Last Session</span>
          <span className="text-sm font-medium">{previousSession ? format(new Date(previousSession), "PPp") : "First Session"}</span>
        </div>
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
        <DistributionListCard
          title="Question by Domain"
          description="Domain-wise distribution"
          data={byTopic}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LineChartCard
          title="Monthly Submissions"
          description="Question submissions over the last 6 months"
          data={monthly}
        />
        <DistributionListCard
          title="Faculty distribution"
          description="Top contributors by question count"
          data={faculty}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LineChartCard
          title="Weekly Access Duration"
          description="Total access time across all users (in minutes)"
          data={weeklyAccess}
        />
        <BarChartCard
          title="Monthly Student Logins"
          description="Total student logins per month"
          data={monthlyStudents}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff & Moderator Activity</CardTitle>
          <CardDescription>Recent login history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastLogins.map((u, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {u.lastLoginAt ? format(new Date(u.lastLoginAt), "PPp") : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
