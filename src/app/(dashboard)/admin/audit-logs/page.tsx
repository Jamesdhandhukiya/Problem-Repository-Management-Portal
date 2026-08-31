import { format } from "date-fns";
import { getAuditLogs } from "@/services/audit.service";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AuditLogsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const roleFilter = typeof searchParams.role === 'string' ? searchParams.role : undefined;

  const [{ data: logs }, sessionLogs] = await Promise.all([
    getAuditLogs({ 
      limit: 50, 
      ...(roleFilter ? { role: roleFilter as any } : {}) // Audit log service doesn't naturally support this without Prisma where clause directly, wait!
    }),
    prisma.sessionLog.findMany({
      where: roleFilter ? { user: { role: roleFilter as any } } : undefined,
      orderBy: { loginAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, role: true, email: true } } }
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            System activity and change history.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by:</span>
          <Button variant={!roleFilter ? "default" : "outline"} size="sm" asChild>
            <Link href="/admin/audit-logs">All</Link>
          </Button>
          <Button variant={roleFilter === "ADMIN" ? "default" : "outline"} size="sm" asChild>
            <Link href="/admin/audit-logs?role=ADMIN">Admin</Link>
          </Button>
          <Button variant={roleFilter === "MODERATOR" ? "default" : "outline"} size="sm" asChild>
            <Link href="/admin/audit-logs?role=MODERATOR">Moderator</Link>
          </Button>
          <Button variant={roleFilter === "STAFF" ? "default" : "outline"} size="sm" asChild>
            <Link href="/admin/audit-logs?role=STAFF">Staff</Link>
          </Button>
          <Button variant={roleFilter === "STUDENT" ? "default" : "outline"} size="sm" asChild>
            <Link href="/admin/audit-logs?role=STUDENT">Students</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="audit">System Actions</TabsTrigger>
          <TabsTrigger value="sessions">Login Sessions</TabsTrigger>
        </TabsList>
        <TabsContent value="audit">
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{log.user?.name ?? "System"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.module}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="sessions">
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Logout Time</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionLogs.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.user.name}
                      <span className="block text-xs text-muted-foreground">{session.user.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{session.user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(session.loginAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {session.logoutAt ? format(new Date(session.logoutAt), "MMM d, yyyy HH:mm") : <span className="text-green-500 font-medium text-xs">ACTIVE</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {session.duration ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
