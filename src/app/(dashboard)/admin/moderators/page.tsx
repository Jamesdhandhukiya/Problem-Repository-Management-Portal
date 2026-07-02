import { getUsers } from "@/services/user.service";
import { ModeratorManagementTable } from "@/components/dashboard/moderator-management";

export default async function AdminModeratorsPage() {
  const users = await getUsers();
  return <ModeratorManagementTable users={users} />;
}
