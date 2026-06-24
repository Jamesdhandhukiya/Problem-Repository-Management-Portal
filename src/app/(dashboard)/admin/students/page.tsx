import { getUsers } from "@/services/user.service";
import { StudentManagementTable } from "@/components/dashboard/student-management";

export default async function AdminStudentsPage() {
  const users = await getUsers();
  return <StudentManagementTable users={users} />;
}
