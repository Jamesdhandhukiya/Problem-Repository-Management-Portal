import { getUsers } from "@/services/user.service";
import { StaffManagementTable } from "@/components/dashboard/staff-management";

export default async function AdminStaffPage() {
  const users = await getUsers();
  return <StaffManagementTable users={users} />;
}
