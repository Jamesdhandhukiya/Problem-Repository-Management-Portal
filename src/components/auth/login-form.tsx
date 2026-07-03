"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/validations";
import { isStudentEmail } from "@/lib/student-utils";
import { autoConfirmStudentEmailAction } from "@/app/actions";

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

  // Handle Supabase auth redirect errors (e.g. expired email verification links)
  useEffect(() => {
    const errorCode = searchParams.get("error_code");
    const errorDesc = searchParams.get("error_description");

    if (!errorCode) return;

    if (errorCode === "otp_expired") {
      toast.error(
        "Your email verification link has expired. Log in below with the default password (depstar@charusat) to receive a new verification email.",
        { duration: 10000 }
      );
    } else if (errorCode === "access_denied") {
      toast.error(
        errorDesc
          ? decodeURIComponent(errorDesc.replace(/\+/g, " "))
          : "Access denied. Please try logging in again.",
        { duration: 8000 }
      );
    } else if (errorDesc) {
      toast.error(decodeURIComponent(errorDesc.replace(/\+/g, " ")), { duration: 8000 });
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  async function onSubmit(data: LoginInput) {
    setLoading(true);
    const supabase = createClient();

    const DEFAULT_PASSWORD = "depstar@charusat";
    const studentEmail = isStudentEmail(data.email);

    // Helper function to handle post-login redirects and setup checks
    async function handlePostLoginRedirect() {
      const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
      router.push(redirectTo);
      router.refresh();
    }

    // Helper function to auto-confirm the email in the DB and complete the login
    async function attemptAutoConfirmAndLogin(password: string) {
      // 1. Call server action to update email_confirmed_at directly in Postgres
      const confirmResult = await autoConfirmStudentEmailAction(data.email);
      if (confirmResult.error) {
        toast.error("Failed to auto-verify account: " + confirmResult.error, { duration: 8000 });
        setLoading(false);
        return;
      }

      // 2. Add a small delay to allow GoTrue/Postgres to settle and avoid race conditions
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 3. Retry signing in now that the email is marked confirmed
      const { error: retryErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: password,
      });

      if (retryErr) {
        toast.error("Verified account, but login failed: " + retryErr.message, { duration: 8000 });
        setLoading(false);
        return;
      }

      // 3. Complete redirect
      await handlePostLoginRedirect();
    }

    try {
      const finalPassword = data.password.length < 6 ? data.password.padEnd(6, '0') : data.password;

      // ── Step 1: Try to sign in ──────────────────────────────────────────────
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: finalPassword,
      });

      if (!loginErr) {
        await handlePostLoginRedirect();
        return;
      }

      // ── Step 2: Login failed ────────────────────────────────────────────────
      const errMsg = loginErr.message.toLowerCase();

      // Catch "Email not confirmed" during sign in — bypass by auto-confirming
      if (studentEmail && (errMsg.includes("confirm") || errMsg.includes("verified"))) {
        if (data.password !== DEFAULT_PASSWORD) {
          toast.error(
            "Your account is registered but not confirmed yet. Please log in with the default password (depstar@charusat) to auto-verify your account.",
            { duration: 8000 }
          );
          setLoading(false);
          return;
        }
        await attemptAutoConfirmAndLogin(DEFAULT_PASSWORD);
        return;
      }

      if (!studentEmail) {
        // Non-student (staff/admin): show clean error and stop
        toast.error(
          errMsg.includes("invalid") || errMsg.includes("credentials")
            ? "Incorrect email or password. Please try again."
            : loginErr.message
        );
        setLoading(false);
        return;
      }

      // ── Step 3: Student login failed ────────────────────────────────────────
      // Only auto-register if the entered password is exactly the default
      if (data.password !== DEFAULT_PASSWORD) {
        toast.error(
          "First-time login? Use the default password: depstar@charusat\n\nIf you have already set a custom password, enter that instead.",
          { duration: 7000 }
        );
        setLoading(false);
        return;
      }

      // ── Step 4: Default password entered — auto-register ───────────────────
      const { error: signUpErr } = await supabase.auth.signUp({
        email: data.email,
        password: DEFAULT_PASSWORD,
        options: { data: { role: "STUDENT" } },
      });

      if (signUpErr) {
        const signErrMsg = signUpErr.message.toLowerCase();
        // If user already exists but is unconfirmed
        if (signErrMsg.includes("already") || signErrMsg.includes("exists")) {
          await attemptAutoConfirmAndLogin(DEFAULT_PASSWORD);
        } else {
          toast.error("Registration failed: " + signUpErr.message);
          setLoading(false);
        }
        return;
      }

      // SignUp succeeded, but needs confirmation — let's auto-confirm and login!
      await attemptAutoConfirmAndLogin(DEFAULT_PASSWORD);
    } catch (err) {
      console.error("Unexpected login error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during login. Please try again.",
        { duration: 8000 }
      );
      setLoading(false);
    }
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
          Sign in to the Problem Repository &amp; Analytics Portal
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#333333] font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@charusat.edu.in"
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
              <Dialog>
                <DialogTrigger className={buttonVariants({ variant: "link", className: "p-0 h-auto text-sm text-[#4A89F3] hover:text-[#4A89F3]/80" })}>
                  Forgot password?
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription className="pt-2 text-base text-[#333333]">
                      To request a password reset, please contact the administrator:
                      <br /><br />
                      <strong>Email:</strong> <a href="mailto:amitnayak.it@charusat.ac.in" className="text-[#4A89F3] hover:underline">amitnayak.it@charusat.ac.in</a>
                      <br />
                      <strong>Email:</strong> <a href="mailto:jamesdhandhukiya@gmail.com" className="text-[#4A89F3] hover:underline">jamesdhandhukiya@gmail.com</a>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
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
        <p className="text-xs text-center text-[#8898AA] mt-4">
          Students: Use your <span className="font-medium text-[#4A89F3]">@charusat.edu.in</span> email with the default password.
        </p>
      </form>
    </div>
  );
}
