"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  GraduationCap,
  User,
  Hash,
  Building2,
  BookOpen,
  Layers,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { completeStudentProfileAction } from "@/app/actions";

const DEPARTMENTS = ["DCS", "DCE", "DIT"] as const;
type Department = (typeof DEPARTMENTS)[number];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

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

// Styling tokens matching the rest of the site
const INPUT_CLS =
  "border-gray-300 focus-visible:border-[#4A89F3] focus-visible:ring-4 focus-visible:ring-[#4A89F3]/10 bg-white h-11 text-[#333333] placeholder:text-[#8898AA] transition-all rounded-xl";
const LABEL_CLS = "text-[#333333] font-medium flex items-center gap-1.5 text-sm";
const ERROR_CLS = "text-xs text-[#e53e3e] flex items-center gap-1 mt-0.5";
const SECTION_DIVIDER = "border-t border-gray-100 pt-5 mt-1";
const TRIGGER_CLS =
  "w-full border-gray-300 focus:border-[#4A89F3] h-11 rounded-xl bg-white text-[#333333] placeholder:text-[#8898AA]";

interface StudentSetupDialogProps {
  email: string;
  detectedDepartment: Department | null;
}

export function StudentSetupDialog({ email, detectedDepartment }: StudentSetupDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  // Base UI Select: always `value={string}` — never undefined — to stay fully controlled
  const [department, setDepartment] = useState<string>(detectedDepartment ?? "");
  const [semester, setSemester] = useState<string>("");
  const [domain, setDomain] = useState<string>("");

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength indicator
  const pwStrength = (() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  })();

  const pwStrengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];
  const pwStrengthColor = ["", "#e53e3e", "#dd6b20", "#d69e2e", "#38a169"][pwStrength];

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (!studentId.trim() || studentId.trim().length < 2) errs.studentId = "Student ID is required";
    if (!department) errs.department = "Department is required";
    if (!semester) errs.semester = "Semester is required";
    if (!domain) errs.domain = "Domain is required";

    // Password — required, must match
    if (!newPassword) {
      errs.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      errs.newPassword = "Password must be at least 8 characters";
    }
    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await completeStudentProfileAction({
      name: name.trim(),
      studentId: studentId.trim(),
      department: department as Department,
      semester: parseInt(semester, 10),
      domain,
      newPassword,
    });

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else if (result?.redirectUrl) {
      toast.success("Profile setup successfully completed!");
      router.push(result.redirectUrl);
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-[#4A89F3] to-[#203159] px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Complete Your Profile</h2>
              <p className="text-white/70 text-sm mt-0.5">First-time setup — takes 30 seconds</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-mono text-white/90 break-all">
            {email}
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={onSubmit} className="px-8 py-6 space-y-4">

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="setup-name" className={LABEL_CLS}>
              <User className="h-3.5 w-3.5 text-[#4A89F3]" /> Full Name
            </Label>
            <Input
              id="setup-name"
              placeholder="e.g. James Dhandhukiya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLS}
            />
            {errors.name && <p className={ERROR_CLS}><AlertCircle className="h-3 w-3" />{errors.name}</p>}
          </div>

          {/* Student ID */}
          <div className="space-y-1.5">
            <Label htmlFor="setup-studentId" className={LABEL_CLS}>
              <Hash className="h-3.5 w-3.5 text-[#4A89F3]" /> Student / Enrollment ID
            </Label>
            <Input
              id="setup-studentId"
              placeholder="e.g. 23DCS023"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={INPUT_CLS}
            />
            {errors.studentId && <p className={ERROR_CLS}><AlertCircle className="h-3 w-3" />{errors.studentId}</p>}
          </div>

          {/* Department & Semester */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={LABEL_CLS}>
                <Building2 className="h-3.5 w-3.5 text-[#4A89F3]" /> Department
              </Label>
              {/* Base UI Select: always pass value="" as "no selection" to stay controlled */}
              <Select value={department} onValueChange={(v) => setDepartment(v ?? "")}>
                <SelectTrigger className={TRIGGER_CLS}>
                  <SelectValue placeholder="Select dept." />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && <p className={ERROR_CLS}><AlertCircle className="h-3 w-3" />{errors.department}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL_CLS}>
                <BookOpen className="h-3.5 w-3.5 text-[#4A89F3]" /> Semester
              </Label>
              <Select value={semester} onValueChange={(v) => setSemester(v ?? "")}>
                <SelectTrigger className={TRIGGER_CLS}>
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((s) => (
                    <SelectItem key={s} value={s.toString()}>Sem {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.semester && <p className={ERROR_CLS}><AlertCircle className="h-3 w-3" />{errors.semester}</p>}
            </div>
          </div>

          {/* Domain */}
          <div className="space-y-1.5">
            <Label className={LABEL_CLS}>
              <Layers className="h-3.5 w-3.5 text-[#4A89F3]" /> Domain / Area of Interest
            </Label>
            <Select value={domain} onValueChange={(v) => setDomain(v ?? "")}>
              <SelectTrigger className={TRIGGER_CLS}>
                <SelectValue placeholder="Select your domain" />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.domain && <p className={ERROR_CLS}><AlertCircle className="h-3 w-3" />{errors.domain}</p>}
          </div>

          {/* ── Change Password Section ── */}
          <div className={SECTION_DIVIDER}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-[#4A89F3]/10 flex items-center justify-center">
                <Lock className="h-3.5 w-3.5 text-[#4A89F3]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#203159]">Set Your Password</p>
                <p className="text-xs text-[#8898AA]">Replace the default password (depstar@charusat)</p>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5 mb-3">
              <Label htmlFor="setup-newpw" className={LABEL_CLS}>New Password</Label>
              <div className="relative">
                <Input
                  id="setup-newpw"
                  type={showNewPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${INPUT_CLS} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8898AA] hover:text-[#4A89F3] transition-colors"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= pwStrength ? pwStrengthColor : "#e2e8f0" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: pwStrengthColor }}>
                    {pwStrengthLabel}
                  </p>
                </div>
              )}
              {errors.newPassword && <p className={ERROR_CLS}><AlertCircle className="h-3 w-3" />{errors.newPassword}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="setup-confirmpw" className={LABEL_CLS}>Confirm Password</Label>
              <div className="relative">
                <Input
                  id="setup-confirmpw"
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${INPUT_CLS} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8898AA] hover:text-[#4A89F3] transition-colors"
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Passwords match
                </p>
              )}
              {errors.confirmPassword && <p className={ERROR_CLS}><AlertCircle className="h-3 w-3" />{errors.confirmPassword}</p>}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#4A89F3] hover:bg-[#4A89F3]/90 text-white font-semibold text-base shadow-md transition-all active:scale-[0.98] rounded-xl"
            >
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up your account…</>
                : <><GraduationCap className="mr-2 h-4 w-4" /> Complete Setup &amp; Enter Portal</>
              }
            </Button>
          </div>
        </form>
      </div>

      <p className="text-center text-xs text-[#8898AA] mt-4">
        This setup is required only once. Your details will be visible to your department admin.
      </p>
    </div>
  );
}
