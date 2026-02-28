import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Plus, Edit2, Trash2, Briefcase, Users, CheckCircle,
  Mail, Phone, FileText, UserPlus, Shield, Star, Eye, X, Copy
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Job, type Application } from "@shared/schema";
import { useState } from "react";
import { motion } from "framer-motion";

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  type: string;
  salaryRange: string;
  status: string;
}

const emptyForm: JobFormData = {
  title: "", description: "", requirements: "",
  location: "الرياض، المملكة العربية السعودية",
  type: "full-time", salaryRange: "", status: "open",
};

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: "مفتوح", color: "bg-green-100 text-green-700" },
  closed: { label: "مغلق", color: "bg-red-100 text-red-600" },
  paused: { label: "متوقف", color: "bg-amber-100 text-amber-700" },
};

const typeMap: Record<string, string> = {
  "full-time": "دوام كامل", "part-time": "دوام جزئي",
  "remote": "عن بُعد", "freelance": "مستقل", "internship": "تدريب",
};

const appStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "جديد", color: "bg-blue-100 text-blue-700", icon: Star },
  reviewing: { label: "قيد المراجعة", color: "bg-amber-100 text-amber-700", icon: Eye },
  interview: { label: "مقابلة", color: "bg-purple-100 text-purple-700", icon: Users },
  accepted: { label: "مقبول ✓", color: "bg-green-100 text-green-700", icon: CheckCircle },
  hired: { label: "تم التعيين ✓✓", color: "bg-emerald-100 text-emerald-800", icon: Shield },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-600", icon: X },
};

const roleLabels: Record<string, string> = {
  manager: "مدير",
  accountant: "محاسب",
  sales_manager: "مدير مبيعات",
  sales: "موظف مبيعات",
  developer: "مطور برمجيات",
  designer: "مصمم",
  support: "دعم فني",
  merchant: "توصيل وتسليم",
};

export default function AdminJobs() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobFormData>(emptyForm);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [appsOpen, setAppsOpen] = useState(false);
  const [hireApp, setHireApp] = useState<Application | null>(null);
  const [hireOpen, setHireOpen] = useState(false);
  const [hireForm, setHireForm] = useState({ username: "", role: "developer" });
  const [hired, setHired] = useState<{ username: string; password: string; email: string } | null>(null);

  const { data: jobs, isLoading } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });
  const { data: applications } = useQuery<Application[]>({ queryKey: ["/api/admin/applications"] });

  const createMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const payload = { ...data, requirements: data.requirements.split("\n").map(r => r.trim()).filter(Boolean) };
      const res = await apiRequest("POST", "/api/admin/jobs", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "تم إضافة الوظيفة بنجاح" });
      setOpen(false); setFormData(emptyForm);
    },
    onError: () => toast({ title: "خطأ في إضافة الوظيفة", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const payload = { ...data, requirements: data.requirements.split("\n").map(r => r.trim()).filter(Boolean) };
      const res = await apiRequest("PATCH", `/api/admin/jobs/${editingId}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "تم تحديث الوظيفة بنجاح" });
      setOpen(false); setEditingId(null); setFormData(emptyForm);
    },
    onError: () => toast({ title: "خطأ في تحديث الوظيفة", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/jobs/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }); toast({ title: "تم حذف الوظيفة" }); },
    onError: () => toast({ title: "خطأ في حذف الوظيفة", variant: "destructive" }),
  });

  const updateAppMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/applications/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({ title: "تم تحديث حالة الطلب" });
    },
    onError: () => toast({ title: "خطأ في تحديث الطلب", variant: "destructive" }),
  });

  const hireMutation = useMutation({
    mutationFn: async ({ appId, body }: { appId: string; body: any }) => {
      const res = await apiRequest("POST", `/api/admin/applications/${appId}/hire`, body);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "خطأ"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setHired({ username: data.username, password: data.rawPassword, email: data.email });
    },
    onError: (err: any) => toast({ title: "فشل التعيين", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast({ title: "يرجى ملء عنوان الوظيفة والوصف", variant: "destructive" });
      return;
    }
    if (editingId) updateMutation.mutate(formData);
    else createMutation.mutate(formData);
  };

  const handleEdit = (job: Job) => {
    setEditingId(job.id.toString());
    setFormData({
      title: job.title, description: job.description,
      requirements: (job.requirements || []).join("\n"),
      location: job.location || "", type: job.type || "full-time",
      salaryRange: job.salaryRange || "", status: job.status,
    });
    setOpen(true);
  };

  const openHireDialog = (app: Application) => {
    setHireApp(app);
    const suggestedUsername = app.email?.split("@")[0]?.replace(/[^a-z0-9_]/gi, "").toLowerCase().slice(0, 20) || "";
    setHireForm({ username: suggestedUsername, role: "developer" });
    setHired(null);
    setHireOpen(true);
  };

  const handleHire = () => {
    if (!hireApp || !hireForm.username || !hireForm.role) {
      toast({ title: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    hireMutation.mutate({
      appId: hireApp.id?.toString(),
      body: {
        role: hireForm.role,
        username: hireForm.username,
        email: hireApp.email,
        fullName: hireApp.fullName,
        phone: hireApp.phone || "",
      },
    });
  };

  const jobApplications = applications?.filter(a => a.jobId?.toString() === selectedJobId);
  const selectedJob = jobs?.find(j => j.id?.toString() === selectedJobId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-black/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold text-black flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-black/40" />
          إدارة الوظائف والتوظيف
        </h1>
        <Button onClick={() => { setEditingId(null); setFormData(emptyForm); setOpen(true); }} className="gap-2 premium-btn" data-testid="button-add-job">
          <Plus className="w-4 h-4" />
          وظيفة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Briefcase, val: jobs?.filter(j => j.status === "open").length || 0, label: "وظائف مفتوحة", color: "text-green-500" },
          { icon: Users, val: applications?.length || 0, label: "إجمالي الطلبات", color: "text-blue-500" },
          { icon: Star, val: applications?.filter(a => a.status === "new").length || 0, label: "طلبات جديدة", color: "text-amber-500" },
          { icon: Shield, val: applications?.filter(a => a.status === "hired").length || 0, label: "تم تعيينهم", color: "text-emerald-500" },
        ].map(({ icon: Icon, val, label, color }, i) => (
          <div key={i} className="border border-black/[0.06] bg-white rounded-xl p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 ${color}`} />
            <div>
              <p className="text-lg font-bold text-black">{val}</p>
              <p className="text-xs text-black/40">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-black/[0.06] bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الوظيفة</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">النوع</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الراتب</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الطلبات</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الحالة</th>
                <th className="text-left p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {jobs?.map((job) => {
                const st = statusMap[job.status] || statusMap["open"];
                const appCount = applications?.filter(a => a.jobId?.toString() === job.id?.toString()).length || 0;
                const acceptedCount = applications?.filter(a => a.jobId?.toString() === job.id?.toString() && (a.status === "accepted" || a.status === "hired")).length || 0;
                return (
                  <tr key={job.id} className="border-b border-black/[0.03] hover:bg-black/[0.02] transition-colors" data-testid={`row-job-${job.id}`}>
                    <td className="p-4">
                      <p className="font-semibold text-black text-sm">{job.title}</p>
                      <p className="text-xs text-black/40 mt-0.5">{job.location}</p>
                    </td>
                    <td className="p-4 text-sm text-black/60">{typeMap[job.type || ""] || job.type}</td>
                    <td className="p-4 text-sm text-black/60">{job.salaryRange || "—"}</td>
                    <td className="p-4">
                      <button className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"
                        onClick={() => { setSelectedJobId(job.id?.toString()); setAppsOpen(true); }}
                        data-testid={`button-view-apps-${job.id}`}>
                        {appCount} طلب
                        {acceptedCount > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{acceptedCount} مقبول</span>}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="text-black/60" onClick={() => handleEdit(job)} data-testid={`button-edit-job-${job.id}`}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(job.id?.toString())} disabled={deleteMutation.isPending} data-testid={`button-delete-job-${job.id}`}>
                          {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!jobs || jobs.length === 0) && (
                <tr><td colSpan={6} className="p-12 text-center text-black/30">
                  <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>لا توجد وظائف بعد. أضف أول وظيفة الآن.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Form Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setEditingId(null); } }}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">{editingId ? "تعديل الوظيفة" : "وظيفة جديدة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">المسمى الوظيفي *</label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="مطور واجهات أمامية" data-testid="input-job-title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">وصف الوظيفة *</label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="وصف تفصيلي للوظيفة والمهام..." rows={4} data-testid="input-job-description" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">المتطلبات (كل متطلب في سطر)</label>
              <Textarea value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} placeholder="خبرة 2+ سنة في React&#10;إتقان TypeScript" rows={4} data-testid="input-job-requirements" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">الموقع</label>
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="الرياض، السعودية" data-testid="input-job-location" />
              </div>
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">نطاق الراتب</label>
                <Input value={formData.salaryRange} onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })} placeholder="5,000 - 10,000 ر.س" data-testid="input-job-salary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">نوع الدوام</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger data-testid="select-job-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeMap).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">الحالة</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger data-testid="select-job-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">مفتوح</SelectItem>
                    <SelectItem value="paused">متوقف</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 premium-btn" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-job">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingId ? "تحديث الوظيفة" : "إضافة الوظيفة"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Applications Dialog */}
      <Dialog open={appsOpen} onOpenChange={setAppsOpen}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">طلبات التوظيف — {selectedJob?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {!jobApplications || jobApplications.length === 0 ? (
              <div className="p-12 text-center text-black/30">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>لا توجد طلبات توظيف لهذه الوظيفة بعد</p>
              </div>
            ) : (
              jobApplications.map((app) => {
                const st = appStatusMap[app.status] || appStatusMap["new"];
                const StatusIcon = st.icon;
                const isAccepted = app.status === "accepted";
                const isHired = app.status === "hired";
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-2xl p-5 transition-all ${isAccepted ? "border-green-200 bg-green-50/50" : isHired ? "border-emerald-200 bg-emerald-50/30" : "border-black/[0.06] bg-white"}`}
                    data-testid={`row-app-${app.id}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <p className="font-bold text-black text-base">{app.fullName}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold ${st.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {st.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 bg-black/[0.03] rounded-xl px-3 py-2">
                            <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[10px] text-black/40 font-medium">البريد الإلكتروني</p>
                              <p className="text-sm font-semibold text-black truncate" dir="ltr">{app.email}</p>
                            </div>
                          </div>
                          {app.phone && (
                            <div className="flex items-center gap-2 bg-black/[0.03] rounded-xl px-3 py-2">
                              <Phone className="w-4 h-4 text-green-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-black/40 font-medium">رقم الهاتف</p>
                                <p className="text-sm font-semibold text-black" dir="ltr">{app.phone}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {app.resumeUrl && (
                          <a href={app.resumeUrl} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 underline mt-3">
                            <FileText className="w-3.5 h-3.5" />
                            عرض السيرة الذاتية
                          </a>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        <Select value={app.status} onValueChange={(v) => updateAppMutation.mutate({ id: app.id?.toString(), status: v })}>
                          <SelectTrigger className="w-40 h-8 text-xs" data-testid={`select-app-status-${app.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(appStatusMap).map(([key, val]) => (
                              <SelectItem key={key} value={key}>{val.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {isAccepted && !isHired && (
                          <Button
                            size="sm"
                            className="premium-btn gap-2 text-xs h-8"
                            onClick={() => openHireDialog(app)}
                            data-testid={`button-hire-${app.id}`}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            تعيين كموظف
                          </Button>
                        )}
                        {isHired && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-100 px-3 py-1.5 rounded-lg">
                            <Shield className="w-3.5 h-3.5" />
                            تم التعيين
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hire Dialog */}
      <Dialog open={hireOpen} onOpenChange={(v) => { if (!v) { setHireOpen(false); setHired(null); } }}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-black/40" />
              تعيين موظف جديد
            </DialogTitle>
          </DialogHeader>

          {hired ? (
            <div className="py-4 space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-bold text-black text-lg mb-1">تم التعيين بنجاح!</h3>
                <p className="text-black/40 text-sm">احتفظ ببيانات الدخول — تم إرسالها بالبريد أيضاً</p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">بيانات دخول الموظف</p>

                <div className="bg-white rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-black/40 font-medium mb-0.5">البريد الإلكتروني</p>
                    <p className="text-sm font-bold text-black font-mono" dir="ltr">{hired.email}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(hired.email); toast({ title: "تم نسخ البريد" }); }} className="w-7 h-7 rounded-lg bg-black/[0.04] hover:bg-black/10 flex items-center justify-center transition-colors">
                    <Copy className="w-3.5 h-3.5 text-black/50" />
                  </button>
                </div>

                <div className="bg-white rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-black/40 font-medium mb-0.5">اسم المستخدم</p>
                    <p className="text-sm font-bold text-black font-mono" dir="ltr">{hired.username}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(hired.username); toast({ title: "تم نسخ اسم المستخدم" }); }} className="w-7 h-7 rounded-lg bg-black/[0.04] hover:bg-black/10 flex items-center justify-center transition-colors">
                    <Copy className="w-3.5 h-3.5 text-black/50" />
                  </button>
                </div>

                <div className="bg-black rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-white/40 font-medium mb-0.5">كلمة المرور</p>
                    <p className="text-sm font-black text-white font-mono tracking-wider" dir="ltr">{hired.password}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(hired.password); toast({ title: "تم نسخ كلمة المرور" }); }} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Copy className="w-3.5 h-3.5 text-white/60" />
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-amber-700 text-xs">تم إرسال هذه البيانات إلى بريد الموظف تلقائياً</p>
              </div>

              <Button className="w-full premium-btn" onClick={() => { setHireOpen(false); setHired(null); }}>
                إغلاق
              </Button>
            </div>
          ) : (
            <div className="space-y-5 mt-4">
              {hireApp && (
                <div className="bg-black/[0.03] rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-black/40 uppercase tracking-wider">بيانات المتقدم</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {hireApp.fullName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-black">{hireApp.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-black/60">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span dir="ltr">{hireApp.email}</span>
                    </div>
                    {hireApp.phone && (
                      <div className="flex items-center gap-2 text-sm text-black/60">
                        <Phone className="w-4 h-4 text-green-500" />
                        <span dir="ltr">{hireApp.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">اسم المستخدم في النظام *</label>
                <Input
                  value={hireForm.username}
                  onChange={(e) => setHireForm({ ...hireForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                  placeholder="ahmed_developer"
                  dir="ltr"
                  data-testid="input-hire-username"
                />
                <p className="text-xs text-black/30 mt-1">أحرف إنجليزية وأرقام وشرطة سفلية فقط</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">دور الموظف في النظام *</label>
                <Select value={hireForm.role} onValueChange={(v) => setHireForm({ ...hireForm, role: v })}>
                  <SelectTrigger data-testid="select-hire-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-black/30" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-black/30 mt-1">سيتم إرسال كلمة المرور التلقائية إلى البريد: {hireApp?.email}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3 flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 text-xs font-semibold mb-0.5">سيتم إرسال بريد تلقائي</p>
                  <p className="text-amber-700 text-[11px] leading-relaxed">
                    سيتلقى الموظف بريداً يحتوي على اسم المستخدم وكلمة المرور لتسجيل الدخول في النظام.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 premium-btn gap-2"
                  onClick={handleHire}
                  disabled={hireMutation.isPending}
                  data-testid="button-confirm-hire"
                >
                  {hireMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  تأكيد التعيين وإرسال البريد
                </Button>
                <Button variant="outline" onClick={() => setHireOpen(false)}>إلغاء</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
