import { requireAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
