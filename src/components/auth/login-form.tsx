"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginSchema, type LoginInput } from "@/validations";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-left pt-0 pb-6">
        <div className="mb-6">
          <img
            src="/login-image.png"
            alt="Charusat Logo"
            className="h-16 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="h-16 w-16 bg-[#4A89F3] text-white flex items-center justify-center font-bold text-3xl rounded-xl">C</div>';
            }}
          />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-[#203159]">Welcome back</h2>
        <p className="text-[#8898AA] text-base mt-1.5">
          Sign in to the Problem Repository & Analytics Portal
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#333333] font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@university.edu"
              className="border-gray-300 focus-visible:border-[#4A89F3] focus-visible:ring-4 focus-visible:ring-[#4A89F3]/10 bg-white h-11 text-[#333333] placeholder:text-[#8898AA] transition-all"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-[#FFB84D] font-medium">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[#333333] font-medium">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#4A89F3] hover:text-[#203159] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="border-gray-300 focus-visible:border-[#4A89F3] focus-visible:ring-4 focus-visible:ring-[#4A89F3]/10 bg-white h-11 text-[#333333] pr-10 transition-all"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-[#FFB84D] font-medium">{errors.password.message}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-6">
          <Button type="submit" className="w-full h-11 bg-[#4A89F3] hover:bg-[#4A89F3]/90 text-white font-medium text-base shadow-md transition-all active:scale-[0.98]" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </div>
      </form>
    </div>
  );
}
