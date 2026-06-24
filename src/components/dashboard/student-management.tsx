"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, UserPlus, Edit, Trash2, ChevronDown, ChevronRight, Upload, Search, Copy, Check } from "lucide-react";
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
import { createUserSchema, type CreateUserInput } from "@/validations";

const DEPARTMENTS = ["DCS", "DCE", "DIT"] as const;
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

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

export function StudentManagementTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedSem, setSelectedSem] = useState("ALL");

  // Controlled states for editing profile
  const [editDepartment, setEditDepartment] = useState<string>("");
  const [editSemester, setEditSemester] = useState<string>("");

  const toggleDept = (dept: string) => {
    setExpandedDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("ID copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

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

        const data: any = { role: "STUDENT" };

        headers.forEach((h, idx) => {
          const val = values[idx] || "";
          const headerClean = h.replace(/[\r\n\t]/g, "").trim();

          if (headerClean === "id" || headerClean === "student id" || headerClean === "enrollment id" || headerClean === "enrollment number") {
            data.id = val;
          }
          if (headerClean === "name" || headerClean === "student name" || headerClean === "full name") {
            data.name = val;
          }
          if (headerClean === "email" || headerClean === "email address" || headerClean === "email id") {
            data.email = val;
          }
          if (headerClean === "password" || headerClean === "pass") {
            data.password = val;
          }
          if (headerClean === "department" || headerClean === "dept") {
            data.department = val;
          }
          if (headerClean === "semester" || headerClean === "sem") {
            data.semester = parseInt(val, 10) || undefined;
          }
        });

        if (!data.name || !data.email || !data.password || !data.id) {
          if (!firstError) {
            const missing = [];
            if (!data.id) missing.push("student id");
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
        toast.success(`Import completed: ${successCount} students added successfully.`);
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
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "STUDENT" as any, domain: "", department: "", semester: 1 },
  });

  const studentUsers = users.filter((u) => u.role === "STUDENT");

  // Filter students by search query (name, ID, email) and department/semester filters
  const filteredStudents = useMemo(() => {
    return studentUsers.filter((user) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q);

      const matchesDept =
        selectedDept === "ALL" ||
        user.department === selectedDept;

      const matchesSem =
        selectedSem === "ALL" ||
        (user.semester && String(user.semester) === selectedSem);

      return matchesSearch && matchesDept && matchesSem;
    });
  }, [studentUsers, searchQuery, selectedDept, selectedSem]);

  const groupedStudents = useMemo(() => {
    const groups: Record<string, User[]> = {};
    filteredStudents.forEach((user) => {
      const dept = user.department || "Unassigned";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(user);
    });
    return groups;
  }, [filteredStudents]);

  async function onCreate(data: CreateUserInput) {
    setLoading(true);
    const result = await createUserAction(data);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Student created successfully");
    setOpen(false);
    reset();
    router.refresh();
  }

  async function onEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const department = formData.get("department") as string;
    const semesterVal = formData.get("semester") as string;
    const name = formData.get("name") as string;
    const status = formData.get("status") as User["status"];

    const result = await updateUserAction(selectedUser.id, { 
      department: department || null,
      semester: semesterVal ? parseInt(semesterVal, 10) : null,
      name,
      status
    });
    
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Student updated successfully");
    setEditOpen(false);
    setSelectedUser(null);
    router.refresh();
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete student ${userName}? This action cannot be undone.`)) {
      return;
    }
    setLoading(true);
    const result = await deleteUserAction(userId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Student deleted successfully");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground">Manage student portal access by department and semester.</p>
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
              Add Student
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Create a new student portal account.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit((data) => onCreate(data as unknown as CreateUserInput))} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student ID / Enrollment ID</Label>
                  <Input {...register("id")} required placeholder="e.g. 23DCS023" />
                  {errors.id && (
                    <p className="text-sm text-destructive">{errors.id.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...register("name")} required placeholder="e.g. Rahul Patel" />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...register("email")} required placeholder="e.g. rahul.ce@charusat.ac.in" />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" {...register("password")} required placeholder="4+ characters" />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
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
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select
                    onValueChange={(v) => setValue("semester", parseInt(v as string, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTERS.map((s) => (
                        <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
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
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <Select value={selectedDept} onValueChange={(v) => setSelectedDept(v || "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Filter Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[160px]">
          <Select value={selectedSem} onValueChange={(v) => setSelectedSem(v || "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Filter Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Semesters</SelectItem>
              {SEMESTERS.map((sem) => (
                <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grouped Table View */}
      <div className="space-y-4">
        {Object.keys(groupedStudents).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-xl bg-card">
            No students found matching your filters.
          </div>
        ) : (
          Object.entries(groupedStudents).map(([dept, students]) => (
            <div key={dept} className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50"
                onClick={() => toggleDept(dept)}
              >
                <div className="flex items-center gap-2">
                  {(expandedDepts[dept] || searchQuery.trim() !== "" || selectedDept !== "ALL" || selectedSem !== "ALL") ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <h3 className="font-semibold text-lg">{dept}</h3>
                  <Badge variant="secondary">{students.length}</Badge>
                </div>
              </div>
              
              {(expandedDepts[dept] || searchQuery.trim() !== "" || selectedDept !== "ALL" || selectedSem !== "ALL") && (
                <div className="p-0 border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Student ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-xs max-w-[120px] truncate">
                            <div className="flex items-center gap-1">
                              <span className="truncate" title={student.id}>{student.id}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hover:bg-muted"
                                onClick={() => copyToClipboard(student.id)}
                              >
                                {copiedId === student.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            {student.department ? (
                              <Badge variant="secondary">{student.department}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.semester ? (
                              <Badge variant="outline">Sem {student.semester}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={student.status === "ACTIVE" ? "default" : "secondary"}>
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser(student);
                                  setEditDepartment(student.department || "");
                                  setEditSemester(student.semester ? String(student.semester) : "");
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
                                  handleDelete(student.id, student.name);
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
          ))
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
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
                <Label>Department</Label>
                <Select 
                  name="department" 
                  value={editDepartment}
                  onValueChange={(v) => setEditDepartment(v || "")}
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
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select 
                  name="semester" 
                  value={editSemester}
                  onValueChange={(v) => setEditSemester(v || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map((s) => (
                      <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  name="status" 
                  defaultValue={selectedUser.status}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="DISABLED">DISABLED</SelectItem>
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
