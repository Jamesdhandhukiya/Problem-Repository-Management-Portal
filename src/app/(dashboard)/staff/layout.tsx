import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["STAFF"]);
  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
