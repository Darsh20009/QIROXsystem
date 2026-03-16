import { PageGraphics } from "@/components/AnimatedPageGraphics";
import SARIcon from "@/components/SARIcon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Users, UserPlus, Edit2, Trash2, X, Search, Shield, Mail, Phone, KeyRound, Copy, Eye, EyeOff, Camera, Link, Link2 } from "lucide-react";
import { SiInstagram, SiX, SiLinkedin, SiSnapchat, SiTiktok, SiYoutube } from "react-icons/si";
import { type User } from "@shared/schema";
import { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

function getRoleLabels(L: boolean): Record<string, string> {
  return L ? {
    admin: "مدير النظام", manager: "مدير", accountant: "محاسب", sales_manager: "مدير مبيعات",
    sales: "مبيعات", developer: "مطور", designer: "مصمم", support: "دعم فني", merchant: "توصيل", client: "عميل",
  } : {
    admin: "System Admin", manager: "Manager", accountant: "Accountant", sales_manager: "Sales Manager",
    sales: "Sales", developer: "Developer", designer: "Designer", support: "Support", merchant: "Delivery", client: "Client",
  };
}

const roleColors: Record<string, string> = {
  admin: "bg-red-50 text-red-700 border-red-200",
  manager: "bg-purple-50 text-purple-700 border-purple-200",
  developer: "bg-blue-50 text-blue-700 border-blue-200",
  designer: "bg-pink-50 text-pink-700 border-pink-200",
  accountant: "bg-green-50 text-green-700 border-green-200",
  sales_manager: "bg-amber-50 text-amber-700 border-amber-200",
  sales: "bg-orange-50 text-orange-700 border-orange-200",
  support: "bg-teal-50 text-teal-700 border-teal-200",
  merchant: "bg-cyan-50 text-cyan-700 border-cyan-200",
  client: "bg-gray-50 text-gray-600 border-gray-200",
};

const employeeRoles = ["manager", "accountant", "sales_manager", "sales", "developer", "designer", "support", "merchant"];

interface EmployeeForm {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: string;
  phone: string;
  salaryType: string;
  fixedSalary: string;
  hourlyRate: string;
  commissionRate: string;
  jobTitle: string;
  bio: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  snapchat: string;
  tiktok: string;
  youtube: string;
  linktree: string;
}

const emptyForm: EmployeeForm = { username: "", password: "", email: "", fullName: "", role: "developer", phone: "", salaryType: "hourly", fixedSalary: "", hourlyRate: "", commissionRate: "", jobTitle: "", bio: "", instagram: "", twitter: "", linkedin: "", snapchat: "", tiktok: "", youtube: "", linktree: "" };

interface CredentialResult {
  username: string;
  rawPassword: string;
  email: string;
  fullName?: string;
  isReset?: boolean;
}

export default function AdminEmployees() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const roleLabels = getRoleLabels(L);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [credResult, setCredResult] = useState<CredentialResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingAvatarId, setUploadingAvatarId] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const avatarTargetId = useRef<string | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });

  const handleAvatarClick = (empId: string) => {
    avatarTargetId.current = empId;
    avatarFileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = avatarTargetId.current;
    if (!file || !id) return;
    e.target.value = "";
    setUploadingAvatarId(id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/users/${id}/avatar`, { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || (L ? "فشل الرفع" : "Upload failed"));
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: L ? "تم تحديث صورة الموظف بنجاح" : "Employee avatar updated" });
    } catch (err: any) {
      toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatarId(null);
    }
  };

  const saveSalaryData = async (userId: string, form: EmployeeForm) => {
    try {
      const salaryData: any = { salaryType: form.salaryType };
      if (form.salaryType === "hourly" && form.hourlyRate) salaryData.hourlyRate = Number(form.hourlyRate);
      if (form.salaryType === "fixed" && form.fixedSalary) salaryData.fixedSalary = Number(form.fixedSalary);
      if (form.salaryType === "commission" && form.commissionRate) salaryData.commissionRate = Number(form.commissionRate);
      await apiRequest("PATCH", `/api/admin/users/${userId}/salary`, salaryData);
    } catch {}
  };

  const createMutation = useMutation({
    mutationFn: async (data: EmployeeForm) => {
      const { salaryType, fixedSalary, hourlyRate, commissionRate, ...userFields } = data;
      const res = await apiRequest("POST", "/api/admin/users", userFields);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || (L ? "خطأ" : "Error"));
      return { user: json, form: data };
    },
    onSuccess: async ({ user, form }) => {
      await saveSalaryData(user.id, form);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCredResult({ username: form.username, rawPassword: form.password, email: form.email, fullName: form.fullName });
      resetForm();
    },
    onError: (err: any) => toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmployeeForm> }) => {
      const { salaryType, fixedSalary, hourlyRate, commissionRate, ...userFields } = data as any;
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, userFields);
      if (salaryType) await saveSalaryData(id, data as EmployeeForm);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: L ? "تم تحديث البيانات بنجاح" : "Data updated successfully" });
      resetForm();
    },
    onError: (err: any) => toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: L ? "تم حذف الموظف" : "Employee deleted" });
    },
    onError: (err: any) => toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/reset-password`, {});
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || (L ? "خطأ" : "Error"));
      return json;
    },
    onSuccess: (data) => {
      setCredResult({ username: data.username, rawPassword: data.rawPassword, email: data.email, isReset: true });
      toast({ title: L ? "تم إعادة تعيين كلمة المرور وإرسالها بالبريد" : "Password reset and emailed" });
    },
    onError: (err: any) => toast({ title: L ? "فشل إعادة التعيين" : "Reset failed", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.username || !form.email || !form.fullName || !form.role) {
      toast({ title: L ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingId) {
      const updates: Record<string, any> = { ...form };
      if (!updates.password) delete updates.password;
      updateMutation.mutate({ id: editingId, data: updates as Partial<EmployeeForm> });
    } else {
      if (!form.password) {
        toast({ title: L ? "يرجى إدخال كلمة المرور" : "Please enter a password", variant: "destructive" });
        return;
      }
      createMutation.mutate(form);
    }
  };

  const startEdit = (emp: User) => {
    setEditingId(String(emp.id));
    setForm({
      username: emp.username, password: "", email: emp.email, fullName: emp.fullName, role: emp.role, phone: emp.phone || "",
      salaryType: "hourly", fixedSalary: "", hourlyRate: "", commissionRate: "",
      jobTitle: (emp as any).jobTitle || "", bio: (emp as any).bio || "",
      instagram: (emp as any).instagram || "", twitter: (emp as any).twitter || "",
      linkedin: (emp as any).linkedin || "", snapchat: (emp as any).snapchat || "",
      tiktok: (emp as any).tiktok || "", youtube: (emp as any).youtube || "",
      linktree: (emp as any).linktree || "",
    });
    setShowForm(true);
  };

  const handleDelete = (emp: User) => {
    if (confirm(L ? `هل أنت متأكد من حذف ${emp.fullName}؟` : `Delete ${emp.fullName}?`)) deleteMutation.mutate(String(emp.id));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: L ? `تم نسخ ${label}` : `Copied ${label}` });
  };

  const employees = users?.filter(u => u.role !== 'client') || [];
  const clients = users?.filter(u => u.role === 'client') || [];

  const filtered = (filterRole === 'all'
    ? employees
    : filterRole === 'client' ? clients
    : employees.filter(e => e.role === filterRole)
  ).filter(e =>
    !search || (e.fullName || "").toLowerCase().includes(search.toLowerCase()) || (e.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-black/20" /></div>;

  return (
    <div className="relative overflow-hidden p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <PageGraphics variant="dashboard" />
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-2" data-testid="text-employees-title">
            <Users className="w-6 h-6 text-black/30" />
            {L ? "إدارة الفريق" : "Team Management"}
          </h1>
          <p className="text-xs text-black/30 mt-1">{employees.length} {L ? "موظف" : "employees"} · {clients.length} {L ? "عميل" : "clients"}</p>
        </div>
        <Button
          className="bg-black text-white hover:bg-black/80 text-xs h-9 px-5"
          onClick={() => { resetForm(); setShowForm(true); }}
          data-testid="button-add-employee"
        >
          <UserPlus className="w-4 h-4 ml-1.5" />
          {L ? "إضافة موظف" : "Add Employee"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="border border-black/[0.06] shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-black">{editingId ? (L ? "تعديل الموظف" : "Edit Employee") : (L ? "إضافة موظف جديد" : "Add New Employee")}</h3>
                  <button onClick={resetForm} className="text-black/20 hover:text-black/60" data-testid="button-close-form">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">{L ? "الاسم الكامل *" : "Full Name *"}</Label>
                    <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder={L ? "أحمد محمد" : "John Doe"} className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-fullname" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">{L ? "اسم المستخدم *" : "Username *"}</Label>
                    <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="ahmed_dev" className="h-9 text-xs border-black/[0.08]" disabled={!!editingId} data-testid="input-emp-username" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">{L ? "البريد الإلكتروني *" : "Email *"}</Label>
                    <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ahmed@qirox.tech" className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-email" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">{editingId ? (L ? "كلمة مرور جديدة (اختياري)" : "New Password (optional)") : (L ? "كلمة المرور *" : "Password *")}</Label>
                    <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-password" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">{L ? "الدور *" : "Role *"}</Label>
                    <Select value={form.role} onValueChange={val => setForm({ ...form, role: val })}>
                      <SelectTrigger className="h-9 text-xs border-black/[0.08]" data-testid="select-emp-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeRoles.map(r => <SelectItem key={r} value={r}>{roleLabels[r] || r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">{L ? "رقم الهاتف" : "Phone Number"}</Label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+966 5xx xxx xxxx" className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-phone" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">{L ? "نوع الراتب" : "Salary Type"}</Label>
                    <Select value={form.salaryType} onValueChange={val => setForm({ ...form, salaryType: val })}>
                      <SelectTrigger className="h-9 text-xs border-black/[0.08]" data-testid="select-emp-salary-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">{L ? "بالساعة" : "Hourly"}</SelectItem>
                        <SelectItem value="fixed">{L ? "راتب ثابت" : "Fixed Salary"}</SelectItem>
                        <SelectItem value="commission">{L ? "عمولة" : "Commission"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.salaryType === "hourly" && (
                    <div>
                      <Label className="text-[11px] text-black/40 mb-1.5 flex items-center gap-1">{L ? "سعر الساعة" : "Hourly Rate"} (<SARIcon size={9} className="opacity-60" />)</Label>
                      <Input type="number" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} placeholder="0" className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-hourly-rate" />
                    </div>
                  )}
                  {form.salaryType === "fixed" && (
                    <div>
                      <Label className="text-[11px] text-black/40 mb-1.5 flex items-center gap-1">{L ? "الراتب الشهري الثابت" : "Fixed Monthly Salary"} (<SARIcon size={9} className="opacity-60" />)</Label>
                      <Input type="number" value={form.fixedSalary} onChange={e => setForm({ ...form, fixedSalary: e.target.value })} placeholder="0" className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-fixed-salary" />
                    </div>
                  )}
                  {form.salaryType === "commission" && (
                    <div>
                      <Label className="text-[11px] text-black/40 mb-1.5 block">{L ? "نسبة العمولة (%)" : "Commission Rate (%)"}</Label>
                      <Input type="number" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: e.target.value })} placeholder="0" className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-commission-rate" />
                    </div>
                  )}
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">{L ? "المسمى الوظيفي" : "Job Title"}</Label>
                    <Input value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} placeholder={L ? "مطور واجهات أمامية" : "Frontend Developer"} className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-jobtitle" />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label className="text-[11px] text-black/40 mb-1.5 block">{L ? "نبذة شخصية" : "Bio"}</Label>
                    <Input value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder={L ? "نبذة مختصرة تظهر في صفحة الفريق..." : "Short bio shown on team page..."} className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-bio" />
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-black/[0.06]">
                  <p className="text-[11px] font-bold text-black/40 mb-3 flex items-center gap-1.5"><Link className="w-3 h-3" /> {L ? "حسابات السوشيال ميديا (تظهر في صفحة الفريق)" : "Social Media Accounts (shown on team page)"}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { key: "instagram", icon: SiInstagram, color: "text-pink-500", placeholder: "https://instagram.com/username", label: "Instagram" },
                      { key: "twitter", icon: SiX, color: "text-black dark:text-white", placeholder: "https://x.com/username", label: "X (Twitter)" },
                      { key: "linkedin", icon: SiLinkedin, color: "text-blue-600", placeholder: "https://linkedin.com/in/username", label: "LinkedIn" },
                      { key: "snapchat", icon: SiSnapchat, color: "text-yellow-400", placeholder: "https://snapchat.com/add/username", label: "Snapchat" },
                      { key: "tiktok", icon: SiTiktok, color: "text-black dark:text-white", placeholder: "https://tiktok.com/@username", label: "TikTok" },
                      { key: "youtube", icon: SiYoutube, color: "text-red-500", placeholder: "https://youtube.com/@channel", label: "YouTube" },
                      { key: "linktree", icon: Link2, color: "text-green-500", placeholder: "https://linktr.ee/username", label: "Linktree" },
                    ].map(({ key, icon: Icon, color, placeholder, label }) => (
                      <div key={key} className="relative">
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${color}`}>
                          <Icon size={14} />
                        </div>
                        <Input
                          value={(form as any)[key]}
                          onChange={e => setForm({ ...form, [key]: e.target.value })}
                          placeholder={placeholder}
                          className="h-9 text-xs border-black/[0.08] pr-9"
                          dir="ltr"
                          data-testid={`input-emp-${key}`}
                        />
                        <Label className="absolute -top-4 right-0 text-[10px] text-black/30">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                  <Button variant="outline" size="sm" className="text-xs h-8 border-black/[0.08]" onClick={resetForm} data-testid="button-cancel-emp">{L ? "إلغاء" : "Cancel"}</Button>
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-black/80 text-xs h-8 px-5"
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-emp"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingId ? (L ? "حفظ التعديلات" : "Save Changes") : (L ? "إضافة" : "Add")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/20" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={L ? "بحث بالاسم أو البريد..." : "Search by name or email..."} className="h-9 text-xs border-black/[0.08] pr-9" data-testid="input-search-employees" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="h-9 text-xs border-black/[0.08] w-full md:w-[180px]" data-testid="select-filter-role">
            <SelectValue placeholder={L ? "جميع الأدوار" : "All Roles"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L ? "جميع الموظفين" : "All Employees"}</SelectItem>
            <SelectItem value="client">{L ? "العملاء" : "Clients"}</SelectItem>
            {employeeRoles.map(r => <SelectItem key={r} value={r}>{roleLabels[r] || r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-black/[0.06] shadow-none overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-black/[0.02] border-b border-black/[0.06]">
                <TableHead className="text-[11px] font-bold text-black/40">{L ? "الموظف" : "Employee"}</TableHead>
                <TableHead className="text-[11px] font-bold text-black/40">{L ? "الدور" : "Role"}</TableHead>
                <TableHead className="text-[11px] font-bold text-black/40 hidden md:table-cell">{L ? "البريد" : "Email"}</TableHead>
                <TableHead className="text-[11px] font-bold text-black/40 hidden lg:table-cell">{L ? "الهاتف" : "Phone"}</TableHead>
                <TableHead className="text-[11px] font-bold text-black/40 text-left w-[130px]">{L ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-xs text-black/25">{L ? "لا يوجد نتائج" : "No results"}</TableCell>
                </TableRow>
              ) : filtered.map((emp) => (
                <TableRow key={emp.id} className="border-b border-black/[0.04] hover:bg-black/[0.01]" data-testid={`row-employee-${emp.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative group flex-shrink-0">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-black/[0.04] flex items-center justify-center">
                          {(emp as any).avatarUrl ? (
                            <img src={(emp as any).avatarUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[12px] font-bold text-black/30">{emp.fullName?.charAt(0)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAvatarClick(String(emp.id))}
                          disabled={uploadingAvatarId === String(emp.id)}
                          className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                          data-testid={`button-avatar-${emp.id}`}
                          title={L ? "تغيير الصورة" : "Change Photo"}
                        >
                          {uploadingAvatarId === String(emp.id)
                            ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                            : <Camera className="w-3.5 h-3.5 text-white" />
                          }
                        </button>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black">{emp.fullName}</p>
                        <p className="text-[10px] text-black/25">@{emp.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] border ${roleColors[emp.role] || roleColors.client}`}>
                      <Shield className="w-2.5 h-2.5 ml-1" />
                      {roleLabels[emp.role] || emp.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1 group">
                      <span className="text-[11px] text-black/40 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {emp.email}
                      </span>
                      <button
                        onClick={() => copyToClipboard(emp.email, L ? "البريد" : "email")}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="w-3 h-3 text-black/30 hover:text-black/60" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-[11px] text-black/30 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {emp.phone || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-black/20 hover:text-black/60"
                        onClick={() => startEdit(emp)}
                        data-testid={`button-edit-${emp.id}`}
                        title={L ? "تعديل" : "Edit"}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      {emp.role !== 'admin' && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => resetPasswordMutation.mutate(String(emp.id))}
                            disabled={resetPasswordMutation.isPending}
                            data-testid={`button-reset-pw-${emp.id}`}
                            title={L ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                          >
                            {resetPasswordMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-black/20 hover:text-red-500"
                            onClick={() => handleDelete(emp)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${emp.id}`}
                            title={L ? "حذف" : "Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Credential Dialog */}
      <Dialog open={!!credResult} onOpenChange={() => { setCredResult(null); setShowPassword(false); }}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-black flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-black/40" />
              {credResult?.isReset ? (L ? "تم إعادة تعيين كلمة المرور" : "Password Reset") : (L ? "تم إنشاء الحساب بنجاح" : "Account Created Successfully")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <p className="text-sm text-black/40">
              {credResult?.isReset
                ? (L ? "تم إرسال كلمة المرور الجديدة إلى بريد المستخدم تلقائياً" : "New password was sent to the user's email automatically")
                : (L ? "احتفظ ببيانات الدخول — تم إرسالها بالبريد أيضاً" : "Save these credentials — also sent by email")
              }
            </p>

            <div className="bg-black/[0.03] rounded-2xl p-4 space-y-3">
              {credResult?.fullName && (
                <div className="text-center pb-2 border-b border-black/[0.06]">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">{(credResult.fullName || credResult.username || "?")[0]}</span>
                  </div>
                  <p className="font-bold text-black text-sm">{credResult.fullName}</p>
                </div>
              )}

              {[
                { label: L ? "البريد الإلكتروني" : "Email", value: credResult?.email || "", key: "email" },
                { label: L ? "اسم المستخدم" : "Username", value: credResult?.username || "", key: "username" },
              ].map(({ label, value, key }) => (
                <div key={key} className="bg-white rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-black/40 font-medium mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-black font-mono" dir="ltr">{value}</p>
                  </div>
                  <button onClick={() => copyToClipboard(value, label)} className="w-7 h-7 rounded-lg bg-black/[0.04] hover:bg-black/10 flex items-center justify-center transition-colors">
                    <Copy className="w-3.5 h-3.5 text-black/50" />
                  </button>
                </div>
              ))}

              <div className="bg-black rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/40 font-medium mb-0.5">{L ? "كلمة المرور" : "Password"}</p>
                  <p className="text-sm font-black text-white font-mono tracking-wider" dir="ltr">
                    {showPassword ? (credResult?.rawPassword || "") : "••••••••••••"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setShowPassword(!showPassword)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5 text-white/60" /> : <Eye className="w-3.5 h-3.5 text-white/60" />}
                  </button>
                  <button onClick={() => copyToClipboard(credResult?.rawPassword || "", L ? "كلمة المرور" : "password")} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Copy className="w-3.5 h-3.5 text-white/60" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2">
              <Mail className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-amber-700 text-xs">{L ? "تم إرسال هذه البيانات إلى" : "These credentials were sent to"}: <strong>{credResult?.email}</strong></p>
            </div>

            <Button
              className="w-full bg-black text-white hover:bg-black/80"
              onClick={() => { setCredResult(null); setShowPassword(false); }}
            >
              {L ? "تم، إغلاق" : "Done, Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
