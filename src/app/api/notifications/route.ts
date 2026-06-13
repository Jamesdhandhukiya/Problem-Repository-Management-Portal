import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getUnreadCount,
  getUserNotifications,
  markNotificationRead,
} from "@/services/notification.service";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(user.id),
    getUnreadCount(user.id),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
