"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions";

export function SessionGate({
  children,
  isLoggedIn,
}: {
  children: React.ReactNode;
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Exclude public authentication pages
    const isPublicRoute = [
      "/login",
      "/forgot-password",
      "/reset-password",
      "/auth/callback",
    ].some((route) => pathname.startsWith(route));

    if (isLoggedIn && !isPublicRoute && pathname !== "/") {
      const active = sessionStorage.getItem("portal_session_active");
      if (!active) {
        // Tab session was cleared because the tab/window was closed.
        // Perform clean logout
        signOutAction().then(() => {
          router.replace("/login");
        });
      }
    } else if (isLoggedIn && isPublicRoute) {
      sessionStorage.setItem("portal_session_active", "true");
    } else if (!isLoggedIn) {
      sessionStorage.removeItem("portal_session_active");
    }
  }, [pathname, isLoggedIn, router]);

  // Set active session flag on user interaction or first-render login status
  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.setItem("portal_session_active", "true");
    }
  }, [isLoggedIn]);

  return <>{children}</>;
}
