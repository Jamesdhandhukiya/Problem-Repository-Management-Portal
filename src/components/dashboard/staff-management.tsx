"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, UserPlus, Edit, ChevronDown, ChevronRight, Upload } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@prisma/client";
import { createUserAction, updateUserAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { createUserSchema, type CreateUserInput } from "@/validations";
import { USER_ROLE_LABELS } from "@/types";

type UserWithCount = User & { _count?: { questionsCreated: number } };

const DOMAINS = [
  "Web Development",
  "Full Stack Development",
  "AI/ML",
  "Data Science",
  "Cloud Computing",
  "DevOps",
  "Cybersecurity",
  "Mobile App Development",
  "UI/UX Design",
  "IoT",
];

export function StaffManagementTable({ users }: { users: UserWithCount[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithCount | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast.error("CSV file is empty or has no data rows");
        setLoading(false);
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const data: any = { role: "STAFF" };

        headers.forEach((h, idx) => {
          if (h === "name") data.name = values[idx];
          if (h === "email") data.email = values[idx];
          if (h === "password") data.password = values[idx];
          if (h === "domain") data.domain = values[idx];
        });

        if (!data.name || !data.email || !data.password) {
          errorCount++;
          continue;
        }

        const res = await createUserAction(data as unknown as CreateUserInput);
        if (res.error) errorCount++;
        else successCount++;
      }

      toast.success(`Import completed: ${successCount} added, ${errorCount} failed`);
      router.refresh();
    } catch (err: any) {
      toast.error("Failed to parse CSV: " + err.message);
    }
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "STAFF" },
  });

  const staffUsers = users.filter((u) => u.role === "STAFF" || u.role === "MODERATOR");

  const groupedUsers = useMemo(() => {
    const groups: Record<string, UserWithCount[]> = {};
    staffUsers.forEach((user) => {
      const domain = user.domain || "Unassigned";
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(user);
    });
    return groups;
  }, [staffUsers]);

  const domainHasModerator = (domain: string) => {
    return staffUsers.some((u) => u.domain === domain && u.role === "MODERATOR");
  };

  async function onCreate(data: CreateUserInput) {
    setLoading(true);
    const result = await createUserAction(data);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Staff created successfully");
    setOpen(false);
    reset();
    router.refresh();
  }

  async function onEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const isModerator = formData.get("isModerator") === "on";
    const domain = formData.get("domain") as string;
    const name = formData.get("name") as string;
    
    let newRole = selectedUser.role;
    if (isModerator) {
      newRole = "MODERATOR";
    } else if (selectedUser.role === "MODERATOR") {
      newRole = "STAFF";
    }

    const result = await updateUserAction(selectedUser.id, { 
      role: newRole, 
      domain: domain || null,
      name 
    });
    
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Staff updated successfully");
    setEditOpen(false);
    setSelectedUser(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage staff and moderators by domain.</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff</DialogTitle>
              <DialogDescription>
                Create a new staff member account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit((data) => onCreate(data as unknown as CreateUserInput))} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" {...register("password")} />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Domain</Label>
                <Select
                  onValueChange={(v) => setValue("domain", v as string)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 hidden">
                <Input type="hidden" {...register("role")} value="STAFF" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Plus className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedUsers).map(([domain, users]) => (
          <div key={domain} className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50"
              onClick={() => toggleDomain(domain)}
            >
              <div className="flex items-center gap-2">
                {expandedDomains[domain] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <h3 className="font-semibold text-lg">{domain}</h3>
                <Badge variant="secondary">{users.length}</Badge>
              </div>
            </div>
            
            {expandedDomains[domain] && (
              <div className="p-0 border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead className="w-[100px]">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "MODERATOR" ? "default" : "outline"}>
                            {USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user._count?.questionsCreated ?? 0}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setEditOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
            <DialogDescription>
              Update details for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={onEdit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input name="name" defaultValue={selectedUser.name} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={selectedUser.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Domain</Label>
                <Select name="domain" defaultValue={selectedUser.domain || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Moderator Privileges</Label>
                  <p className="text-sm text-muted-foreground">
                    Set this user as the moderator for their domain.
                  </p>
                </div>
                <Switch
                  name="isModerator"
                  defaultChecked={selectedUser.role === "MODERATOR"}
                  disabled={
                    selectedUser.role !== "MODERATOR" && 
                    !!selectedUser.domain && 
                    domainHasModerator(selectedUser.domain)
                  }
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
