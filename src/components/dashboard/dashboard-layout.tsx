"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { User } from "@prisma/client";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { getNavItems, DashboardHeader } from "@/components/dashboard/header";
import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs";

export function DashboardLayout({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = getNavItems(user.role);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b px-4 py-4 group-data-[collapsible=icon]:p-2">
          <Link href={`/${user.role.toLowerCase()}`} className="flex flex-col w-full items-center justify-center gap-2">
            <Image 
              src="/login-image.png" 
              alt="Logo" 
              width={220} 
              height={60} 
              className="w-full h-auto object-contain group-data-[collapsible=icon]:hidden"
              priority 
            />
            <Image 
              src="/logo.webp" 
              alt="Collapsed Logo" 
              width={32} 
              height={32} 
              className="hidden size-8 object-contain group-data-[collapsible=icon]:block"
            />
            <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full group-data-[collapsible=icon]:hidden">
              {user.role === 'STAFF' ? 'Faculty' : user.role.toLowerCase()}
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={
                        pathname === item.href || pathname.startsWith(item.href + "/")
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-4 group-data-[collapsible=icon]:p-2">
          <form action={signOutAction} className="w-full flex justify-center">
            <Button 
              type="submit" 
              variant="destructive" 
              className="w-full font-semibold justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0"
              title="Log out"
            >
              <LogOut className="h-4 w-4 mr-2 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">Log out</span>
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <DashboardHeader user={user} />
        <main className="flex-1 p-4 lg:p-6">
          <DashboardBreadcrumbs />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
