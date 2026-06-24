import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ROLE_DASHBOARD_PATHS } from "@/types";

import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  if (!dbUser || dbUser.status === "DISABLED") return null;

  return dbUser;
});

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect(ROLE_DASHBOARD_PATHS[user.role]);
  }
  return user;
}

export function getDashboardPath(role: UserRole) {
  return ROLE_DASHBOARD_PATHS[role];
}
