import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Trash2, Pencil, Send, Printer, GripVertical, CheckCircle2,
  Clock, Play, XCircle, AlertCircle, Loader2, ChevronRight,
  Package, User, ArrowRight, Star, LayoutGrid, Mail, X
} from "lucide-react";
import { Link } from "wouter";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const CATEGORIES = [
  { value: 'feature', label: 'ميزة عامة' },
  { value: 'design', label: 'تصميم' },
  { value: 'development', label: 'تطوير' },
  { value: 'integration', label: 'تكامل خارجي' },
  { value: 'security', label: 'أمان' },
  { value: 'performance', label: 'أداء' },
  { value: 'content', label: 'محتوى' },
  { value: 'other', label: 'أخرى' },
];
const PRIORITIES = [
  { value: 'low', label: 'منخفضة', color: 'bg-gray-100 text-gray-600' },
  { value: 'medium', label: 'متوسطة', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'عالية', color: 'bg-amber-100 text-amber-700' },
  { value: 'critical', label: 'حرجة', color: 'bg-red-100 text-red-700' },
];
const STATUSES = [
  { value: 'pending', label: 'قيد الانتظار', icon: Clock, color: 'text-gray-500 bg-gray-100' },
  { value: 'in_progress', label: 'جارٍ التنفيذ', icon: Play, color: 'text-amber-600 bg-amber-100' },
  { value: 'completed', label: 'مكتملة', icon: CheckCircle2, color: 'text-green-700 bg-green-100' },
  { value: 'cancelled', label: 'ملغاة', icon: XCircle, color: 'text-red-600 bg-red-100' },
];

function statusInfo(s: string) { return STATUSES.find(x => x.value === s) || STATUSES[0]; }
function priorityInfo(p: string) { return PRIORITIES.find(x => x.value === p) || PRIORITIES[1]; }
function categoryLabel(c: string) { return CATEGORIES.find(x => x.value === c)?.label || c; }

export default function AdminProjectFeatures() {
  const { data: user } = useUser() as any;
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editFeature, setEditFeature] = useState<any>(null);
  const [sendEmailLoading, setSendEmailLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'feature', priority: 'medium', status: 'pending', assignedTo: ''
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const r = await fetch("/api/projects", { credentials: "include" });
      return r.json();
    },
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const r = await fetch("/api/employees", { credentials: "include" });
      return r.json();
    },
  });

  const { data: features = [], isLoading: loadingFeatures } = useQuery<any[]>({
    queryKey: ["/api/projects", selectedProjectId, "features"],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const r = await fetch(`/api/projects/${selectedProjectId}/features`, { credentials: "include" });
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  const selectedProject = projects.find((p: any) => (p.id || p._id) === selectedProjectId);

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", `/api/projects/${selectedProjectId}/features`, data);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "features"] });
      setShowAddDialog(false);
      setFormData({ title: '', description: '', category: 'feature', priority: 'medium', status: 'pending', assignedTo: '' });
      toast({ title: "تم إضافة الميزة" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("PATCH", `/api/projects/${selectedProjectId}/features/${editFeature.id}`, data);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "features"] });
      setEditFeature(null);
      toast({ title: "تم تحديث الميزة" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${selectedProjectId}/features/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "features"] });
      toast({ title: "تم الحذف" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const handleSendEmail = async () => {
    if (!selectedProjectId) return;
    setSendEmailLoading(true);
    try {
      const r = await apiRequest("POST", `/api/projects/${selectedProjectId}/features/send-email`, {
        projectName: selectedProject?.stagingUrl || `مشروع #${selectedProjectId?.slice(-6)}`,
      });
      const data = await r.json();
      if (data.ok) toast({ title: "تم إرسال البريد الإلكتروني للعميل" });
      else toast({ title: "خطأ", description: data.error, variant: "destructive" });
    } catch { toast({ title: "خطأ", description: "فشل الإرسال", variant: "destructive" }); }
    finally { setSendEmailLoading(false); }
  };

  const handlePrint = () => {
    const name = encodeURIComponent(selectedProject?.stagingUrl || `مشروع #${selectedProjectId?.slice(-6)}`);
    window.open(`/api/projects/${selectedProjectId}/features/print?name=${name}`, '_blank');
  };

  const completed = features.filter((f: any) => f.status === 'completed').length;
  const pct = features.length > 0 ? Math.round((completed / features.length) * 100) : 0;

  const openAdd = () => {
    setFormData({ title: '', description: '', category: 'feature', priority: 'medium', status: 'pending', assignedTo: '' });
    setShowAddDialog(true);
  };
  const openEdit = (f: any) => {
    setFormData({
      title: f.title, description: f.description || '', category: f.category || 'feature',
      priority: f.priority || 'medium', status: f.status || 'pending',
      assignedTo: f.assignedTo?.id || f.assignedTo || ''
    });
    setEditFeature(f);
  };

  const FeatureForm = ({ onSubmit, loading }: { onSubmit: () => void; loading: boolean }) => (
    <div className="space-y-3" dir="rtl">
      <div>
        <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">اسم الميزة *</label>
        <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="مثال: نظام تسجيل الدخول" className="rounded-xl" data-testid="input-feature-title" />
      </div>
      <div>
        <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">الوصف</label>
        <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="وصف تفصيلي للميزة..." rows={2} className="rounded-xl text-sm" data-testid="input-feature-desc" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">الفئة</label>
          <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v }))}>
            <SelectTrigger className="rounded-xl text-sm h-9" data-testid="select-feature-category"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">الأولوية</label>
          <Select value={formData.priority} onValueChange={v => setFormData(p => ({ ...p, priority: v }))}>
            <SelectTrigger className="rounded-xl text-sm h-9" data-testid="select-feature-priority"><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">الحالة</label>
          <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
            <SelectTrigger className="rounded-xl text-sm h-9" data-testid="select-feature-status"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">تعيين لـ</label>
          <Select value={formData.assignedTo} onValueChange={v => setFormData(p => ({ ...p, assignedTo: v }))}>
            <SelectTrigger className="rounded-xl text-sm h-9" data-testid="select-feature-assignee"><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">— بدون تعيين —</SelectItem>
              {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.fullName || e.username}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button className="w-full bg-black text-white font-bold rounded-xl h-10 gap-2" onClick={onSubmit} disabled={!formData.title.trim() || loading} data-testid="button-save-feature">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        حفظ الميزة
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center">
              <LayoutGrid className="w-4.5 h-4.5 text-violet-600" />
            </div>
            <div>
              <h1 className="font-black text-base text-black dark:text-white">إدارة مميزات المشاريع</h1>
              <p className="text-xs text-black/40 dark:text-white/30">أضف وعدّل مميزات مشاريع العملاء</p>
            </div>
          </div>
        </div>

        {/* Project selector */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-4">
          <label className="text-xs font-black text-black/50 dark:text-white/30 uppercase tracking-wider mb-2 block">اختر المشروع</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {projects.length === 0 && <p className="text-sm text-black/30 dark:text-white/20 col-span-3 py-2">لا توجد مشاريع</p>}
            {projects.map((p: any) => {
              const pid = p.id || p._id;
              const isSelected = pid === selectedProjectId;
              return (
                <div key={pid} onClick={() => setSelectedProjectId(pid)} className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer border transition-all ${isSelected ? "bg-black text-white border-transparent" : "border-black/[0.06] dark:border-white/[0.07] hover:border-black/20 dark:hover:border-white/20 bg-transparent"}`} data-testid={`project-card-${pid}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 text-violet-700"}`}>
                    {(p.stagingUrl || "M")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-black dark:text-white"}`}>{p.stagingUrl || `مشروع #${String(pid).slice(-6)}`}</p>
                    <p className={`text-[10px] ${isSelected ? "text-white/50" : "text-black/40 dark:text-white/30"}`}>{p.status}</p>
                  </div>
                  {isSelected && <ChevronRight className="w-3.5 h-3.5 text-white/60" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Features panel */}
        {selectedProjectId && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.07]">
              <div className="flex-1">
                <p className="font-black text-sm text-black dark:text-white">ملف المميزات</p>
                {features.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 max-w-[120px] h-1.5 bg-gray-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-black/50 dark:text-white/30">{pct}% مكتمل ({completed}/{features.length})</span>
                  </div>
                )}
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-black/10 dark:border-white/10 rounded-lg" onClick={handlePrint} disabled={features.length === 0} data-testid="button-print-features">
                <Printer className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-black/10 dark:border-white/10 rounded-lg" onClick={handleSendEmail} disabled={features.length === 0 || sendEmailLoading} data-testid="button-email-features">
                {sendEmailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} إرسال للعميل
              </Button>
              <Link href={`/project/${selectedProjectId}/workspace`}>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg" data-testid="button-open-workspace">
                  <ArrowRight className="w-3.5 h-3.5" /> مساحة العمل
                </Button>
              </Link>
              <Button size="sm" className="h-7 text-xs gap-1 bg-black text-white hover:bg-black/80 rounded-lg" onClick={openAdd} data-testid="button-add-feature">
                <Plus className="w-3.5 h-3.5" /> إضافة ميزة
              </Button>
            </div>

            {/* Features list */}
            {loadingFeatures ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
            ) : features.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <LayoutGrid className="w-10 h-10 text-black/10 dark:text-white/10" />
                <p className="text-sm text-black/30 dark:text-white/20">لا توجد مميزات بعد</p>
                <Button size="sm" className="bg-black text-white rounded-xl gap-1.5 text-xs" onClick={openAdd}>
                  <Plus className="w-3.5 h-3.5" /> إضافة أول ميزة
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {features.map((f: any, idx: number) => {
                  const si = statusInfo(f.status);
                  const pi = priorityInfo(f.priority);
                  const SIcon = si.icon;
                  return (
                    <div key={f.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] group" data-testid={`feature-row-${f.id}`}>
                      <span className="text-xs font-bold text-black/25 dark:text-white/20 w-5 pt-0.5 flex-shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-bold ${f.status === 'completed' ? 'line-through text-black/40 dark:text-white/30' : 'text-black dark:text-white'}`}>{f.title}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pi.color}`}>{pi.label}</span>
                          <span className="text-[10px] text-black/30 dark:text-white/20">{categoryLabel(f.category)}</span>
                        </div>
                        {f.description && <p className="text-[11px] text-black/45 dark:text-white/35 mt-0.5 line-clamp-1">{f.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${si.color}`}>
                            <SIcon className="w-2.5 h-2.5" /> {si.label}
                          </span>
                          {f.assignedTo && (
                            <span className="text-[10px] text-black/40 dark:text-white/30 flex items-center gap-1">
                              <User className="w-2.5 h-2.5" /> {f.assignedTo.fullName || f.assignedTo.username}
                            </span>
                          )}
                          {f.completedAt && (
                            <span className="text-[10px] text-green-600 dark:text-green-400">
                              ✓ أنجزت {new Date(f.completedAt).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-black/[0.05]" onClick={() => openEdit(f)} data-testid={`button-edit-feature-${f.id}`}>
                          <Pencil className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-red-50" onClick={() => deleteMutation.mutate(f.id)} disabled={deleteMutation.isPending} data-testid={`button-delete-feature-${f.id}`}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="font-black">إضافة ميزة جديدة</DialogTitle></DialogHeader>
          <FeatureForm onSubmit={() => addMutation.mutate(formData)} loading={addMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editFeature} onOpenChange={v => !v && setEditFeature(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="font-black">تعديل الميزة</DialogTitle></DialogHeader>
          <FeatureForm onSubmit={() => editMutation.mutate(formData)} loading={editMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
