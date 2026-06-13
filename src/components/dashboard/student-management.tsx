"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, UserPlus, ChevronDown, ChevronRight, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@prisma/client";
import { createUserAction } from "@/app/actions";
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

type UserWithCount = User & { _count?: { questionsCreated: number } };

const DEPARTMENTS = ["CSE", "CE", "IT"];
const SEMESTERS = [1, 2, 3, 4, 5, 6];
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

export function StudentManagementTable({ users }: { users: UserWithCount[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedSem, setSelectedSem] = useState<number | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "STUDENT" },
  });

  const students = users.filter((u) => u.role === "STUDENT");

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) => s.department === selectedDept && s.semester === selectedSem
    );
  }, [students, selectedDept, selectedSem]);

  // Group filtered students by domain
  const groupedStudents = useMemo(() => {
    const groups: Record<string, UserWithCount[]> = {};
    filteredStudents.forEach((student) => {
      const domain = student.domain || "Unassigned";
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(student);
    });
    return groups;
  }, [filteredStudents]);

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
        const data: any = { role: "STUDENT" };

        headers.forEach((h, idx) => {
          if (h === "name") data.name = values[idx];
          if (h === "email") data.email = values[idx];
          if (h === "password") data.password = values[idx];
          if (h === "department") data.department = values[idx];
          if (h === "semester") data.semester = parseInt(values[idx], 10);
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

  async function onCreate(data: CreateUserInput) {
    setLoading(true);
    const result = await createUserAction({ ...data, role: "STUDENT" });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground">Manage student accounts by department and semester.</p>
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
                Create a student account.
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select onValueChange={(v) => setValue("department", v as string)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Department" />
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
                  <Select onValueChange={(v) => setValue("semester", parseInt(v as string, 10))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTERS.map((s) => (
                        <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Domain</Label>
                <Select onValueChange={(v) => setValue("domain", v as string)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 hidden">
                <Input type="hidden" {...register("role")} value="STUDENT" />
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

      {!selectedDept ? (
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold">Select Department</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEPARTMENTS.map((dept) => (
              <Button
                key={dept}
                variant="outline"
                className="h-24 text-lg font-medium"
                onClick={() => setSelectedDept(dept)}
              >
                {dept} Department
              </Button>
            ))}
          </div>
        </div>
      ) : !selectedSem ? (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDept(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">{selectedDept} - Select Semester</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SEMESTERS.map((sem) => (
              <Button
                key={sem}
                variant="outline"
                className="h-20 text-lg font-medium"
                onClick={() => setSelectedSem(sem)}
              >
                Semester {sem}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSem(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">
              {selectedDept} - Semester {selectedSem} Students
            </h2>
          </div>
          
          {Object.keys(groupedStudents).length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed">
              <p className="text-muted-foreground">No students found for this department and semester.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedStudents).map(([domain, groupUsers]) => (
                <div key={domain} className="rounded-xl border bg-card text-card-foreground shadow-sm">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50"
                    onClick={() => toggleDomain(domain)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedDomains[domain] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <h3 className="font-semibold text-lg">{domain}</h3>
                      <Badge variant="secondary">{groupUsers.length}</Badge>
                    </div>
                  </div>
                  
                  {expandedDomains[domain] && (
                    <div className="p-0 border-t">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Semester</TableHead>
                            <TableHead>Domain</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.department}</TableCell>
                              <TableCell>{user.semester}</TableCell>
                              <TableCell>{user.domain}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
