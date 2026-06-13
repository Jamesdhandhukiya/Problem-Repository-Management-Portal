import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getTopics } from "@/services/question.service";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { GlobalSearch } from "@/components/questions/global-search";
import { redirect } from "next/navigation";

export default async function SearchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const topics = await getTopics();

  return (
    <DashboardLayout user={user}>
      <Suspense>
        <GlobalSearch topics={topics.map((t) => ({ id: t.id, name: t.name }))} />
      </Suspense>
    </DashboardLayout>
  );
}
