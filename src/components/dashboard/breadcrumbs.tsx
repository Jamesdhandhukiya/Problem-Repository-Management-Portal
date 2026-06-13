"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const LABELS: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  moderator: "Moderator",
  student: "Student",
  questions: "Questions",
  students: "Students",
  users: "Users",
  reviews: "Reviews",
  reports: "Reports",
  bookmarks: "Bookmarks",
  solved: "Solved",
  new: "New",
  search: "Search",
  "audit-logs": "Audit Logs",
};

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          
          let label = LABELS[segment];
          if (!label) {
            // Check if segment looks like a CUID or UUID
            if (segment.length >= 20 && /^[a-z0-9-]+$/i.test(segment)) {
              label = "Details";
            } else {
              label = segment.charAt(0).toUpperCase() + segment.slice(1);
            }
          }

          return (
            <Fragment key={href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
