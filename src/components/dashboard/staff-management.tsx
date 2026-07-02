"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, UserPlus, Edit, Trash2, ChevronDown, ChevronRight, Upload, Search } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@prisma/client";
import { createUserAction, updateUserAction, deleteUserAction } from "@/app/actions";
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

const DEPARTMENTS = ["DCS", "DCE", "DIT"] as const;

function parseCSV(text: string, delimiter: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let currentVal = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      row.push(currentVal);
      currentVal = "";
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(currentVal);
      result.push(row);
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  if (row.length > 0 || currentVal !== "") {
    row.push(currentVal);
    result.push(row);
  }
  return result;
}

export function StaffManagementTable({ users }: { users: UserWithCount[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithCount | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  // Controlled states for editing profile
  const [editDomain, setEditDomain] = useState<string>("");
  const [editDepartment, setEditDepartment] = useState<string>("");

  const toggleDept = (dept: string) => {
    setExpandedDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      
      let delimiter = ",";
      if (text.includes(";") && !text.includes(",")) {
        delimiter = ";";
      } else if (text.includes("\t") && !text.includes(",")) {
        delimiter = "\t";
      }

      const parsedRows = parseCSV(text, delimiter);
      if (parsedRows.length <= 1) {
        toast.error("CSV file is empty or has no data rows");
        setLoading(false);
        return;
      }

      const headers = parsedRows[0].map((h) => {
        let trimmed = h.trim().toLowerCase();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          trimmed = trimmed.substring(1, trimmed.length - 1);
        }
        return trimmed;
      });

      let successCount = 0;
      let errorCount = 0;
      let firstError = "";

      for (let i = 1; i < parsedRows.length; i++) {
        const values = parsedRows[i].map((v) => {
          let trimmed = v.trim();
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            trimmed = trimmed.substring(1, trimmed.length - 1);
          }
          return trimmed;
        });

        // Skip empty rows
        if (values.length === 0 || (values.length === 1 && values[0] === "")) {
          continue;
        }

        const data: any = { role: "STAFF" };

        headers.forEach((h, idx) => {
          const val = values[idx] || "";
          if (h === "name" || h === "employee name" || h === "full name" || h === "staff name") {
            data.name = val;
          }
          if (h === "email" || h === "email address" || h === "email id") {
            data.email = val;
          }
          if (h === "password" || h === "pass") {
            data.password = val;
          }
          if (h === "domain") {
            data.domain = val;
          }
          if (h === "department" || h === "dept") {
            data.department = val;
          }
        });

        if (!data.name || !data.email || !data.password) {
          if (!firstError) {
            const missing = [];
            if (!data.name) missing.push("name");
            if (!data.email) missing.push("email");
            if (!data.password) missing.push("password");
            firstError = `Missing: ${missing.join(", ")}. Headers parsed: ${JSON.stringify(headers)}. Row ${i} values: ${JSON.stringify(values)}`;
          }
          errorCount++;
          continue;
        }

        const res = await createUserAction(data as unknown as CreateUserInput);
        if (res.error) {
          console.error(`Error importing row ${i}:`, res.error);
          if (!firstError) firstError = res.error;
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (errorCount > 0) {
        toast.error(`Import completed: ${successCount} added, ${errorCount} failed. Error: ${firstError}`);
      } else {
        toast.success(`Import completed: ${successCount} added. All rows imported successfully.`);
      }
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
    defaultValues: { role: "STAFF", domain: "", department: "" },
  });

  const staffUsers = users.filter((u) => u.role === "STAFF");

  // Filter staff by search query (name, domain, department) and selected department filter
  const filteredStaffUsers = useMemo(() => {
    return staffUsers.filter((user) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        user.name.toLowerCase().includes(q) ||
        (user.domain && user.domain.toLowerCase().includes(q)) ||
        (user.department && user.department.toLowerCase().includes(q));

      const matchesDept =
        selectedDept === "ALL" ||
        user.department === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [staffUsers, searchQuery, selectedDept]);

  const groupedUsers = useMemo(() => {
    const groups: Record<string, UserWithCount[]> = {};
    filteredStaffUsers.forEach((user) => {
      const dept = user.department || "Unassigned";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(user);
    });
    return groups;
  }, [filteredStaffUsers]);


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
    const domain = formData.get("domain") as string;
    const department = formData.get("department") as string;
    const name = formData.get("name") as string;
    
    const result = await updateUserAction(selectedUser.id, { 
      role: "STAFF", 
      domain: domain || null,
      department: department || null,
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

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }
    setLoading(true);
    const result = await deleteUserAction(userId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Staff member deleted successfully");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage staff and moderators by department.</p>
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
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    onValueChange={(v) => setValue("department", v as string)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
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

      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, domain, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={selectedDept} onValueChange={(v) => setSelectedDept(v || "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Filter Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedUsers).map(([dept, users]) => (
          <div key={dept} className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50"
              onClick={() => toggleDept(dept)}
            >
              <div className="flex items-center gap-2">
                {(expandedDepts[dept] || searchQuery.trim() !== "" || selectedDept !== "ALL") ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <h3 className="font-semibold text-lg">{dept}</h3>
                <Badge variant="secondary">{users.length}</Badge>
              </div>
            </div>
            
            {(expandedDepts[dept] || searchQuery.trim() !== "" || selectedDept !== "ALL") && (
              <div className="p-0 border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.department ? (
                            <Badge variant="secondary">{user.department}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.domain ? (
                            <Badge variant="outline" className="border-indigo-500/20 text-indigo-600 bg-indigo-500/5 dark:text-indigo-400">
                              {user.domain}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === "MODERATOR" ? "default" : "outline"}>
                            {USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user._count?.questionsCreated ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setEditDomain(user.domain || "");
                                setEditDepartment(user.department || "");
                                setEditOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(user.id, user.name);
                              }}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                <Select 
                  name="domain" 
                  defaultValue={selectedUser.domain || undefined}
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
              <div className="space-y-2">
                <Label>Department</Label>
                <Select 
                  name="department" 
                  value={editDepartment}
                  onValueChange={(v) => {
                    const val = v || "";
                    setEditDepartment(val);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
