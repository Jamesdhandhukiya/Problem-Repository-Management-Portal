import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["MODERATOR"]);
  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
