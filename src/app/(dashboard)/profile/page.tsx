import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";

export default async function ProfilePage() {
  const user = await requireAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[#203159]">Edit Profile</h2>
        <p className="text-muted-foreground mt-2">Manage your personal information and account security.</p>
      </div>

      <div className="grid gap-8">
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-xl text-[#203159]">Personal Information</CardTitle>
            <CardDescription>Update your display name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#333333] font-medium">Full Name</Label>
              <Input id="name" defaultValue={user.name} className="focus-visible:ring-[#4A89F3] focus-visible:border-[#4A89F3] h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#333333] font-medium">Email Address</Label>
              <Input id="email" defaultValue={user.email} disabled className="bg-gray-50 text-gray-500 h-11" />
              <p className="text-xs text-muted-foreground pt-1">Email address cannot be changed.</p>
            </div>
            <div className="pt-2">
              <Button className="bg-[#4A89F3] hover:bg-[#4A89F3]/90 text-white shadow-sm h-10 px-6">Save Information</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-xl text-[#203159]">Change Password</CardTitle>
            <CardDescription>Update your account password to stay secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
