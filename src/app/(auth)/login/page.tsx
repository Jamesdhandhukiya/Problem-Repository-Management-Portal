import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="relative h-screen w-full flex items-center justify-center lg:justify-start px-4 sm:px-8 md:px-12 lg:px-24 py-6 overflow-hidden bg-[#E5EEFF]">
      {/* Full screen background image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/login.png"
          alt="Login Portal Background"
          fill
          className="object-cover object-center"
          priority
          quality={100}
        />
      </div>

      {/* Floating Login Box on top */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:ml-12 border border-white">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
