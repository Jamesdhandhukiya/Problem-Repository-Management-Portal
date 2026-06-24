import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { StudentSetupDialog } from "../../../../components/auth/student-setup-dialog";
import { detectDepartmentFromEmail } from "@/lib/student-utils";


export default async function StudentSetupPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Must be authenticated
  if (!authUser || !authUser.email) {
    redirect("/login");
  }

  // If DB profile already exists, go to dashboard
  const existing = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });
  if (existing) {
    redirect("/student");
  }

  const department = detectDepartmentFromEmail(authUser.email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E5EEFF] px-4">
      <StudentSetupDialog
        email={authUser.email}
        detectedDepartment={department}
      />
    </div>
  );
}
