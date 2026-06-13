"use client";

import { useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNotificationStore } from "@/store";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell({ userId }: { userId: string }) {
  const { notifications, unreadCount, setNotifications, setUnreadCount, markRead } =
    useNotificationStore();

  useEffect(() => {
    async function fetchNotifications() {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    }
    fetchNotifications();
  }, [userId, setNotifications, setUnreadCount]);

  async function handleMarkRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    markRead(id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" />}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 p-3"
              onClick={() => !n.isRead && handleMarkRead(n.id)}
            >
              <div className="flex w-full items-center justify-between">
                <span className={`text-sm font-medium ${!n.isRead ? "text-primary" : ""}`}>
                  {n.title}
                </span>
                {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
