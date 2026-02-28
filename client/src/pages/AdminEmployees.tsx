import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Users, UserPlus, Edit2, Trash2, X, Search, Shield, Mail, Phone, KeyRound, Copy, Eye, EyeOff } from "lucide-react";
import { type User } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  manager: "مدير",
  accountant: "محاسب",
  sales_manager: "مدير مبيعات",
  sales: "مبيعات",
  developer: "مطور",
  designer: "مصمم",
  support: "دعم فني",
  merchant: "توصيل",
  client: "عميل",
};

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
}

const emptyForm: EmployeeForm = { username: "", password: "", email: "", fullName: "", role: "developer", phone: "" };

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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [credResult, setCredResult] = useState<CredentialResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });

  const createMutation = useMutation({
    mutationFn: async (data: EmployeeForm) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطأ");
      return json;
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCredResult({ username: vars.username, rawPassword: vars.password, email: vars.email, fullName: vars.fullName });
      resetForm();
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmployeeForm> }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "تم تحديث البيانات بنجاح" });
      resetForm();
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "تم حذف الموظف" });
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/reset-password`, {});
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطأ");
      return json;
    },
    onSuccess: (data) => {
      setCredResult({ username: data.username, rawPassword: data.rawPassword, email: data.email, isReset: true });
      toast({ title: "تم إعادة تعيين كلمة المرور وإرسالها بالبريد" });
    },
    onError: (err: any) => toast({ title: "فشل إعادة التعيين", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.username || !form.email || !form.fullName || !form.role) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (editingId) {
      const updates: Record<string, any> = { ...form };
      if (!updates.password) delete updates.password;
      updateMutation.mutate({ id: editingId, data: updates as Partial<EmployeeForm> });
    } else {
      if (!form.password) {
        toast({ title: "يرجى إدخال كلمة المرور", variant: "destructive" });
        return;
      }
      createMutation.mutate(form);
    }
  };

  const startEdit = (emp: User) => {
    setEditingId(String(emp.id));
    setForm({ username: emp.username, password: "", email: emp.email, fullName: emp.fullName, role: emp.role, phone: emp.phone || "" });
    setShowForm(true);
  };

  const handleDelete = (emp: User) => {
    if (confirm(`هل أنت متأكد من حذف ${emp.fullName}؟`)) deleteMutation.mutate(String(emp.id));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `تم نسخ ${label}` });
  };

  const employees = users?.filter(u => u.role !== 'client') || [];
  const clients = users?.filter(u => u.role === 'client') || [];

  const filtered = (filterRole === 'all'
    ? employees
    : filterRole === 'client' ? clients
    : employees.filter(e => e.role === filterRole)
  ).filter(e =>
    !search || e.fullName.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-black/20" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-2" data-testid="text-employees-title">
            <Users className="w-6 h-6 text-black/30" />
            إدارة الفريق
          </h1>
          <p className="text-xs text-black/30 mt-1">{employees.length} موظف · {clients.length} عميل</p>
        </div>
        <Button
          className="bg-black text-white hover:bg-black/80 text-xs h-9 px-5"
          onClick={() => { resetForm(); setShowForm(true); }}
          data-testid="button-add-employee"
        >
          <UserPlus className="w-4 h-4 ml-1.5" />
          إضافة موظف
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="border border-black/[0.06] shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-black">{editingId ? "تعديل الموظف" : "إضافة موظف جديد"}</h3>
                  <button onClick={resetForm} className="text-black/20 hover:text-black/60" data-testid="button-close-form">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">الاسم الكامل *</Label>
                    <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="أحمد محمد" className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-fullname" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">اسم المستخدم *</Label>
                    <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="ahmed_dev" className="h-9 text-xs border-black/[0.08]" disabled={!!editingId} data-testid="input-emp-username" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">البريد الإلكتروني *</Label>
                    <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ahmed@qirox.tech" className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-email" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">{editingId ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور *"}</Label>
                    <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-password" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-black/40 mb-1.5 block">الدور *</Label>
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
                    <Label className="text-[11px] text-black/40 mb-1.5 block">رقم الهاتف</Label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+966 5xx xxx xxxx" className="h-9 text-xs border-black/[0.08]" data-testid="input-emp-phone" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <Button variant="outline" size="sm" className="text-xs h-8 border-black/[0.08]" onClick={resetForm} data-testid="button-cancel-emp">إلغاء</Button>
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-black/80 text-xs h-8 px-5"
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-emp"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingId ? "حفظ التعديلات" : "إضافة"}
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
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." className="h-9 text-xs border-black/[0.08] pr-9" data-testid="input-search-employees" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="h-9 text-xs border-black/[0.08] w-full md:w-[180px]" data-testid="select-filter-role">
            <SelectValue placeholder="جميع الأدوار" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الموظفين</SelectItem>
            <SelectItem value="client">العملاء</SelectItem>
            {employeeRoles.map(r => <SelectItem key={r} value={r}>{roleLabels[r] || r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-black/[0.06] shadow-none overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-black/[0.02] border-b border-black/[0.06]">
                <TableHead className="text-[11px] font-bold text-black/40">الموظف</TableHead>
                <TableHead className="text-[11px] font-bold text-black/40">الدور</TableHead>
                <TableHead className="text-[11px] font-bold text-black/40 hidden md:table-cell">البريد</TableHead>
                <TableHead className="text-[11px] font-bold text-black/40 hidden lg:table-cell">الهاتف</TableHead>
                <TableHead className="text-[11px] font-bold text-black/40 text-left w-[130px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-xs text-black/25">لا يوجد نتائج</TableCell>
                </TableRow>
              ) : filtered.map((emp) => (
                <TableRow key={emp.id} className="border-b border-black/[0.04] hover:bg-black/[0.01]" data-testid={`row-employee-${emp.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center text-[11px] font-bold text-black/30">
                        {emp.fullName?.charAt(0)}
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
                        onClick={() => copyToClipboard(emp.email, "البريد")}
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
                        title="تعديل"
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
                            title="إعادة تعيين كلمة المرور"
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
                            title="حذف"
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
              {credResult?.isReset ? "تم إعادة تعيين كلمة المرور" : "تم إنشاء الحساب بنجاح"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <p className="text-sm text-black/40">
              {credResult?.isReset
                ? "تم إرسال كلمة المرور الجديدة إلى بريد المستخدم تلقائياً"
                : "احتفظ ببيانات الدخول — تم إرسالها بالبريد أيضاً"
              }
            </p>

            <div className="bg-black/[0.03] rounded-2xl p-4 space-y-3">
              {credResult?.fullName && (
                <div className="text-center pb-2 border-b border-black/[0.06]">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">{credResult.fullName[0]}</span>
                  </div>
                  <p className="font-bold text-black text-sm">{credResult.fullName}</p>
                </div>
              )}

              {[
                { label: "البريد الإلكتروني", value: credResult?.email || "", key: "email" },
                { label: "اسم المستخدم", value: credResult?.username || "", key: "username" },
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
                  <p className="text-[10px] text-white/40 font-medium mb-0.5">كلمة المرور</p>
                  <p className="text-sm font-black text-white font-mono tracking-wider" dir="ltr">
                    {showPassword ? (credResult?.rawPassword || "") : "••••••••••••"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setShowPassword(!showPassword)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5 text-white/60" /> : <Eye className="w-3.5 h-3.5 text-white/60" />}
                  </button>
                  <button onClick={() => copyToClipboard(credResult?.rawPassword || "", "كلمة المرور")} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Copy className="w-3.5 h-3.5 text-white/60" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2">
              <Mail className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-amber-700 text-xs">تم إرسال هذه البيانات إلى: <strong>{credResult?.email}</strong></p>
            </div>

            <Button
              className="w-full bg-black text-white hover:bg-black/80"
              onClick={() => { setCredResult(null); setShowPassword(false); }}
            >
              تم، إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
