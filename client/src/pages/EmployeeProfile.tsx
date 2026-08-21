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
import { Loader2, Save, Briefcase, CreditCard, Umbrella, X, Plus, ShieldCheck, Camera, Smile, FolderOpen, Video, FileText, Link2, Trash2, ExternalLink, QrCode, RefreshCw, Download, Instagram, Twitter, Linkedin, Youtube, Music2, Globe, RotateCw, IdCard, Lock, Eye, EyeOff, Wallet, Link } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
const qiroxLogoPath = "/qirox-icon-nobg.png";
const qiroxLogoNoBgPath = "/qirox-icon-nobg.png";
import { BiometricManager } from "@/components/BiometricManager";
import { UserAvatar } from "@/components/UserAvatar";
import AvatarBuilder, { DEFAULT_AVATAR, type AvatarConfig } from "@/components/AvatarBuilder";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

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

function LeaveRequestCard({ L, remaining }: { L: boolean; remaining: number }) {
  const { toast } = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const days = from && to ? Math.max(0, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1) : 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/employee/leave-request", { from, to, reason, days });
      return r.json();
    },
    onSuccess: () => { toast({ title: L ? "تم إرسال طلب الإجازة" : "Leave request submitted" }); setOpen(false); setFrom(""); setTo(""); setReason(""); },
    onError: () => toast({ title: L ? "فشل الإرسال" : "Submission failed", variant: "destructive" }),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 text-xs font-bold text-black/50 dark:text-white/40 hover:border-black/15 dark:hover:border-white/15 hover:text-black dark:hover:text-white transition-all"
        data-testid="button-open-leave-request"
      >
        <Umbrella className="w-4 h-4" />
        {L ? "طلب إجازة" : "Request Leave"}
        {remaining > 0 && <span className="ml-auto text-[10px] bg-black/[0.05] dark:bg-white/[0.07] px-2 py-0.5 rounded-full">{remaining} {L ? "يوم متبقي" : "days left"}</span>}
      </button>
    );
  }

  return (
    <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl bg-white dark:bg-gray-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-black dark:text-white flex items-center gap-2"><Umbrella className="w-4 h-4" /> {L ? "طلب إجازة" : "Leave Request"}</p>
        <button onClick={() => setOpen(false)} className="text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-black/40 dark:text-white/40 mb-1 block">{L ? "من" : "From"}</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full h-9 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm px-3 text-black dark:text-white" />
        </div>
        <div>
          <label className="text-[11px] text-black/40 dark:text-white/40 mb-1 block">{L ? "إلى" : "To"}</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full h-9 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm px-3 text-black dark:text-white" />
        </div>
      </div>
      {days > 0 && <p className="text-xs text-black/50 dark:text-white/40">{L ? `المدة: ${days} يوم` : `Duration: ${days} days`}</p>}
      <div>
        <label className="text-[11px] text-black/40 dark:text-white/40 mb-1 block">{L ? "سبب الإجازة" : "Reason"}</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder={L ? "إجازة سنوية / مرضية / طارئة..." : "Annual / Sick / Emergency..."} className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm px-3 py-2 text-black dark:text-white resize-none" />
      </div>
      <button
        onClick={() => mutation.mutate()}
        disabled={!from || !to || !reason || mutation.isPending || days > remaining}
        className="w-full h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-80 transition-opacity disabled:opacity-40"
        data-testid="button-submit-leave-request"
      >
        {mutation.isPending ? "..." : (L ? "إرسال الطلب" : "Submit Request")}
      </button>
      {days > remaining && <p className="text-xs text-red-500 text-center">{L ? "عدد الأيام يتجاوز رصيدك المتبقي" : "Days exceed your remaining balance"}</p>}
    </div>
  );
}

export default function EmployeeProfile() {
  const { toast } = useToast();
    const { lang, dir } = useI18n();
    const L = lang === "ar";
    const queryClient = useQueryClient();
    const { data: user } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const cardFrontRef = useRef<HTMLDivElement>(null);
  const cardBackRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<"front" | "back" | null>(null);

  /** Convert any img element's CSS filter (brightness-0 invert) to a white pixel canvas data URL */
  async function toWhiteDataUrl(src: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const offscreen = document.createElement("canvas");
        offscreen.width = img.naturalWidth;
        offscreen.height = img.naturalHeight;
        const ctx = offscreen.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha > 0) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(offscreen.toDataURL("image/png"));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });
  }

  async function downloadCardSide(side: "front" | "back") {
    const node = side === "front" ? cardFrontRef.current : cardBackRef.current;
    if (!node) return;
    try {
      setDownloading(side);
      // Wait for web fonts (Cairo / IBM Plex Sans Arabic)
      try { await (document as any).fonts?.ready; } catch {}

      // Open a print window with the card content
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("popup blocked");
      const name = ((profile as any)?.fullName || (user as any)?.fullName || (user as any)?.username || "qirox-employee").toString().replace(/\s+/g, "-");
      printWindow.document.write(`
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${name}-id-card-${side}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
              body { margin: 0; padding: 20px; background: #111; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Cairo', sans-serif; }
              @media print { body { margin: 0; padding: 0; background: white; } @page { size: 280px 440px; margin: 0; } }
            </style>
          </head>
          <body>
            ${node.outerHTML}
            <script>window.onload = () => { window.print(); window.close(); }<\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (e) {
      console.error("download card error", e);
    } finally {
      setDownloading(null);
    }
  }
  const [form, setForm] = useState<Partial<Profile>>({});
  const [newSkill, setNewSkill] = useState("");
  const [photoTab, setPhotoTab] = useState<PhotoTab>("photo");
  const [avatarCfg, setAvatarCfg] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", type: "template" as PortfolioItem["type"], url: "", description: "" });
  const [addingItem, setAddingItem] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  // Password change
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);

  useEffect(() => {
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

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
      toast({ title: L ? "الصورة كبيرة جداً — الحد الأقصى 5 MB" : "Image too large — max 5 MB", variant: "destructive" });
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
      if (!r.ok) throw new Error(data.error || (L ? "فشل الرفع" : "Upload failed"));
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      if (data.profilePhotoUrl) setPhotoPreview(data.profilePhotoUrl);
      toast({ title: L ? "✅ تم رفع الصورة" : "✅ Photo uploaded" });
    } catch (err: any) {
      toast({ title: L ? "فشل رفع الصورة" : "Photo upload failed", description: err.message, variant: "destructive" });
      setPhotoPreview(null);
    } finally { setSavingPhoto(false); }
  };

  const saveAvatar = async () => {
    setSavingAvatar(true);
    try {
      await apiRequest("POST", "/api/profile/avatar-config", { avatarConfig: JSON.stringify(avatarCfg) });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: L ? "✅ تم حفظ الأفاتار" : "✅ Avatar saved" });
    } catch {
      toast({ title: L ? "فشل الحفظ" : "Save failed", variant: "destructive" });
    } finally { setSavingAvatar(false); }
  };

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/employee/profile", form).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      toast({ title: L ? "تم حفظ الملف الشخصي" : "Profile saved" });
    },
    onError: () => toast({ title: L ? "حدث خطأ" : "An error occurred", variant: "destructive" }),
  });

  // QR Login Token
  const { data: qrData, refetch: refetchQr } = useQuery<{
    token: string;
    createdAt: string;
    expiresAt: string;
    loginUrl: string;
  }>({
    queryKey: ["/api/employee/qr-token"],
    queryFn: async () => {
      const r = await fetch("/api/employee/qr-token", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const generateQrMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/employee/generate-qr-token").then(r => r.json()),
    onSuccess: () => {
      refetchQr();
      toast({ title: L ? "✅ تم إنشاء باركود تسجيل الدخول" : "✅ QR login code generated" });
    },
    onError: () => toast({ title: L ? "فشل إنشاء الباركود" : "Failed to generate QR", variant: "destructive" }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/employee/change-password", { currentPassword: pwCurrent, newPassword: pwNew });
      if (!r.ok) { const err = await r.json(); throw new Error(err.error || "فشل تغيير الباسورد"); }
      return r.json();
    },
    onSuccess: () => {
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
      toast({ title: L ? "✅ تم تغيير كلمة المرور بنجاح" : "✅ Password changed successfully" });
    },
    onError: (e: any) => toast({ title: e.message || (L ? "فشل تغيير الباسورد" : "Failed to change password"), variant: "destructive" }),
  });

  // The server owns this URL contract so the profile, Wallet pass, and scanner
  // all use the same protected endpoint and canonical host.
  const qrLoginUrl = qrData?.loginUrl || null;

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
      toast({ title: L ? "✅ تم إضافة العنصر" : "✅ Item added" });
    },
    onError: () => toast({ title: L ? "فشل الإضافة" : "Failed to add item", variant: "destructive" }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("DELETE", `/api/employee/portfolio/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      toast({ title: L ? "✅ تم الحذف" : "✅ Deleted" });
    },
    onError: () => toast({ title: L ? "فشل الحذف" : "Delete failed", variant: "destructive" }),
  });

  const ITEM_TYPE_CONFIG = {
    template: { label: "نموذج", icon: FileText, color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white", border: "border-black/10 dark:border-white/10 dark:border-black dark:border-white" },
    file:     { label: "ملف",   icon: Link2,    color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white", border: "border-black/10 dark:border-white/10 dark:border-black dark:border-white" },
    video:    { label: "فيديو", icon: Video,    color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white", border: "border-black/10 dark:border-white/10 dark:border-black dark:border-white" },
  };

  const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const MONTHS = L ? MONTHS_AR : MONTHS_EN;

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
    </div>
  );

  return (
    <div className="relative overflow-hidden space-y-6 max-w-3xl" dir={dir}>
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
            <h1 className="text-xl font-black text-black dark:text-white">{user?.fullName || (L ? "ملفي الشخصي" : "My Profile")}</h1>
            <p className="text-xs text-black/35 dark:text-white/35">{form.jobTitle || (L ? "معلوماتي المهنية والبنكية" : "My Professional & Banking Info")}</p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="bg-black dark:bg-white text-white dark:text-black gap-2" data-testid="button-save-profile">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {L ? "حفظ" : "Save"}
        </Button>
      </div>

      {/* Photo & Avatar Section */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
              <Camera className="w-4 h-4" /> {L ? "صورتي الشخصية" : "My Profile Photo"}
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
                {tab === "photo" ? <><Camera className="w-3.5 h-3.5" />{L ? "رفع صورة" : "Photo"}</> : <><Smile className="w-3.5 h-3.5" />{L ? "أفاتار" : "Avatar"}</>}
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
                  {photoPreview || profile?.profilePhotoUrl ? (L ? "تغيير الصورة" : "Change Photo") : (L ? "رفع صورة" : "Upload Photo")}
                </Button>
                <p className="text-xs text-black/30 dark:text-white/30">{L ? "JPG أو PNG، الحد الأقصى 5MB" : "JPG or PNG, max 5MB"}</p>
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
          { label: L ? "إجمالي أيام الإجازة" : "Total Leave Days", value: profile?.vacationDays || 21, color: "text-black dark:text-white", icon: Umbrella },
          { label: L ? "إجازات مستخدمة" : "Used Leave", value: profile?.vacationUsed || 0, color: "text-black dark:text-white", icon: Umbrella },
          { label: L ? "إجازات متبقية" : "Remaining Leave", value: (profile?.vacationDays || 21) - (profile?.vacationUsed || 0), color: "text-black dark:text-white", icon: Umbrella },
        ].map((s, i) => (
          <Card key={i} className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-black text-black dark:text-white">{s.value}</p>
              <p className="text-[11px] text-black/40 dark:text-white/40 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leave Request */}
      <LeaveRequestCard L={L} remaining={(profile?.vacationDays || 21) - (profile?.vacationUsed || 0)} />

      {/* Professional Info */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> {L ? "المعلومات المهنية" : "Professional Info"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "المسمى الوظيفي" : "Job Title"}</label>
              <Input value={form.jobTitle || ""} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
                placeholder="e.g. Senior Developer" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                data-testid="input-job-title" />
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "تاريخ التعيين" : "Hire Date"}</label>
              <Input type="date" value={form.hireDate ? new Date(form.hireDate).toISOString().split("T")[0] : ""}
                onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))}
                className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "نبذة شخصية" : "Bio"}</label>
            <Textarea value={form.bio || ""} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder={L ? "اكتب نبذة مختصرة عن نفسك..." : "Write a short bio about yourself..."} rows={3}
              className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
              data-testid="input-bio" />
          </div>
          <div>
            <label className="text-xs text-black/40 dark:text-white/40 mb-2 block">{L ? "المهارات" : "Skills"}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.skills || []).map(skill => (
                <Badge key={skill} className="bg-black/[0.06] dark:bg-white/[0.06] text-black dark:text-white gap-1.5 pr-1.5">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-black dark:text-white"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSkill()}
                placeholder={L ? "أضف مهارة..." : "Add a skill..."} className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
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
              <FolderOpen className="w-4 h-4" /> {L ? "نماذجي وملفاتي" : "My Templates & Files"}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setAddingItem(v => !v)}
              className="gap-1.5 text-xs dark:border-white/10 dark:text-white" data-testid="btn-add-portfolio-item">
              <Plus className="w-3.5 h-3.5" /> {L ? "إضافة" : "Add"}
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
                  <p className="text-xs font-bold text-black/50 dark:text-white/50 mb-2">{L ? "إضافة عنصر جديد" : "Add New Item"}</p>

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
                    placeholder={newItem.type === "video" ? (L ? "عنوان الفيديو" : "Video Title") : newItem.type === "file" ? (L ? "اسم الملف" : "File Name") : (L ? "عنوان النموذج" : "Template Title")}
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
                    placeholder={L ? "وصف مختصر (اختياري)" : "Short description (optional)"}
                    className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white text-sm"
                    data-testid="input-portfolio-desc"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => addItemMutation.mutate()}
                      disabled={!newItem.title.trim() || !newItem.url.trim() || addItemMutation.isPending}
                      className="gap-1.5 bg-black dark:bg-white text-white dark:text-black flex-1"
                      data-testid="btn-save-portfolio-item">
                      {addItemMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {L ? "حفظ" : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingItem(false)}
                      className="dark:border-white/10 dark:text-white">
                      {L ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Existing items */}
          {(profile?.portfolioItems || []).length === 0 && !addingItem ? (
            <p className="text-xs text-black/30 dark:text-white/30 text-center py-4">
              {L ? 'لا توجد نماذج بعد — اضغط "إضافة" لإضافة أول نموذج أو ملف' : 'No items yet — click "Add" to add your first template or file'}
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
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/[0.04] dark:bg-white/[0.06] dark:hover:bg-black dark:bg-white hover:text-black dark:text-white transition-colors text-black/30 dark:text-white/30"
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
            <CreditCard className="w-4 h-4" /> {L ? "معلومات بنكية (سرية)" : "Bank Info (Confidential)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "اسم البنك" : "Bank Name"}</label>
              <Input value={form.bankName || ""} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))}
                placeholder={L ? "البنك الأهلي" : "e.g. National Bank"} className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "رقم الحساب" : "Account Number"}</label>
              <Input value={form.bankAccount || ""} onChange={e => setForm(p => ({ ...p, bankAccount: e.target.value }))}
                placeholder="XXXX-XXXX" dir="ltr" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "رقم IBAN" : "IBAN Number"}</label>
              <Input value={form.bankIBAN || ""} onChange={e => setForm(p => ({ ...p, bankIBAN: e.target.value }))}
                placeholder="SA..." dir="ltr" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "رقم الهوية" : "National ID"}</label>
              <Input value={form.nationalId || ""} onChange={e => setForm(p => ({ ...p, nationalId: e.target.value }))}
                placeholder="1xxxxxxxxx" dir="ltr" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee ID Card - Canva Style */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900 overflow-hidden">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
            <IdCard className="w-4 h-4 text-black dark:text-white" />
            {L ? "بطاقة الهوية الوظيفية" : "Employee ID Card"}
          </CardTitle>
          {qrLoginUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCardFlipped(f => !f)}
              className="h-7 gap-1.5 text-xs text-black dark:text-white hover:text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06]"
              data-testid="button-flip-card"
            >
              <RotateCw className="w-3 h-3" />
              {L ? "قلب البطاقة" : "Flip"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {qrLoginUrl ? (
            <div className="flex flex-col items-center gap-4" dir="ltr">
              {/* 3D Flip Card */}
              <div
                className="relative w-[280px] h-[440px] cursor-pointer"
                style={{ perspective: "1500px" }}
                onClick={() => setCardFlipped(f => !f)}
                data-testid="employee-id-card"
              >
                <motion.div
                  className="relative w-full h-full"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: cardFlipped ? 180 : 0 }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                >
                  {/* FRONT — Pure black/white/gray monochrome */}
                  <div
                    ref={cardFrontRef}
                    className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/30"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  >
                    {/* Pure black base with subtle gray gradient */}
                    <div className="absolute inset-0" style={{
                      background: "linear-gradient(135deg, #000000 0%, #18181b 50%, #0a0a0a 100%)"
                    }} />
                    {/* Embossed concentric rings */}
                    <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full border border-white/[0.06]" />
                    <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full border border-white/[0.04]" />
                    <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full border border-white/[0.06]" />
                    {/* Fine grain texture */}
                    <div className="absolute inset-0 opacity-[0.08]" style={{
                      backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
                      backgroundSize: "14px 14px"
                    }} />
                    {/* Top metallic strip */}
                    <div className="absolute top-0 left-0 right-0 h-14" style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)"
                    }} />
                    {/* Lanyard hole */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-2 rounded-full bg-zinc-800 border border-white/20 shadow-inner" />

                    <div className="relative z-10 flex flex-col items-center pt-8 pb-5 px-5 h-full" dir="rtl">
                      {/* Logo — wrapped in a subtle white pill so it's always visible */}
                      <div className="flex items-center gap-2 mb-1 px-3 py-1.5 rounded-xl bg-white/95 shadow-md ring-1 ring-white/40">
                        <img src={qiroxLogoNoBgPath} alt="QIROX" className="h-6 w-auto object-contain" crossOrigin="anonymous" />
                        <span className="text-[10px] font-black tracking-[0.3em] text-black/80">QIROX</span>
                      </div>
                      <div className="text-[9px] tracking-[0.4em] text-white/50 font-medium mb-5 mt-1" dir="ltr">EMPLOYEE</div>

                      {/* Photo with silver ring */}
                      <div className="relative mb-4">
                        <div className="absolute -inset-1.5 rounded-full" style={{
                          background: "conic-gradient(from 180deg, #ffffff, #a1a1aa, #52525b, #a1a1aa, #ffffff)"
                        }} />
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-[3px] border-black bg-zinc-800 shadow-xl">
                          {profile?.profilePhotoUrl ? (
                            <img src={profile.profilePhotoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl text-white/60 font-bold">
                              {(profile?.fullName || (user as any)?.fullName || "?")[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <div className="text-white font-bold text-lg tracking-wide text-center leading-tight px-2 truncate max-w-full" dir="auto" data-dir-auto="true" data-testid="text-id-name">
                        {profile?.fullName || (user as any)?.fullName || (user as any)?.username}
                      </div>

                      {/* Job title */}
                      <div className="mt-1.5 px-3 py-1 rounded-full border border-white/25 bg-white/[0.06] text-white/85 text-[10px] tracking-[0.18em] uppercase font-semibold max-w-[220px] truncate text-center" dir="auto" data-dir-auto="true">
                        {(profile?.jobTitle && profile.jobTitle.trim()) || (L ? "موظف" : "Team Member")}
                      </div>

                      {/* Divider */}
                      <div className="my-4 w-12 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                      {/* Social handles */}
                      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 px-2">
                        {(user as any)?.instagram && (
                          <div className="flex items-center gap-1 text-[9px] text-white/70">
                            <Instagram className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[80px]">{(user as any).instagram}</span>
                          </div>
                        )}
                        {(user as any)?.twitter && (
                          <div className="flex items-center gap-1 text-[9px] text-white/70">
                            <Twitter className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[80px]">{(user as any).twitter}</span>
                          </div>
                        )}
                        {(user as any)?.linkedin && (
                          <div className="flex items-center gap-1 text-[9px] text-white/70">
                            <Linkedin className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[80px]">{(user as any).linkedin}</span>
                          </div>
                        )}
                        {(user as any)?.tiktok && (
                          <div className="flex items-center gap-1 text-[9px] text-white/70">
                            <Music2 className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[80px]">{(user as any).tiktok}</span>
                          </div>
                        )}
                        {(user as any)?.youtube && (
                          <div className="flex items-center gap-1 text-[9px] text-white/70">
                            <Youtube className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[80px]">{(user as any).youtube}</span>
                          </div>
                        )}
                        {(user as any)?.linktree && (
                          <div className="flex items-center gap-1 text-[9px] text-white/70">
                            <Globe className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[80px]">{(user as any).linktree}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom brand strip */}
                      <div className="mt-auto w-full pt-3 border-t border-white/15 flex items-center justify-between">
                        <span className="text-[8px] tracking-[0.3em] text-white/40">qiroxstudio.online</span>
                        <span className="text-[8px] tracking-[0.3em] text-white/40">© QIROX</span>
                      </div>
                    </div>
                  </div>

                  {/* BACK — Pure black/white/gray with QR */}
                  <div
                    ref={cardBackRef}
                    className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/30"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)"
                    }}
                  >
                    {/* Black base */}
                    <div className="absolute inset-0" style={{
                      background: "linear-gradient(160deg, #0a0a0a 0%, #18181b 55%, #000000 100%)"
                    }} />
                    {/* Subtle grain */}
                    <div className="absolute inset-0 opacity-[0.08]" style={{
                      backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
                      backgroundSize: "14px 14px"
                    }} />
                    {/* Decorative diagonal silver ribbon */}
                    <div className="absolute -top-10 -left-10 w-[160%] h-20 rotate-[-12deg]" style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), rgba(255,255,255,0.10), rgba(255,255,255,0.04), transparent)"
                    }} />
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 right-0 h-1" style={{
                      background: "linear-gradient(90deg, #71717a, #ffffff, #a1a1aa, #ffffff, #71717a)"
                    }} />
                    {/* Bottom accent */}
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{
                      background: "linear-gradient(90deg, #71717a, #ffffff, #a1a1aa, #ffffff, #71717a)"
                    }} />

                    <div className="relative z-10 flex flex-col items-center justify-between pt-7 pb-5 px-5 h-full" dir="rtl">
                      {/* Header */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 shadow-md ring-1 ring-white/40">
                          <img src={qiroxLogoNoBgPath} alt="QIROX" crossOrigin="anonymous" className="h-5 w-auto object-contain" />
                          <span className="text-[10px] font-black tracking-[0.3em] text-black/80">QIROX</span>
                        </div>
                        <div className="mt-1.5 text-[9px] tracking-[0.5em] text-white/55 font-semibold" dir="ltr">IDENTIFICATION</div>
                      </div>

                      {/* Watermark ID */}
                      <div className="absolute top-14 left-4 text-[80px] font-black text-white/[0.04] leading-none tracking-tighter select-none">
                        ID
                      </div>

                      {/* QR Code — clean white card with logo center */}
                      <div className="relative">
                        {/* Outer soft halo */}
                        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-white/15 via-white/5 to-transparent blur-xl" />

                        {/* Outer ring with conic silver gradient */}
                        <div className="relative p-[2px] rounded-[20px]" style={{
                          background: "conic-gradient(from 135deg, #ffffff, #71717a, #a1a1aa, #ffffff, #52525b, #d4d4d8)"
                        }}>
                          {/* Inner white mat */}
                          <div className="relative p-3 rounded-[18px] bg-white">
                            {/* Corner brackets */}
                            <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-md" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-md" />
                            <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-md" />
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-md" />

                            {qrLoginUrl ? (
                              <div className="relative">
                                <QRCodeCanvas
                                  id="qr-login-canvas"
                                  value={qrLoginUrl}
                                  size={150}
                                  level="H"
                                  includeMargin={false}
                                  bgColor="#ffffff"
                                  fgColor="#000000"
                                />
                                {/* Centered QIROX logo overlay */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-md bg-white flex items-center justify-center shadow-md ring-1 ring-black/10">
                                  <img src={qiroxLogoNoBgPath} alt="QIROX" crossOrigin="anonymous" className="w-7 h-7 object-contain" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-[150px] h-[150px] flex items-center justify-center text-[10px] text-black/45">
                                {L ? "جاري تجهيز رمز الدخول…" : "Preparing login QR…"}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Floating "SCAN" pill */}
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white text-[8px] font-black tracking-[0.3em] text-black shadow-lg">
                          QIROX • QR
                        </div>
                      </div>

                      {/* Scan instructions */}
                      <div className="text-center space-y-1.5">
                        <div className="text-white text-xs font-bold tracking-wider" dir="auto" data-dir-auto="true">
                          {L ? "امسح للدخول الفوري" : "SCAN TO LOGIN"}
                        </div>
                        <div className="text-white/55 text-[9px] tracking-wide" dir="auto" data-dir-auto="true">
                          {L ? "افتح كاميرا هاتفك ووجهها للباركود" : "Open your phone camera & point it at the code"}
                        </div>
                        {qrData?.expiresAt && (
                          <div className="text-white/45 text-[8px]" dir="auto">
                            {L ? `صالح حتى ${new Date(qrData.expiresAt).toLocaleDateString("ar-SA")}` : `Valid until ${new Date(qrData.expiresAt).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>

                      {/* ID footer */}
                      <div className="w-full flex items-center justify-between pt-3 border-t border-white/15">
                        <span className="text-[8px] tracking-[0.3em] text-white/45">EMP. ID</span>
                        <span className="text-[9px] font-mono text-white/85 tracking-wider">
                          {((user as any)?.id || "").toString().slice(-8).toUpperCase() || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <p className="text-[10px] text-black/40 dark:text-white/40 text-center">
                {L ? "اضغط على البطاقة لقلبها وعرض الباركود" : "Tap the card to flip and reveal the QR code"}
              </p>

              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  onClick={() => downloadCardSide("front")}
                  disabled={downloading !== null}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  data-testid="button-download-card-front"
                >
                  {downloading === "front" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  {L ? "تحميل الوجه" : "Download Front"}
                </Button>
                <Button
                  onClick={() => downloadCardSide("back")}
                  disabled={downloading !== null}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  data-testid="button-download-card-back"
                >
                  {downloading === "back" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  {L ? "تحميل الخلفية" : "Download Back"}
                </Button>
                <Button
                  onClick={() => generateQrMutation.mutate()}
                  disabled={generateQrMutation.isPending}
                  variant="ghost"
                  size="sm"
                  className="col-span-2 gap-1.5 text-xs text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  data-testid="button-regenerate-qr"
                >
                  {generateQrMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  {L ? "تجديد الباركود" : "Regenerate QR"}
                </Button>
              </div>

              {/* Apple Wallet — all devices */}
              {(
                <a
                  href="/api/employee/apple-wallet-pass"
                  download="qirox-employee.pkpass"
                  className="w-full flex items-center justify-center"
                  data-testid="button-apple-wallet"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const r = await fetch(`/api/employee/apple-wallet-pass`, { credentials: "include" });
                      if (r.status === 501) {
                        toast({ title: L ? "⚠️ Apple Wallet غير مفعّل بعد من قِبل المشرف" : "⚠️ Apple Wallet not yet configured by admin", variant: "destructive" });
                        return;
                      }
                      if (!r.ok) { toast({ title: L ? "فشل جلب بطاقة Wallet" : "Failed to download Wallet pass", variant: "destructive" }); return; }
                      const blob = await r.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = "qirox-employee.pkpass"; a.click();
                      URL.revokeObjectURL(url);
                    } catch { toast({ title: L ? "خطأ في التحميل" : "Download error", variant: "destructive" }); }
                  }}
                >
                  <div className="mt-1 w-full rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black flex items-center justify-center gap-2.5 py-2.5 px-4 active:opacity-80 transition-opacity">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.78 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                    </svg>
                    <span className="text-white text-sm font-semibold tracking-wide">{L ? "إضافة إلى Apple Wallet" : "Add to Apple Wallet"}</span>
                  </div>
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                <IdCard className="w-8 h-8 text-zinc-500" />
              </div>
              <p className="text-xs text-black/40 dark:text-white/40 text-center max-w-[220px]">
                {L ? "أنشئ بطاقة هويتك الوظيفية المصممة بطراز كانفا مع باركود لتسجيل دخول فوري" : "Create your Canva-style employee ID badge with a QR for instant login"}
              </p>
              <Button
                onClick={() => generateQrMutation.mutate()}
                disabled={generateQrMutation.isPending}
                className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 text-sm"
                data-testid="button-generate-qr"
              >
                {generateQrMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <IdCard className="w-4 h-4" />}
                {L ? "إنشاء البطاقة" : "Create ID Card"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
            <Lock className="w-4 h-4" /> {L ? "تغيير كلمة المرور" : "Change Password"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "كلمة المرور الحالية" : "Current Password"}</label>
            <Input
              type={showPwCurrent ? "text" : "password"}
              value={pwCurrent}
              onChange={e => setPwCurrent(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white pr-9"
            />
            <button type="button" onClick={() => setShowPwCurrent(p => !p)}
              className="absolute top-7 left-2.5 text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
              {showPwCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "كلمة المرور الجديدة" : "New Password"}</label>
            <Input
              type={showPwNew ? "text" : "password"}
              value={pwNew}
              onChange={e => setPwNew(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white pr-9"
            />
            <button type="button" onClick={() => setShowPwNew(p => !p)}
              className="absolute top-7 left-2.5 text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
              {showPwNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div>
            <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}</label>
            <Input
              type="password"
              value={pwConfirm}
              onChange={e => setPwConfirm(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className={`border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white ${pwConfirm && pwNew !== pwConfirm ? "border-red-400" : ""}`}
            />
            {pwConfirm && pwNew !== pwConfirm && (
              <p className="text-[10px] text-red-500 mt-1">{L ? "كلمتا المرور غير متطابقتين" : "Passwords do not match"}</p>
            )}
          </div>
          <Button
            onClick={() => changePasswordMutation.mutate()}
            disabled={changePasswordMutation.isPending || !pwCurrent || !pwNew || pwNew !== pwConfirm || pwNew.length < 6}
            className="w-full gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80"
            size="sm"
          >
            {changePasswordMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            {L ? "تغيير الباسورد" : "Update Password"}
          </Button>
          <p className="text-[10px] text-black/30 dark:text-white/30 text-center">
            {L ? "إذا سجّلت دخولك بـ Google أو Apple لن يعمل هذا الخيار" : "Not available if you signed in via Google or Apple"}
          </p>
          <div className="pt-1 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between">
            <span className="text-[11px] text-black/40 dark:text-white/40">{L ? "إعداد التحقق الثنائي (2FA)" : "Two-Factor Authentication (2FA)"}</span>
            <a href="/security/2fa" className="text-[11px] font-bold text-black dark:text-white underline underline-offset-2 flex items-center gap-1">
              <Link className="w-3 h-3" />{L ? "الإعدادات" : "Settings"}
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Biometric / Passkey */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> {L ? "الأمان والبصمة" : "Security & Biometrics"}
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
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">{L ? "كشف رواتبي" : "My Payroll"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(payroll || []).slice(0, 6).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-sm border-b border-black/[0.04] dark:border-white/[0.04] pb-2 last:border-0">
                  <span className="text-black/50 dark:text-white/50">{MONTHS[(r.month || 1) - 1]} {r.year}</span>
                  <span className="font-bold text-black dark:text-white flex items-center gap-0.5">{r.netSalary.toLocaleString()} <SARIcon size={9} className="opacity-60" /></span>
                  <Badge className={r.status === "paid" ? "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" : "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white"}>
                    {r.status === "paid" ? (L ? "مدفوع" : "Paid") : (L ? "معلق" : "Pending")}
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
