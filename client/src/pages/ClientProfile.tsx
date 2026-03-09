import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserAvatar } from "@/components/UserAvatar";
import AvatarBuilder, { DEFAULT_AVATAR, type AvatarConfig } from "@/components/AvatarBuilder";
import {
  Camera, Sparkles, Instagram, Link2, Edit3, Save,
  ShoppingBag, FolderOpen, Star, Calendar, Phone,
  Building2, Globe, Twitter, Trash2, X, CheckCircle2,
  Youtube, Loader2, User, Smile,
} from "lucide-react";
import { SiSnapchat, SiTiktok } from "react-icons/si";

interface ProfileData {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  bio?: string;
  jobTitle?: string;
  phone?: string;
  country?: string;
  businessType?: string;
  profilePhotoUrl?: string;
  avatarConfig?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  snapchat?: string;
  tiktok?: string;
  youtube?: string;
  createdAt?: string;
}

interface Stats {
  totalOrders: number;
  activeProjects: number;
  completedProjects: number;
}

type ProfileTab = "photo" | "avatar";

const BADGE_DEFS = [
  { icon: "🚀", label: "عميل رائد", condition: (s: Stats) => s.totalOrders >= 5 },
  { icon: "💎", label: "عميل مميز", condition: (s: Stats) => s.completedProjects >= 3 },
  { icon: "⭐", label: "نجم القرن", condition: (s: Stats) => s.totalOrders >= 10 },
  { icon: "🏆", label: "المحترف", condition: (s: Stats) => s.completedProjects >= 5 },
  { icon: "🎯", label: "منجز", condition: (s: Stats) => s.activeProjects > 0 },
  { icon: "🌟", label: "عضو نشيط", condition: (s: Stats) => s.totalOrders >= 1 },
];

export default function ClientProfile() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("photo");
  const [avatarCfg, setAvatarCfg] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [form, setForm] = useState<Partial<ProfileData>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile/me"],
    queryFn: async () => {
      const r = await fetch("/api/profile/me", { credentials: "include" });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
  });

  const { data: orders } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const r = await fetch("/api/orders", { credentials: "include" });
      if (!r.ok) return [];
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

  const stats: Stats = {
    totalOrders: orders?.length ?? 0,
    activeProjects: orders?.filter((o: any) => ["in_progress", "pending"].includes(o.status)).length ?? 0,
    completedProjects: orders?.filter((o: any) => o.status === "completed").length ?? 0,
  };

  const earnedBadges = BADGE_DEFS.filter(b => b.condition(stats));

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/profile/me", form).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/profile/me"] });
      qc.invalidateQueries({ queryKey: ["/api/user"] });
      setEditing(false);
      toast({ title: "✅ تم حفظ الملف الشخصي" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

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
      qc.invalidateQueries({ queryKey: ["/api/profile/me"] });
      qc.invalidateQueries({ queryKey: ["/api/user"] });
      if (data.profilePhotoUrl) setPhotoPreview(data.profilePhotoUrl);
      toast({ title: "✅ تم رفع الصورة" });
    } catch (err: any) {
      toast({ title: "فشل رفع الصورة", description: err.message, variant: "destructive" });
      setPhotoPreview(null);
    } finally { setSavingPhoto(false); }
  };

  const removePhoto = async () => {
    setSavingPhoto(true);
    try {
      await apiRequest("DELETE", "/api/profile/photo");
      setPhotoPreview(null);
      qc.invalidateQueries({ queryKey: ["/api/profile/me"] });
      qc.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "تم حذف الصورة" });
    } catch {
      toast({ title: "فشل الحذف", variant: "destructive" });
    } finally { setSavingPhoto(false); }
  };

  const saveAvatar = async () => {
    setSavingAvatar(true);
    try {
      await apiRequest("POST", "/api/profile/avatar-config", { avatarConfig: JSON.stringify(avatarCfg) });
      qc.invalidateQueries({ queryKey: ["/api/profile/me"] });
      qc.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "✅ تم حفظ الأفاتار" });
    } catch {
      toast({ title: "فشل الحفظ", variant: "destructive" });
    } finally { setSavingAvatar(false); }
  };

  const currentPhoto = photoPreview ?? profile?.profilePhotoUrl;

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16 space-y-5" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-pink-500/10 dark:from-violet-900/30 dark:via-indigo-900/20 dark:to-pink-900/20" />
        </div>
        <Card className="border border-white/30 dark:border-white/5 bg-white/70 dark:bg-black/40 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <UserAvatar
                  profilePhotoUrl={currentPhoto}
                  avatarConfig={profile?.avatarConfig}
                  name={profile?.fullName}
                  role={profile?.role}
                  size="2xl"
                  showRing
                />
                {savingPhoto && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {editing ? (
                  <Input
                    value={form.fullName ?? ""}
                    onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                    className="text-lg font-bold mb-1 bg-white/50 dark:bg-white/5 border-black/10 dark:border-white/10"
                    data-testid="input-fullname"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{profile?.fullName}</h2>
                )}
                <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">@{profile?.username}</p>
                {editing ? (
                  <Input
                    value={form.jobTitle ?? ""}
                    onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
                    placeholder="المسمى الوظيفي / نوع العمل..."
                    className="mt-1 text-sm bg-white/50 dark:bg-white/5 border-black/10 dark:border-white/10"
                    data-testid="input-jobtitle"
                  />
                ) : profile?.jobTitle ? (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                    <Building2 className="w-3 h-3" />{profile.jobTitle}
                  </span>
                ) : null}
              </div>

              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending}
                      className="gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-none"
                      data-testid="btn-save-profile"
                    >
                      {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      حفظ
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)} data-testid="btn-cancel-edit">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm" variant="outline"
                    onClick={() => setEditing(true)}
                    className="gap-1 border-black/10 dark:border-white/10 dark:text-white"
                    data-testid="btn-edit-profile"
                  >
                    <Edit3 className="w-3.5 h-3.5" />تعديل
                  </Button>
                )}
              </div>
            </div>

            {editing ? (
              <Textarea
                value={form.bio ?? ""}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="نبذة عنك..."
                rows={2}
                className="mt-3 text-sm bg-white/50 dark:bg-white/5 border-black/10 dark:border-white/10 resize-none"
                data-testid="textarea-bio"
              />
            ) : profile?.bio ? (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{profile.bio}</p>
            ) : null}

            {earnedBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {earnedBadges.map(b => (
                  <motion.span
                    key={b.label}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400/20 to-yellow-300/20 border border-amber-400/30 text-amber-700 dark:text-amber-300"
                  >
                    {b.icon} {b.label}
                  </motion.span>
                ))}
              </div>
            )}

            <div className="mt-3 text-xs text-black/30 dark:text-white/30 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              عضو منذ {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long" }) : "—"}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <ShoppingBag className="w-5 h-5" />, label: "الطلبات", value: stats.totalOrders, color: "from-blue-500 to-indigo-600" },
          { icon: <FolderOpen className="w-5 h-5" />, label: "نشطة", value: stats.activeProjects, color: "from-emerald-500 to-teal-600" },
          { icon: <CheckCircle2 className="w-5 h-5" />, label: "مكتملة", value: stats.completedProjects, color: "from-violet-500 to-purple-700" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="border border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardContent className="p-3 text-center">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mx-auto mb-1.5`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-xs text-black/40 dark:text-white/40">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-4 h-4 text-violet-500" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">صورة الملف الشخصي</h3>
          </div>

          <div className="flex gap-2 mb-4 p-1 bg-black/5 dark:bg-white/5 rounded-2xl">
            {(["photo", "avatar"] as ProfileTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setProfileTab(tab)}
                data-testid={`tab-profile-${tab}`}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
                  profileTab === tab
                    ? "bg-white dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-black/50 dark:text-white/40 hover:text-black/70 dark:hover:text-white/60"
                }`}
              >
                {tab === "photo" ? <><Camera className="w-4 h-4" />رفع صورة</> : <><Smile className="w-4 h-4" />أفاتار مخصص</>}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {profileTab === "photo" ? (
              <motion.div key="photo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} data-testid="input-photo" />
                <div className="flex flex-col items-center gap-3">
                  {currentPhoto ? (
                    <div className="relative">
                      <img src={currentPhoto} alt="profile" className="w-24 h-24 rounded-full object-cover ring-4 ring-violet-400/40 shadow-lg" />
                      <button
                        onClick={removePhoto}
                        className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition"
                        data-testid="btn-remove-photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center gap-1">
                      <Camera className="w-8 h-8 text-black/20 dark:text-white/20" />
                    </div>
                  )}
                  <Button
                    onClick={() => fileRef.current?.click()}
                    disabled={savingPhoto}
                    className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-none"
                    data-testid="btn-upload-photo"
                  >
                    {savingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    {currentPhoto ? "تغيير الصورة" : "رفع صورة"}
                  </Button>
                  <p className="text-xs text-black/30 dark:text-white/30">JPG, PNG، الحد الأقصى 1.5MB</p>
                </div>
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

      {editing && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-violet-500" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">معلومات الاتصال</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">رقم الجوال</label>
                  <Input value={form.phone ?? ""} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+966..." className="bg-white/50 dark:bg-white/5 border-black/10 dark:border-white/10" data-testid="input-phone" />
                </div>
                <div>
                  <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">الدولة</label>
                  <Input value={form.country ?? ""} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="المملكة العربية السعودية" className="bg-white/50 dark:bg-white/5 border-black/10 dark:border-white/10" data-testid="input-country" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">نوع العمل / الشركة</label>
                  <Input value={form.businessType ?? ""} onChange={e => setForm(p => ({ ...p, businessType: e.target.value }))} placeholder="تجارة إلكترونية، مطعم، خدمات..." className="bg-white/50 dark:bg-white/5 border-black/10 dark:border-white/10" data-testid="input-business" />
                </div>
              </div>

              <div className="border-t border-black/5 dark:border-white/5 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="w-4 h-4 text-violet-500" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">روابط التواصل الاجتماعي</h4>
                </div>
                <div className="space-y-2">
                  {[
                    { key: "instagram", placeholder: "@username", icon: <Instagram className="w-4 h-4 text-pink-500" />, label: "Instagram" },
                    { key: "twitter", placeholder: "@username", icon: <Twitter className="w-4 h-4 text-sky-400" />, label: "X (Twitter)" },
                    { key: "snapchat", placeholder: "@username", icon: <SiSnapchat className="w-4 h-4 text-yellow-400" />, label: "Snapchat" },
                    { key: "tiktok", placeholder: "@username", icon: <SiTiktok className="w-4 h-4 text-gray-900 dark:text-white" />, label: "TikTok" },
                    { key: "youtube", placeholder: "@channel", icon: <Youtube className="w-4 h-4 text-red-500" />, label: "YouTube" },
                    { key: "linkedin", placeholder: "linkedin.com/in/...", icon: <Link2 className="w-4 h-4 text-blue-600" />, label: "LinkedIn" },
                  ].map(s => (
                    <div key={s.key} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0">{s.icon}</div>
                      <Input
                        value={(form as any)[s.key] ?? ""}
                        onChange={e => setForm(p => ({ ...p, [s.key]: e.target.value }))}
                        placeholder={s.placeholder}
                        className="text-sm bg-white/50 dark:bg-white/5 border-black/10 dark:border-white/10"
                        data-testid={`input-social-${s.key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!editing && (
        <Card className="border border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-violet-500" />
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">التواصل الاجتماعي</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile?.instagram && (
                <a href={`https://instagram.com/${profile.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 hover:scale-105 transition-transform"
                  data-testid="link-instagram">
                  <Instagram className="w-3.5 h-3.5" /> {profile.instagram}
                </a>
              )}
              {profile?.twitter && (
                <a href={`https://x.com/${profile.twitter.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 hover:scale-105 transition-transform"
                  data-testid="link-twitter">
                  <Twitter className="w-3.5 h-3.5" /> {profile.twitter}
                </a>
              )}
              {profile?.snapchat && (
                <a href={`https://snapchat.com/add/${profile.snapchat.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-400/10 border border-yellow-400/20 text-yellow-600 dark:text-yellow-400 hover:scale-105 transition-transform"
                  data-testid="link-snapchat">
                  <SiSnapchat className="w-3.5 h-3.5" /> {profile.snapchat}
                </a>
              )}
              {profile?.tiktok && (
                <a href={`https://tiktok.com/@${profile.tiktok.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:scale-105 transition-transform"
                  data-testid="link-tiktok">
                  <SiTiktok className="w-3.5 h-3.5" /> {profile.tiktok}
                </a>
              )}
              {profile?.youtube && (
                <a href={`https://youtube.com/@${profile.youtube.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 hover:scale-105 transition-transform"
                  data-testid="link-youtube">
                  <Youtube className="w-3.5 h-3.5" /> {profile.youtube}
                </a>
              )}
              {!profile?.instagram && !profile?.twitter && !profile?.snapchat && !profile?.tiktok && !profile?.youtube && (
                <p className="text-xs text-black/30 dark:text-white/30">لا توجد روابط — اضغط تعديل لإضافتها</p>
              )}
            </div>

            {(profile?.phone || profile?.country || profile?.businessType) && (
              <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 space-y-1.5">
                {profile.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-3.5 h-3.5 text-violet-400" />
                    {profile.phone}
                  </div>
                )}
                {profile.country && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Globe className="w-3.5 h-3.5 text-violet-400" />
                    {profile.country}
                  </div>
                )}
                {profile.businessType && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Building2 className="w-3.5 h-3.5 text-violet-400" />
                    {profile.businessType}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">شاراتي</h3>
          </div>
          {earnedBadges.length === 0 ? (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 text-amber-300/50 mx-auto mb-2" />
              <p className="text-xs text-black/30 dark:text-white/30">أكمل أول طلب للحصول على شارتك!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {BADGE_DEFS.map((b, i) => {
                const earned = b.condition(stats);
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: earned ? 1 : 0.3 }}
                    transition={{ delay: i * 0.06 }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                      earned
                        ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200/50 dark:border-amber-700/30"
                        : "bg-black/3 dark:bg-white/3 border-black/5 dark:border-white/5 grayscale"
                    }`}
                    data-testid={`badge-${i}`}
                  >
                    <span className="text-2xl">{b.icon}</span>
                    <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300 leading-tight">{b.label}</span>
                    {earned && <span className="text-[10px] text-amber-500">مكتسبة ✓</span>}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
