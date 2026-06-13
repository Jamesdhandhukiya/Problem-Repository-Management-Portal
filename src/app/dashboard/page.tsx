import { redirect } from "next/navigation";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { logLogin } from "@/services/user.service";

export default async function DashboardRedirectPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await logLogin(user.id);
  redirect(getDashboardPath(user.role));
}
