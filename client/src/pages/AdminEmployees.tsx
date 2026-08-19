import { PageGraphics } from "@/components/AnimatedPageGraphics";
import SARIcon from "@/components/SARIcon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Users, UserPlus, Edit2, Trash2, X, Search, Shield, Mail, Phone, KeyRound, Copy, Eye, EyeOff, Camera, Link, Link2, AlertCircle, LayoutGrid, List, GitBranch, ChevronDown, ChevronRight, Fingerprint, Crown, BadgeCheck, Code2, Palette, Headphones, Truck, BarChart3, CreditCard, ToggleLeft, ToggleRight } from "lucide-react";
import { SiInstagram, SiX, SiSnapchat, SiTiktok, SiYoutube } from "react-icons/si";
import { Linkedin } from "lucide-react";
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

/* ─── ERP Hierarchy Config ─────────────────────────────────────────────── */
const ROLE_HIERARCHY: { roles: string[]; level: number; icon: any; color: string; bg: string; label: string; labelEn: string }[] = [
  { roles: ["admin"],                       level: 0, icon: Crown,      color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-700/30", label: "الإدارة العليا",   labelEn: "Executive" },
  { roles: ["manager"],                     level: 1, icon: BadgeCheck, color: "text-slate-700 dark:text-slate-300",   bg: "bg-slate-50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-700/30", label: "الإدارة الوسطى",  labelEn: "Management" },
  { roles: ["sales_manager", "accountant"], level: 2, icon: BarChart3,  color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50/60 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/30", label: "رؤساء الأقسام",   labelEn: "Department Heads" },
  { roles: ["developer", "designer"],       level: 3, icon: Code2,      color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50/50 dark:bg-violet-900/15 border-violet-200/50 dark:border-violet-700/30", label: "التقنية والتصميم", labelEn: "Tech & Design" },
  { roles: ["sales", "support", "merchant"],level: 4, icon: Headphones, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-900/15 border-emerald-200/50 dark:border-emerald-700/30", label: "الفريق التشغيلي", labelEn: "Operations" },
];

function getSystemId(emp: User, index: number): string {
  if ((emp as any).employeeCode) return (emp as any).employeeCode;
  return `QRX-EMP-${String(index + 1).padStart(3, "0")}`;
}

function getRoleIcon(role: string) {
  if (role === "admin") return Crown;
  if (role === "manager") return BadgeCheck;
  if (role === "sales_manager") return BarChart3;
  if (role === "accountant") return CreditCard;
  if (role === "developer") return Code2;
  if (role === "designer") return Palette;
  if (role === "sales") return BarChart3;
  if (role === "support") return Headphones;
  if (role === "merchant") return Truck;
  return Users;
}

function OrgChartView({ employees, roleLabels, L, onEdit }: { employees: User[]; roleLabels: Record<string, string>; L: boolean; onEdit: (emp: User) => void }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({0: true, 1: true, 2: true, 3: true, 4: true});

  const toggle = (level: number) => setExpanded(prev => ({ ...prev, [level]: !prev[level] }));

  return (
    <div className="space-y-3" data-testid="org-chart-view">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-2">
        {ROLE_HIERARCHY.map(tier => {
          const Icon = tier.icon;
          const count = employees.filter(e => tier.roles.includes(e.role)).length;
          if (count === 0) return null;
          return (
            <span key={tier.level} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${tier.bg} ${tier.color}`}>
              <Icon className="w-3 h-3" />
              {L ? tier.label : tier.labelEn}
              <span className="opacity-60">·{count}</span>
            </span>
          );
        })}
      </div>

      {/* Hierarchy tiers */}
      {ROLE_HIERARCHY.map(tier => {
        const tierEmps = employees.filter(e => tier.roles.includes(e.role));
        if (tierEmps.length === 0) return null;
        const Icon = tier.icon;
        const isOpen = expanded[tier.level] !== false;

        return (
          <div key={tier.level} className={`border rounded-2xl overflow-hidden ${tier.bg}`}>
            {/* Tier header */}
            <button
              onClick={() => toggle(tier.level)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              data-testid={`button-tier-${tier.level}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white/60 dark:bg-black/30 flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${tier.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-black ${tier.color}`}>{L ? tier.label : tier.labelEn}</span>
                <span className="text-[10px] text-black/30 dark:text-white/30 mr-2">— {tierEmps.length} {L ? "أعضاء" : "members"}</span>
              </div>
              <div className="flex-shrink-0">
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-black/30 dark:text-white/30" /> : <ChevronRight className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />}
              </div>
            </button>

            {/* Tier employees */}
            {isOpen && (
              <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 border-t border-black/[0.05] dark:border-white/[0.05] pt-3">
                {tierEmps.map((emp, idx) => {
                  const empIndex = employees.indexOf(emp);
                  const systemId = getSystemId(emp, empIndex);
                  const RoleIcon = getRoleIcon(emp.role);

                  return (
                    <motion.div
                      key={emp.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="bg-white/70 dark:bg-black/20 rounded-xl p-3 flex items-center gap-3 border border-black/[0.06] dark:border-white/[0.06] hover:border-black/15 dark:hover:border-white/15 transition-all"
                      data-testid={`orgchart-emp-${emp.id}`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/[0.06] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        {(emp as any).avatarUrl
                          ? <img src={(emp as any).avatarUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                          : <span className="text-sm font-bold text-black/40 dark:text-white/40">{emp.fullName?.charAt(0)}</span>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-black dark:text-white truncate">{emp.fullName}</p>
                        {(emp as any).jobTitle
                          ? <p className="text-[10px] text-black/40 dark:text-white/40 truncate">{(emp as any).jobTitle}</p>
                          : <p className="text-[10px] text-black/30 dark:text-white/30 truncate">@{emp.username}</p>
                        }
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/[0.06] text-black/50 dark:text-white/50 border border-black/[0.06] dark:border-white/[0.06]" data-testid={`text-sysid-${emp.id}`}>
                            <Fingerprint className="w-2.5 h-2.5" />
                            {systemId}
                          </span>
                        </div>
                      </div>

                      {/* Edit btn */}
                      <button
                        onClick={() => onEdit(emp)}
                        className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
                        data-testid={`button-orgchart-edit-${emp.id}`}
                      >
                        <Edit2 className="w-3 h-3 text-black/40 dark:text-white/40" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ERP Summary */}
      <div className="mt-2 pt-4 border-t border-black/[0.05] dark:border-white/[0.05]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: L ? "مستوى التنفيذية" : "Executive Level", count: employees.filter(e => ["admin"].includes(e.role)).length, icon: Crown, color: "text-amber-600" },
            { label: L ? "مستوى الإدارة" : "Management Level", count: employees.filter(e => ["manager", "sales_manager", "accountant"].includes(e.role)).length, icon: BadgeCheck, color: "text-blue-600" },
            { label: L ? "مستوى التقنية" : "Technical Level", count: employees.filter(e => ["developer", "designer"].includes(e.role)).length, icon: Code2, color: "text-violet-600" },
            { label: L ? "مستوى التشغيل" : "Operations Level", count: employees.filter(e => ["sales", "support", "merchant"].includes(e.role)).length, icon: Headphones, color: "text-emerald-600" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white dark:bg-black/20 border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-3 flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
                <div>
                  <p className="text-base font-black text-black dark:text-white">{s.count}</p>
                  <p className="text-[9px] text-black/35 dark:text-white/35 leading-tight">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const roleColors: Record<string, string> = {
  admin: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",
  manager: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",
  developer: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",
  designer: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",
  accountant: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",
  sales_manager: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",
  sales: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",
  support: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",
  merchant: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",
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
  additionalRoles: string[];
  createWorkEmail: boolean;
  workEmailAddress: string;
  allowedPages: string[] | null; // null = use role default, array = custom override
}

// All available system pages (mirrors ALL_NAV in EmployeeLayout)
const ALL_SYSTEM_PAGES: { id: string; labelAr: string; group: string }[] = [
  { id: "dashboard",       labelAr: "لوحتي",              group: "رئيسية" },
  { id: "orders",          labelAr: "المشاريع",            group: "رئيسية" },
  { id: "customers",       labelAr: "العملاء",             group: "رئيسية" },
  { id: "new_order",       labelAr: "عميل وطلب جديد",     group: "رئيسية" },
  { id: "subscriptions",   labelAr: "الاشتراكات",          group: "رئيسية" },
  { id: "abandoned_carts", labelAr: "عربات مهجورة",       group: "رئيسية" },
  { id: "quotations",      labelAr: "عروض الأسعار",        group: "رئيسية" },
  { id: "mod_requests",    labelAr: "طلبات التعديل",       group: "رئيسية" },
  { id: "support_tickets", labelAr: "تذاكر الدعم",         group: "رئيسية" },
  { id: "crm",             labelAr: "CRM",                 group: "رئيسية" },
  { id: "whatsapp_crm",   labelAr: "واتساب CRM",          group: "رئيسية" },
  { id: "products",        labelAr: "المنتجات",            group: "رئيسية" },
  { id: "news",            labelAr: "الأخبار والمدونة",    group: "رئيسية" },
  { id: "marketing_posts", labelAr: "أدوات التسويق",       group: "رئيسية" },
  { id: "builder",         labelAr: "صانع الأنظمة",       group: "أدوات" },
  { id: "deployment",      labelAr: "نشر المشاريع",        group: "أدوات" },
  { id: "sector_guide",    labelAr: "دليل القطاعات",       group: "أدوات" },
  { id: "qi_agent",        labelAr: "QIROX Studio AI",     group: "أدوات" },
  { id: "checklist",       labelAr: "قائمة المهام",        group: "أدوات" },
  { id: "qmeet",           labelAr: "الاجتماعات",          group: "أدوات" },
  { id: "kanban",          labelAr: "لوحة المهام",         group: "أدوات" },
  { id: "finance",         labelAr: "المالية",              group: "مالية" },
  { id: "invoices",        labelAr: "الفواتير",             group: "مالية" },
  { id: "receipts",        labelAr: "الوصولات",             group: "مالية" },
  { id: "payroll",         labelAr: "الرواتب",              group: "مالية" },
  { id: "reports",         labelAr: "التقارير",             group: "مالية" },
  { id: "employees",       labelAr: "الموظفون",             group: "موارد بشرية" },
  { id: "attendance",      labelAr: "الحضور والانصراف",    group: "موارد بشرية" },
  { id: "settings",        labelAr: "الإعدادات",            group: "إعدادات" },
  { id: "mail",            labelAr: "البريد الداخلي",       group: "شخصية" },
  { id: "profile",         labelAr: "ملفي الشخصي",         group: "شخصية" },
  { id: "changelog",       labelAr: "التحديثات",            group: "شخصية" },
  { id: "my_finance",      labelAr: "حقي المالي",           group: "شخصية" },
];

const EXTRA_ROLES = ["hr", "content", "marketing", "investor", "supplier"] as const;

const emptyForm: EmployeeForm = { username: "", password: "", email: "", fullName: "", role: "developer", phone: "", salaryType: "hourly", fixedSalary: "", hourlyRate: "", commissionRate: "", jobTitle: "", bio: "", instagram: "", twitter: "", linkedin: "", snapchat: "", tiktok: "", youtube: "", linktree: "", additionalRoles: [], createWorkEmail: false, workEmailAddress: "", allowedPages: null };

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

  const { data: users, isLoading, isError, refetch } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });

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
    } catch (err: any) {
      toast({ title: L ? "تعذّر حفظ بيانات الراتب" : "Failed to save salary data", description: err?.message, variant: "destructive" });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: EmployeeForm) => {
      const { salaryType, fixedSalary, hourlyRate, commissionRate, ...userFields } = data;
      const payload: any = { ...userFields };
      if (!data.createWorkEmail) {
        delete payload.createWorkEmail;
        delete payload.workEmailAddress;
      }
      const res = await apiRequest("POST", "/api/admin/users", payload);
      const json = await res.json();
      return { user: json, form: data };
    },
    onSuccess: async ({ user, form }) => {
      await saveSalaryData(user.id || user._id, form);
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
      return res.json();
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
      const { additionalRoles, ...rest } = updates;
      // allowedPages: send null to reset to role default, or array for custom override
      if (rest.allowedPages === null) rest.allowedPages = [];
      updateMutation.mutate({ id: editingId, data: rest as Partial<EmployeeForm> });
      if (additionalRoles) {
        apiRequest("PATCH", `/api/admin/users/${editingId}/additional-roles`, { additionalRoles }).catch(() => {});
      }
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
      additionalRoles: (emp as any).additionalRoles || [],
      allowedPages: (emp as any).allowedPages?.length ? (emp as any).allowedPages : null,
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

  const [viewMode, setViewMode] = useState<"cards" | "list" | "orgchart">("cards");

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

  if (isError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center" data-testid="employees-error-state">
      <AlertCircle className="w-12 h-12 text-black/70 dark:text-white/70 mb-3" />
      <p className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">{L ? "حدث خطأ أثناء تحميل بيانات الفريق" : "Failed to load team data"}</p>
      <p className="text-xs text-black/30 dark:text-white/30 mb-4">{L ? "تأكد من اتصالك بالإنترنت وحاول مرة أخرى" : "Check your connection and try again"}</p>
      <Button variant="outline" size="sm" className="text-xs" onClick={() => refetch()} data-testid="button-retry-employees">
        {L ? "إعادة المحاولة" : "Retry"}
      </Button>
    </div>
  );

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

                {/* Work Email Toggle — only shown when creating, not editing */}
                {!editingId && (
                  <div className="mt-4 pt-4 border-t border-black/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-black/30" />
                        <span className="text-[11px] font-bold text-black/50">{L ? "إنشاء بريد عمل للموظف" : "Create work email for employee"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          createWorkEmail: !f.createWorkEmail,
                          workEmailAddress: !f.createWorkEmail ? `${f.username}@qirox.online` : "",
                        }))}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${form.createWorkEmail ? "bg-black" : "bg-black/20"}`}
                        data-testid="toggle-create-work-email"
                        aria-pressed={form.createWorkEmail}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form.createWorkEmail ? (L ? "-translate-x-1.5" : "translate-x-4") : (L ? "-translate-x-4" : "translate-x-1")}`} />
                      </button>
                    </div>
                    {form.createWorkEmail && (
                      <div className="mt-3">
                        <Label className="text-[11px] text-black/40 mb-1.5 block">{L ? "عنوان البريد المؤسسي" : "Work Email Address"}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            dir="ltr"
                            value={form.workEmailAddress}
                            onChange={e => setForm({ ...form, workEmailAddress: e.target.value })}
                            placeholder="username@qirox.online"
                            className="h-9 text-xs border-black/[0.08] flex-1"
                            data-testid="input-work-email-address"
                          />
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, workEmailAddress: `${f.username}@qirox.online` }))}
                            className="h-9 px-3 text-[11px] font-bold border border-black/[0.08] rounded-lg hover:bg-black/[0.04] transition-colors whitespace-nowrap"
                            data-testid="button-auto-suggest-email"
                          >
                            {L ? "تلقائي" : "Auto"}
                          </button>
                        </div>
                        <p className="text-[10px] text-black/30 mt-1.5 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {L ? "سيتم إنشاء الحساب في نظام البريد الداخلي تلقائياً باعتماد بيانات cPanel" : "Account will be created in the mail system using cPanel credentials"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Per-Employee Page Permissions */}
                {editingId && (
                  <div className="mt-4 pt-4 border-t border-black/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold text-black/40 flex items-center gap-1.5">
                        <ToggleRight className="w-3 h-3" /> {L ? "صلاحيات الصفحات المخصصة (تُلغي افتراضي الدور)" : "Custom Page Permissions (overrides role default)"}
                      </p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setForm(f => ({ ...f, allowedPages: null }))}
                          className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${form.allowedPages === null ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" : "border-black/[0.12] text-black/50 hover:border-black/30"}`}>
                          {L ? "افتراضي الدور" : "Role Default"}
                        </button>
                        <button type="button" onClick={() => setForm(f => ({ ...f, allowedPages: f.allowedPages === null ? ["dashboard","mail","profile"] : f.allowedPages }))}
                          className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${form.allowedPages !== null ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" : "border-black/[0.12] text-black/50 hover:border-black/30"}`}>
                          {L ? "مخصص" : "Custom"}
                        </button>
                      </div>
                    </div>
                    {form.allowedPages !== null && (
                      <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-3 border border-black/[0.05] space-y-3">
                        {/* Group pages by group name */}
                        {Array.from(new Set(ALL_SYSTEM_PAGES.map(p => p.group))).map(group => (
                          <div key={group}>
                            <p className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest mb-1.5">{group}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {ALL_SYSTEM_PAGES.filter(p => p.group === group).map(page => {
                                const active = form.allowedPages!.includes(page.id);
                                return (
                                  <button key={page.id} type="button"
                                    onClick={() => setForm(f => ({
                                      ...f,
                                      allowedPages: active
                                        ? f.allowedPages!.filter(x => x !== page.id)
                                        : [...(f.allowedPages || []), page.id]
                                    }))}
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                      active
                                        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                                        : "bg-transparent text-black/50 border-black/[0.12] hover:border-black/30 dark:text-white/50 dark:border-white/[0.12]"
                                    }`}
                                    data-testid={`toggle-page-${page.id}`}>
                                    {active ? "✓ " : ""}{page.labelAr}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {form.allowedPages === null && (
                      <p className="text-[10px] text-black/30 dark:text-white/30 mt-1">
                        {L ? "سيرى الموظف الصفحات المحددة بناءً على دوره الوظيفي تلقائياً" : "Employee will see pages based on their role by default"}
                      </p>
                    )}
                  </div>
                )}

                {/* Additional Roles */}
                {editingId && (
                  <div className="mt-4 pt-4 border-t border-black/[0.06]">
                    <p className="text-[11px] font-bold text-black/40 mb-2.5 flex items-center gap-1.5">
                      <Shield className="w-3 h-3" /> {L ? "أدوار إضافية (وصول متعدد الأقسام)" : "Additional Roles (cross-department access)"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {EXTRA_ROLES.map(r => {
                        const active = form.additionalRoles.includes(r);
                        return (
                          <button key={r} type="button"
                            onClick={() => setForm(f => ({
                              ...f,
                              additionalRoles: active
                                ? f.additionalRoles.filter(x => x !== r)
                                : [...f.additionalRoles, r]
                            }))}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                              active
                                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                                : "bg-transparent text-black/50 border-black/[0.12] hover:border-black/30 dark:text-white/50 dark:border-white/[0.12]"
                            }`}
                            data-testid={`toggle-extra-role-${r}`}>
                            {active ? "✓ " : ""}{r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-black/[0.06]">
                  <p className="text-[11px] font-bold text-black/40 mb-3 flex items-center gap-1.5"><Link className="w-3 h-3" /> {L ? "حسابات السوشيال ميديا (تظهر في صفحة الفريق)" : "Social Media Accounts (shown on team page)"}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { key: "instagram", icon: SiInstagram, color: "text-black dark:text-white", placeholder: "https://instagram.com/username", label: "Instagram" },
                      { key: "twitter", icon: SiX, color: "text-black dark:text-white", placeholder: "https://x.com/username", label: "X (Twitter)" },
                      { key: "linkedin", icon: Linkedin, color: "text-black dark:text-white", placeholder: "https://linkedin.com/in/username", label: "LinkedIn" },
                      { key: "snapchat", icon: SiSnapchat, color: "text-black/70 dark:text-white/70", placeholder: "https://snapchat.com/add/username", label: "Snapchat" },
                      { key: "tiktok", icon: SiTiktok, color: "text-black dark:text-white", placeholder: "https://tiktok.com/@username", label: "TikTok" },
                      { key: "youtube", icon: SiYoutube, color: "text-black dark:text-white", placeholder: "https://youtube.com/@channel", label: "YouTube" },
                      { key: "linktree", icon: Link2, color: "text-black dark:text-white", placeholder: "https://linktr.ee/username", label: "Linktree" },
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

      {/* Search + Filter + View Toggle */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/20" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={L ? "بحث بالاسم أو البريد..." : "Search by name or email..."} className="h-9 text-xs border-black/[0.08] pr-9" data-testid="input-search-employees" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="h-9 text-xs border-black/[0.08] w-full md:w-[200px]" data-testid="select-filter-role">
            <SelectValue placeholder={L ? "جميع الأدوار" : "All Roles"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L ? "جميع الموظفين" : "All Employees"}</SelectItem>
            <SelectItem value="client">{L ? "العملاء" : "Clients"}</SelectItem>
            {employeeRoles.map(r => <SelectItem key={r} value={r}>{roleLabels[r] || r}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex border border-black/[0.08] rounded-lg overflow-hidden h-9 shrink-0">
          <button onClick={() => setViewMode("cards")} className={`px-3 flex items-center gap-1.5 text-xs transition-colors ${viewMode === "cards" ? "bg-black text-white" : "text-black/40 hover:bg-black/[0.04]"}`} data-testid="button-view-cards" title={L ? "عرض البطاقات" : "Card View"}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setViewMode("list")} className={`px-3 flex items-center gap-1.5 text-xs transition-colors border-r border-black/[0.08] ${viewMode === "list" ? "bg-black text-white" : "text-black/40 hover:bg-black/[0.04]"}`} data-testid="button-view-list" title={L ? "عرض القائمة" : "List View"}>
            <List className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setViewMode("orgchart")} className={`px-3 flex items-center gap-1.5 text-xs transition-colors border-r border-black/[0.08] ${viewMode === "orgchart" ? "bg-black text-white" : "text-black/40 hover:bg-black/[0.04]"}`} data-testid="button-view-orgchart" title={L ? "الهيكل التنظيمي" : "Org Chart"}>
            <GitBranch className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: L ? "إجمالي الفريق" : "Total Team", value: employees.length, color: "text-black dark:text-white" },
          { label: L ? "المدراء" : "Managers", value: employees.filter(e => ["admin","manager"].includes(e.role)).length, color: "text-black dark:text-white" },
          { label: L ? "الموظفون" : "Staff", value: employees.filter(e => !["admin","manager","client"].includes(e.role)).length, color: "text-black dark:text-white" },
          { label: L ? "العملاء" : "Clients", value: clients.length, color: "text-black dark:text-white" },
        ].map((s, i) => (
          <Card key={i} className="border border-black/[0.06] shadow-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-black/40">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employee Views */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-black/25">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{L ? "لا يوجد نتائج" : "No results"}</p>
        </div>
      ) : viewMode === "orgchart" ? (
        <OrgChartView employees={employees} roleLabels={roleLabels} L={L} onEdit={startEdit} />
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <Card key={emp.id} className="border border-black/[0.06] shadow-none hover:border-black/20 hover:shadow-sm transition-all" data-testid={`card-employee-${emp.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative group flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-black/[0.04] flex items-center justify-center">
                      {(emp as any).avatarUrl ? (
                        <img src={(emp as any).avatarUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-black/30">{emp.fullName?.charAt(0)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAvatarClick(String(emp.id))}
                      disabled={uploadingAvatarId === String(emp.id)}
                      className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      data-testid={`button-avatar-${emp.id}`}
                    >
                      {uploadingAvatarId === String(emp.id)
                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                        : <Camera className="w-4 h-4 text-white" />
                      }
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black dark:text-white truncate">{emp.fullName}</p>
                    <p className="text-[10px] text-black/30 truncate">@{emp.username}</p>
                    {(emp as any).employeeCode && (
                      <p className="text-[10px] font-mono font-bold text-violet-600 dark:text-violet-400 truncate" data-testid={`text-empcode-${emp.id}`}>
                        {(emp as any).employeeCode}
                      </p>
                    )}
                    <Badge className={`mt-1.5 text-[10px] border ${roleColors[emp.role] || roleColors.client}`}>
                      {roleLabels[emp.role] || emp.role}
                    </Badge>
                    {(emp as any).jobTitle && (
                      <p className="mt-1 text-[10px] text-black/35 dark:text-white/35 truncate font-medium">{(emp as any).jobTitle}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 border-t border-black/[0.05] pt-3">
                  <div className="flex items-center gap-2 group">
                    <Mail className="w-3 h-3 text-black/20 flex-shrink-0" />
                    <span className="text-[11px] text-black/40 truncate flex-1">{emp.email}</span>
                    <button onClick={() => copyToClipboard(emp.email, "email")} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="w-3 h-3 text-black/30 hover:text-black/60" />
                    </button>
                  </div>
                  {(emp as any).workEmail && (
                    <div className="flex items-center gap-2 group">
                      <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 block" />
                      </div>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono truncate flex-1" dir="ltr">{(emp as any).workEmail}</span>
                      <button onClick={() => copyToClipboard((emp as any).workEmail, "workEmail")} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Copy className="w-3 h-3 text-black/30 hover:text-black/60" />
                      </button>
                    </div>
                  )}
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-black/20 flex-shrink-0" />
                      <span className="text-[11px] text-black/40">{emp.phone}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-1.5">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-black/[0.08] gap-1" onClick={() => startEdit(emp)} data-testid={`button-edit-${emp.id}`}>
                    <Edit2 className="w-3 h-3" /> {L ? "تعديل" : "Edit"}
                  </Button>
                  {emp.role !== 'admin' && (
                    <>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06]" onClick={() => resetPasswordMutation.mutate(String(emp.id))} disabled={resetPasswordMutation.isPending} data-testid={`button-reset-pw-${emp.id}`} title={L ? "إعادة تعيين كلمة المرور" : "Reset Password"}>
                        {resetPasswordMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:bg-white/[0.06] hover:text-black dark:text-white" onClick={() => handleDelete(emp)} disabled={deleteMutation.isPending} data-testid={`button-delete-${emp.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card className="border border-black/[0.06] shadow-none overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-black/[0.04]">
              {filtered.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.01] transition-colors" data-testid={`row-employee-${emp.id}`}>
                  <div className="relative group flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-black/[0.04] flex items-center justify-center">
                      {(emp as any).avatarUrl ? (
                        <img src={(emp as any).avatarUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-black/30">{emp.fullName?.charAt(0)}</span>
                      )}
                    </div>
                    <button onClick={() => handleAvatarClick(String(emp.id))} disabled={uploadingAvatarId === String(emp.id)} className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" data-testid={`button-avatar-list-${emp.id}`}>
                      {uploadingAvatarId === String(emp.id) ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-black dark:text-white truncate">
                      {emp.fullName}
                      {(emp as any).employeeCode && (
                        <span className="ml-2 text-[10px] font-mono text-violet-600 dark:text-violet-400" data-testid={`text-empcode-list-${emp.id}`}>
                          [{(emp as any).employeeCode}]
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-black/30">@{emp.username} · {emp.email}</p>
                  </div>
                  <Badge className={`text-[10px] border hidden md:flex ${roleColors[emp.role] || roleColors.client}`}>{roleLabels[emp.role] || emp.role}</Badge>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-black/20 hover:text-black/60" onClick={() => startEdit(emp)} data-testid={`button-edit-list-${emp.id}`}><Edit2 className="w-3.5 h-3.5" /></Button>
                    {emp.role !== 'admin' && (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-black/70 dark:text-white/70 hover:text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06]" onClick={() => resetPasswordMutation.mutate(String(emp.id))} disabled={resetPasswordMutation.isPending} data-testid={`button-reset-pw-list-${emp.id}`}>
                          {resetPasswordMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-black/20 hover:text-black dark:text-white" onClick={() => handleDelete(emp)} disabled={deleteMutation.isPending} data-testid={`button-delete-list-${emp.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

            <div className="flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2">
              <Mail className="w-4 h-4 text-black dark:text-white shrink-0" />
              <p className="text-black dark:text-white text-xs">{L ? "تم إرسال هذه البيانات إلى" : "These credentials were sent to"}: <strong>{credResult?.email}</strong></p>
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
