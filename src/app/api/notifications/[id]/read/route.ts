import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markNotificationRead } from "@/services/notification.service";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await markNotificationRead(id, user.id);
  return NextResponse.json({ success: true });
}
