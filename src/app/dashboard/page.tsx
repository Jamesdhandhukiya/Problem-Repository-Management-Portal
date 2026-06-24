import { redirect } from "next/navigation";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logLogin } from "@/services/user.service";
import { isStudentEmail } from "@/lib/student-utils";


export default async function DashboardRedirectPage() {
  const user = await getCurrentUser();

  if (!user) {
    // Check if authenticated student with no DB profile → send to setup
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser?.email && isStudentEmail(authUser.email)) {
      redirect("/student/setup");
    }
    redirect("/login");
  }

  await logLogin(user.id);
  redirect(getDashboardPath(user.role));
}
