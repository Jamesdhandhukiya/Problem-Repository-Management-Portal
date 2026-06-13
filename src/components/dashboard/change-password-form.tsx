"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updatePasswordAction } from "@/app/actions";

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await updatePasswordAction(formData);
    
    // If it succeeds, the server action will redirect and the client will unmount.
    // If it fails, it returns an error object.
    if (res?.error) {
      toast.error(res.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="current-password" className="text-[#333333] font-medium">Current Password</Label>
        <Input id="current-password" name="current-password" type="password" required className="focus-visible:ring-[#4A89F3] focus-visible:border-[#4A89F3] h-11" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-[#333333] font-medium">New Password</Label>
          <Input id="new-password" name="new-password" type="password" required minLength={6} className="focus-visible:ring-[#4A89F3] focus-visible:border-[#4A89F3] h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-[#333333] font-medium">Confirm New Password</Label>
          <Input id="confirm-password" name="confirm-password" type="password" required minLength={6} className="focus-visible:ring-[#4A89F3] focus-visible:border-[#4A89F3] h-11" />
        </div>
      </div>
      <div className="pt-2">
        <Button type="submit" variant="outline" disabled={loading} className="border-gray-200 text-[#203159] hover:bg-gray-50 h-10 px-6">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Password
        </Button>
      </div>
    </form>
  );
}
