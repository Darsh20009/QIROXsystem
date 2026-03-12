import SARIcon from "@/components/SARIcon";
import { useState, useEffect, useRef } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Save, Briefcase, CreditCard, Umbrella, X, Plus, ShieldCheck, Camera, Smile, FolderOpen, Video, FileText, Link2, Trash2, ExternalLink } from "lucide-react";
import { BiometricManager } from "@/components/BiometricManager";
import { UserAvatar } from "@/components/UserAvatar";
import AvatarBuilder, { DEFAULT_AVATAR, type AvatarConfig } from "@/components/AvatarBuilder";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";

interface PortfolioItem {
  _id: string;
  title: string;
  type: "template" | "file" | "video";
  url: string;
  description?: string;
}

interface Profile {
  id: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  vacationDays?: number;
  vacationUsed?: number;
  bankName?: string;
  bankAccount?: string;
  bankIBAN?: string;
  nationalId?: string;
  hireDate?: string;
  jobTitle?: string;
  profilePhotoUrl?: string;
  avatarConfig?: string;
  fullName?: string;
  email?: string;
  portfolioItems?: PortfolioItem[];
}

type PhotoTab = "photo" | "avatar";

export default function EmployeeProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [newSkill, setNewSkill] = useState("");
  const [photoTab, setPhotoTab] = useState<PhotoTab>("photo");
  const [avatarCfg, setAvatarCfg] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", type: "template" as PortfolioItem["type"], url: "", description: "" });
  const [addingItem, setAddingItem] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["/api/employee/profile"],
    queryFn: async () => {
      const r = await fetch("/api/employee/profile", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { data: payroll } = useQuery({
    queryKey: ["/api/employee/payroll"],
    queryFn: async () => {
      const r = await fetch("/api/employee/payroll", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  useEffect(() => {
    if (profile) {
      setForm(profile);
      if (profile.avatarConfig) {
        try { setAvatarCfg(JSON.parse(profile.avatarConfig)); } catch {}
      }
    }
  }, [profile]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "الصورة كبيرة جداً — الحد الأقصى 5 MB", variant: "destructive" });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setSavingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/profile/photo", { method: "POST", body: fd, credentials: "include" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "فشل الرفع");
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      if (data.profilePhotoUrl) setPhotoPreview(data.profilePhotoUrl);
      toast({ title: "✅ تم رفع الصورة" });
    } catch (err: any) {
      toast({ title: "فشل رفع الصورة", description: err.message, variant: "destructive" });
      setPhotoPreview(null);
    } finally { setSavingPhoto(false); }
  };

  const saveAvatar = async () => {
    setSavingAvatar(true);
    try {
      await apiRequest("POST", "/api/profile/avatar-config", { avatarConfig: JSON.stringify(avatarCfg) });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "✅ تم حفظ الأفاتار" });
    } catch {
      toast({ title: "فشل الحفظ", variant: "destructive" });
    } finally { setSavingAvatar(false); }
  };

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/employee/profile", form).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      toast({ title: "تم حفظ الملف الشخصي" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setForm(p => ({ ...p, skills: [...(p.skills || []), newSkill.trim()] }));
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setForm(p => ({ ...p, skills: (p.skills || []).filter(s => s !== skill) }));
  };

  const addItemMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/employee/portfolio", newItem).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      setNewItem({ title: "", type: "template", url: "", description: "" });
      setAddingItem(false);
      toast({ title: "✅ تم إضافة العنصر" });
    },
    onError: () => toast({ title: "فشل الإضافة", variant: "destructive" }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("DELETE", `/api/employee/portfolio/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      toast({ title: "✅ تم الحذف" });
    },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  const ITEM_TYPE_CONFIG = {
    template: { label: "نموذج", icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-700" },
    file:     { label: "ملف",   icon: Link2,    color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-700" },
    video:    { label: "فيديو", icon: Video,    color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-700" },
  };

  const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
    </div>
  );

  return (
    <div className="relative overflow-hidden space-y-6 max-w-3xl" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar
            profilePhotoUrl={profile?.profilePhotoUrl}
            avatarConfig={profile?.avatarConfig}
            name={user?.fullName}
            role={user?.role}
            size="lg"
            showRing
          />
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">{user?.fullName || "ملفي الشخصي"}</h1>
            <p className="text-xs text-black/35 dark:text-white/35">{form.jobTitle || "معلوماتي المهنية والبنكية"}</p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="bg-black dark:bg-white text-white dark:text-black gap-2" data-testid="button-save-profile">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </Button>
      </div>

      {/* Photo & Avatar Section */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
              <Camera className="w-4 h-4" /> صورتي الشخصية
            </h3>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} data-testid="input-photo-employee" />
          <div className="flex gap-2 mb-4 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
            {(["photo", "avatar"] as PhotoTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setPhotoTab(tab)}
                data-testid={`tab-employee-${tab}`}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  photoTab === tab
                    ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm"
                    : "text-black/50 dark:text-white/40"
                }`}
              >
                {tab === "photo" ? <><Camera className="w-3.5 h-3.5" />رفع صورة</> : <><Smile className="w-3.5 h-3.5" />أفاتار</>}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {photoTab === "photo" ? (
              <motion.div key="photo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                <div className="relative">
                  <UserAvatar
                    profilePhotoUrl={photoPreview ?? profile?.profilePhotoUrl}
                    avatarConfig={profile?.avatarConfig}
                    name={user?.fullName}
                    role={user?.role}
                    size="2xl"
                    showRing
                  />
                  {savingPhoto && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => fileRef.current?.click()}
                  disabled={savingPhoto}
                  size="sm"
                  className="gap-2 bg-black dark:bg-white text-white dark:text-black"
                  data-testid="btn-upload-photo-employee"
                >
                  {savingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  {photoPreview || profile?.profilePhotoUrl ? "تغيير الصورة" : "رفع صورة"}
                </Button>
                <p className="text-xs text-black/30 dark:text-white/30">JPG أو PNG، الحد الأقصى 5MB</p>
              </motion.div>
            ) : (
              <motion.div key="avatar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AvatarBuilder
                  config={avatarCfg}
                  onChange={setAvatarCfg}
                  onSave={saveAvatar}
                  saving={savingAvatar}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Vacation Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي أيام الإجازة", value: profile?.vacationDays || 21, color: "text-blue-500", icon: Umbrella },
          { label: "إجازات مستخدمة", value: profile?.vacationUsed || 0, color: "text-yellow-500", icon: Umbrella },
          { label: "إجازات متبقية", value: (profile?.vacationDays || 21) - (profile?.vacationUsed || 0), color: "text-green-500", icon: Umbrella },
        ].map((s, i) => (
          <Card key={i} className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-black text-black dark:text-white">{s.value}</p>
              <p className="text-[11px] text-black/40 dark:text-white/40 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Professional Info */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> المعلومات المهنية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">المسمى الوظيفي</label>
              <Input value={form.jobTitle || ""} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
                placeholder="e.g. Senior Developer" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                data-testid="input-job-title" />
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">تاريخ التعيين</label>
              <Input type="date" value={form.hireDate ? new Date(form.hireDate).toISOString().split("T")[0] : ""}
                onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))}
                className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">نبذة شخصية</label>
            <Textarea value={form.bio || ""} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="اكتب نبذة مختصرة عن نفسك..." rows={3}
              className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
              data-testid="input-bio" />
          </div>
          <div>
            <label className="text-xs text-black/40 dark:text-white/40 mb-2 block">المهارات</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.skills || []).map(skill => (
                <Badge key={skill} className="bg-black/[0.06] dark:bg-white/[0.06] text-black dark:text-white gap-1.5 pr-1.5">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSkill()}
                placeholder="أضف مهارة..." className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                data-testid="input-skill" />
              <Button size="sm" variant="outline" onClick={addSkill} className="dark:border-white/10 dark:text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Items */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" /> نماذجي وملفاتي
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setAddingItem(v => !v)}
              className="gap-1.5 text-xs dark:border-white/10 dark:text-white" data-testid="btn-add-portfolio-item">
              <Plus className="w-3.5 h-3.5" /> إضافة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new item form */}
          <AnimatePresence>
            {addingItem && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border border-dashed border-black/15 dark:border-white/15 rounded-xl p-4 space-y-3 bg-black/[0.02] dark:bg-white/[0.02]">
                  <p className="text-xs font-bold text-black/50 dark:text-white/50 mb-2">إضافة عنصر جديد</p>

                  {/* Type selector */}
                  <div className="flex gap-2">
                    {(Object.entries(ITEM_TYPE_CONFIG) as [PortfolioItem["type"], typeof ITEM_TYPE_CONFIG.template][]).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <button key={key} onClick={() => setNewItem(p => ({ ...p, type: key }))}
                          data-testid={`btn-item-type-${key}`}
                          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                            newItem.type === key
                              ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                              : "bg-black/[0.03] dark:bg-white/[0.03] border-transparent text-black/40 dark:text-white/40"
                          }`}>
                          <Icon className="w-4 h-4" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>

                  <Input
                    value={newItem.title}
                    onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
                    placeholder={newItem.type === "video" ? "عنوان الفيديو" : newItem.type === "file" ? "اسم الملف" : "عنوان النموذج"}
                    className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white text-sm"
                    data-testid="input-portfolio-title"
                  />
                  <Input
                    value={newItem.url}
                    onChange={e => setNewItem(p => ({ ...p, url: e.target.value }))}
                    placeholder="https://..."
                    dir="ltr"
                    className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white text-sm"
                    data-testid="input-portfolio-url"
                  />
                  <Input
                    value={newItem.description}
                    onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                    placeholder="وصف مختصر (اختياري)"
                    className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white text-sm"
                    data-testid="input-portfolio-desc"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => addItemMutation.mutate()}
                      disabled={!newItem.title.trim() || !newItem.url.trim() || addItemMutation.isPending}
                      className="gap-1.5 bg-black dark:bg-white text-white dark:text-black flex-1"
                      data-testid="btn-save-portfolio-item">
                      {addItemMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      حفظ
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingItem(false)}
                      className="dark:border-white/10 dark:text-white">
                      إلغاء
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Existing items */}
          {(profile?.portfolioItems || []).length === 0 && !addingItem ? (
            <p className="text-xs text-black/30 dark:text-white/30 text-center py-4">
              لا توجد نماذج بعد — اضغط "إضافة" لإضافة أول نموذج أو ملف
            </p>
          ) : (
            <div className="space-y-2">
              {(profile?.portfolioItems || []).map(item => {
                const cfg = ITEM_TYPE_CONFIG[item.type] || ITEM_TYPE_CONFIG.template;
                const Icon = cfg.icon;
                return (
                  <div key={item._id}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}
                    data-testid={`portfolio-item-${item._id}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white dark:bg-gray-900 shadow-sm`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-black dark:text-white truncate">{item.title}</p>
                      {item.description && <p className="text-xs text-black/40 dark:text-white/40 truncate">{item.description}</p>}
                      <p className="text-[10px] text-black/30 dark:text-white/30 truncate dir-ltr">{item.url}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        data-testid={`btn-open-${item._id}`}>
                        <ExternalLink className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                      </a>
                      <button onClick={() => deleteItemMutation.mutate(item._id)}
                        disabled={deleteItemMutation.isPending}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors text-black/30 dark:text-white/30"
                        data-testid={`btn-delete-${item._id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Info */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> معلومات بنكية (سرية)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">اسم البنك</label>
              <Input value={form.bankName || ""} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))}
                placeholder="البنك الأهلي" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">رقم الحساب</label>
              <Input value={form.bankAccount || ""} onChange={e => setForm(p => ({ ...p, bankAccount: e.target.value }))}
                placeholder="XXXX-XXXX" dir="ltr" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">رقم IBAN</label>
              <Input value={form.bankIBAN || ""} onChange={e => setForm(p => ({ ...p, bankIBAN: e.target.value }))}
                placeholder="SA..." dir="ltr" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">رقم الهوية</label>
              <Input value={form.nationalId || ""} onChange={e => setForm(p => ({ ...p, nationalId: e.target.value }))}
                placeholder="1xxxxxxxxx" dir="ltr" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Biometric / Passkey */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> الأمان والبصمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BiometricManager />
        </CardContent>
      </Card>

      {/* My Payroll */}
      {(payroll || []).length > 0 && (
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">كشف رواتبي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(payroll || []).slice(0, 6).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-sm border-b border-black/[0.04] dark:border-white/[0.04] pb-2 last:border-0">
                  <span className="text-black/50 dark:text-white/50">{MONTHS_AR[(r.month || 1) - 1]} {r.year}</span>
                  <span className="font-bold text-black dark:text-white flex items-center gap-0.5">{r.netSalary.toLocaleString()} <SARIcon size={9} className="opacity-60" /></span>
                  <Badge className={r.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                    {r.status === "paid" ? "مدفوع" : "معلق"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
