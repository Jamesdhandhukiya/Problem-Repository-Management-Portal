import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["STUDENT"]);
  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
