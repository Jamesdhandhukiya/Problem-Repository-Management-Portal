import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dbUser = await getCurrentUser();

  if (dbUser) {
    if (dbUser.role !== "STUDENT") {
      redirect("/login");
    }
    return <DashboardLayout user={dbUser}>{children}</DashboardLayout>;
  }

  // If no DB user, verify if they have a valid Supabase auth session (first-time onboarding)
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  // Authenticated but no DB profile — only the /student/setup route is allowed
  return <>{children}</>;
}
