import Link from "next/link";
import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User as UserIcon,
  Users,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import type { User } from "@prisma/client";
import { signOutAction } from "@/app/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { USER_ROLE_LABELS } from "@/types";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_BY_ROLE: Record<User["role"], NavItem[]> = {
  ADMIN: [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "Questions", href: "/admin/questions", icon: BookOpen },
    { title: "Suggestions", href: "/admin/suggestions", icon: MessageSquare },
    { title: "Staff", href: "/admin/staff", icon: Users },
    { title: "Moderators", href: "/admin/moderators", icon: Users },
    { title: "Students", href: "/admin/students", icon: GraduationCap },
    { title: "Reports", href: "/admin/reports", icon: FileText },
    { title: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardCheck },
  ],

  STAFF: [
    { title: "Dashboard", href: "/staff", icon: LayoutDashboard },
    { title: "My Questions", href: "/staff/questions", icon: BookOpen },
    { title: "Suggestions", href: "/staff/suggestions", icon: MessageSquare },
    { title: "Moderation", href: "/staff/moderation", icon: ClipboardCheck },
  ],
  MODERATOR: [
    { title: "Dashboard", href: "/moderator", icon: LayoutDashboard },
    { title: "Reviews", href: "/moderator/reviews", icon: ClipboardCheck },
  ],
  STUDENT: [
    { title: "Dashboard", href: "/student", icon: LayoutDashboard },
    { title: "Questions", href: "/student/questions", icon: BookOpen },
    { title: "Bookmarks", href: "/student/bookmarks", icon: Bell },
    { title: "Solved", href: "/student/solved", icon: BarChart3 },
  ],
};

export function getNavItems(role: User["role"]) {
  return NAV_BY_ROLE[role];
}

export function DashboardHeader({ user }: { user: User }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      <SidebarTrigger />
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger className="relative h-9 w-9 rounded-full outline-none ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {USER_ROLE_LABELS[user.role]}
                </p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/profile" className="w-full cursor-pointer" />}>
            <UserIcon className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export { NAV_BY_ROLE };
