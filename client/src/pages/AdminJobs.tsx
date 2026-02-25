import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Edit2, Trash2, Briefcase, Users, CheckCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Job, type Application } from "@shared/schema";
import { useState } from "react";

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
  title: "",
  description: "",
  requirements: "",
  location: "الرياض، المملكة العربية السعودية",
  type: "full-time",
  salaryRange: "",
  status: "open",
};

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: "مفتوح", color: "bg-green-100 text-green-700" },
  closed: { label: "مغلق", color: "bg-red-100 text-red-600" },
  paused: { label: "متوقف", color: "bg-amber-100 text-amber-700" },
};

const typeMap: Record<string, string> = {
  "full-time": "دوام كامل",
  "part-time": "دوام جزئي",
  "remote": "عن بُعد",
  "freelance": "مستقل",
  "internship": "تدريب",
};

const appStatusMap: Record<string, { label: string; color: string }> = {
  new: { label: "جديد", color: "bg-blue-100 text-blue-700" },
  reviewing: { label: "قيد المراجعة", color: "bg-amber-100 text-amber-700" },
  interview: { label: "مقابلة", color: "bg-purple-100 text-purple-700" },
  accepted: { label: "مقبول", color: "bg-green-100 text-green-700" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-600" },
};

export default function AdminJobs() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobFormData>(emptyForm);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [appsOpen, setAppsOpen] = useState(false);

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/admin/applications"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const payload = {
        ...data,
        requirements: data.requirements.split("\n").map(r => r.trim()).filter(Boolean),
      };
      const res = await apiRequest("POST", "/api/admin/jobs", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "تم إضافة الوظيفة بنجاح" });
      setOpen(false);
      setFormData(emptyForm);
    },
    onError: () => toast({ title: "خطأ في إضافة الوظيفة", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const payload = {
        ...data,
        requirements: data.requirements.split("\n").map(r => r.trim()).filter(Boolean),
      };
      const res = await apiRequest("PATCH", `/api/admin/jobs/${editingId}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "تم تحديث الوظيفة بنجاح" });
      setOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    },
    onError: () => toast({ title: "خطأ في تحديث الوظيفة", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "تم حذف الوظيفة" });
    },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast({ title: "يرجى ملء عنوان الوظيفة والوصف", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingId(job.id.toString());
    setFormData({
      title: job.title,
      description: job.description,
      requirements: (job.requirements || []).join("\n"),
      location: job.location || "",
      type: job.type || "full-time",
      salaryRange: job.salaryRange || "",
      status: job.status,
    });
    setOpen(true);
  };

  const handleViewApps = (jobId: string) => {
    setSelectedJobId(jobId);
    setAppsOpen(true);
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
      <div className="flex justify-between items-center">
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
        <div className="border border-black/[0.06] bg-white rounded-xl p-4 flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-lg font-bold text-black">{jobs?.filter(j => j.status === "open").length || 0}</p>
            <p className="text-xs text-black/40">وظائف مفتوحة</p>
          </div>
        </div>
        <div className="border border-black/[0.06] bg-white rounded-xl p-4 flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-lg font-bold text-black">{applications?.length || 0}</p>
            <p className="text-xs text-black/40">إجمالي الطلبات</p>
          </div>
        </div>
        <div className="border border-black/[0.06] bg-white rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-lg font-bold text-black">{applications?.filter(a => a.status === "new").length || 0}</p>
            <p className="text-xs text-black/40">طلبات جديدة</p>
          </div>
        </div>
        <div className="border border-black/[0.06] bg-white rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-lg font-bold text-black">{applications?.filter(a => a.status === "accepted").length || 0}</p>
            <p className="text-xs text-black/40">مقبولون</p>
          </div>
        </div>
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
                return (
                  <tr key={job.id} className="border-b border-black/[0.03] hover:bg-black/[0.02] transition-colors" data-testid={`row-job-${job.id}`}>
                    <td className="p-4">
                      <p className="font-semibold text-black text-sm">{job.title}</p>
                      <p className="text-xs text-black/40 mt-0.5">{job.location}</p>
                    </td>
                    <td className="p-4 text-sm text-black/60">{typeMap[job.type || ""] || job.type}</td>
                    <td className="p-4 text-sm text-black/60">{job.salaryRange || "—"}</td>
                    <td className="p-4">
                      <button
                        className="text-sm font-bold text-blue-600 hover:underline"
                        onClick={() => handleViewApps(job.id?.toString())}
                        data-testid={`button-view-apps-${job.id}`}
                      >
                        {appCount} طلب
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-black/60"
                          onClick={() => handleEdit(job)}
                          data-testid={`button-edit-job-${job.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => deleteMutation.mutate(job.id?.toString())}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-job-${job.id}`}
                        >
                          {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!jobs || jobs.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-black/30">
                    <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>لا توجد وظائف بعد. أضف أول وظيفة الآن.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setEditingId(null); } }}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              {editingId ? "تعديل الوظيفة" : "وظيفة جديدة"}
            </DialogTitle>
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
              <Textarea value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} placeholder="خبرة 2+ سنة في React&#10;إتقان TypeScript&#10;خبرة في REST APIs" rows={4} data-testid="input-job-requirements" />
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
                  <SelectTrigger data-testid="select-job-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeMap).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">الحالة</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger data-testid="select-job-status">
                    <SelectValue />
                  </SelectTrigger>
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

      <Dialog open={appsOpen} onOpenChange={setAppsOpen}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              طلبات التوظيف — {selectedJob?.title}
            </DialogTitle>
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
                return (
                  <div key={app.id} className="border border-black/[0.06] bg-white rounded-xl p-4" data-testid={`row-app-${app.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-black">{app.fullName}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                        </div>
                        <p className="text-sm text-black/50">{app.email}</p>
                        {app.phone && <p className="text-sm text-black/40">{app.phone}</p>}
                        {app.resumeUrl && (
                          <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-1 block">
                            عرض السيرة الذاتية
                          </a>
                        )}
                      </div>
                      <Select value={app.status} onValueChange={(v) => updateAppMutation.mutate({ id: app.id?.toString(), status: v })}>
                        <SelectTrigger className="w-36 h-8 text-xs" data-testid={`select-app-status-${app.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(appStatusMap).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
