import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useUser } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Palette, Upload, ExternalLink, Plus, Image, Download, Trash2,
  Loader2, Share2, Star, Zap, Globe, ChevronRight, Eye
} from "lucide-react";

const canvaTemplates = [
  { name: "بوستر انستغرام مربع", size: "1080×1080", url: "https://www.canva.com/create/instagram-posts/", icon: "📱" },
  { name: "قصة انستغرام", size: "1080×1920", url: "https://www.canva.com/create/instagram-stories/", icon: "📸" },
  { name: "بوستر تويتر/X", size: "1200×675", url: "https://www.canva.com/create/twitter-posts/", icon: "🐦" },
  { name: "إعلان فيسبوك", size: "1200×628", url: "https://www.canva.com/create/facebook-ads/", icon: "📘" },
  { name: "بنر لينكدإن", size: "1584×396", url: "https://www.canva.com/create/linkedin-banners/", icon: "💼" },
  { name: "بوستر A4", size: "595×842", url: "https://www.canva.com/create/posters/", icon: "📄" },
];

const tawiqTemplates = [
  { name: "قالب عرض خدمات", desc: "تصميم جاهز لعرض خدمات QIROX", color: "from-purple-500 to-blue-600" },
  { name: "قالب حملة رمضان", desc: "تصاميم رمضانية احترافية", color: "from-amber-500 to-orange-600" },
  { name: "قالب إعلان مشروع", desc: "للإعلان عن إطلاق مشروع جديد", color: "from-green-500 to-teal-600" },
  { name: "قالب عروض الأسعار", desc: "تصميم احترافي لعروض الباقات", color: "from-blue-500 to-indigo-600" },
];

interface MarketingPost {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  platform: string;
  status: string;
  createdAt: string;
  uploadedBy?: string;
}

export default function SalesMarketing() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<MarketingPost | null>(null);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", platform: "instagram" });

  const { data: posts, isLoading } = useQuery<MarketingPost[]>({
    queryKey: ["/api/marketing/posts"],
    queryFn: async () => {
      const r = await fetch("/api/marketing/posts", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/marketing/posts", data);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "خطأ"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/posts"] });
      toast({ title: "تم رفع البوستر بنجاح" });
      setUploadOpen(false);
      setForm({ title: "", description: "", imageUrl: "", platform: "instagram" });
    },
    onError: (err: any) => toast({ title: "فشل الرفع", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/marketing/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/posts"] });
      toast({ title: "تم حذف البوستر" });
    },
  });

  const platformLabels: Record<string, string> = {
    instagram: "انستغرام", twitter: "تويتر/X", facebook: "فيسبوك",
    linkedin: "لينكدإن", tiktok: "تيك توك", other: "أخرى",
  };

  return (
    <div className="relative overflow-hidden space-y-8">
      <PageGraphics variant="dashboard" />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-black rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-heading">أدوات التسويق والبوسترات</h1>
              <p className="text-white/40 text-sm mt-0.5">تصميم ورفع وإدارة المواد التسويقية لـ QIROX Studio</p>
            </div>
          </div>
          <Button
            className="bg-white text-black hover:bg-white/90 gap-2 font-bold"
            onClick={() => setUploadOpen(true)}
            data-testid="button-upload-post"
          >
            <Upload className="w-4 h-4" />
            رفع بوستر جديد
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Canva Tools */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2">
          <div className="border border-black/[0.06] bg-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#7B2FBE] rounded-xl flex items-center justify-center">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-black text-sm">Canva — أداة التصميم المجاني</h2>
                <p className="text-xs text-black/40">اختر حجم البوستر وابدأ التصميم مباشرة</p>
              </div>
              <a href="https://www.canva.com" target="_blank" rel="noreferrer" className="mr-auto">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs border-black/10">
                  <ExternalLink className="w-3.5 h-3.5" />
                  فتح Canva
                </Button>
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {canvaTemplates.map((tmpl, i) => (
                <a
                  key={i}
                  href={tmpl.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group border border-black/[0.06] rounded-xl p-3 hover:border-[#7B2FBE]/30 hover:bg-[#7B2FBE]/[0.03] transition-all cursor-pointer"
                  data-testid={`canva-template-${i}`}
                >
                  <div className="text-2xl mb-2">{tmpl.icon}</div>
                  <p className="text-xs font-semibold text-black group-hover:text-[#7B2FBE] transition-colors">{tmpl.name}</p>
                  <p className="text-[10px] text-black/30 mt-0.5">{tmpl.size} px</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-[#7B2FBE]/60 group-hover:text-[#7B2FBE] transition-colors">
                    <ExternalLink className="w-2.5 h-2.5" />
                    فتح في Canva
                  </div>
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
          {[
            { icon: Image, label: "إجمالي البوسترات", val: posts?.length || 0, color: "bg-purple-50 text-purple-600" },
            { icon: Star, label: "هذا الشهر", val: posts?.filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth()).length || 0, color: "bg-amber-50 text-amber-600" },
            { icon: Globe, label: "منصات مختلفة", val: new Set(posts?.map(p => p.platform)).size || 0, color: "bg-blue-50 text-blue-600" },
          ].map(({ icon: Icon, label, val, color }, i) => (
            <Card key={i} className="border border-black/[0.06] shadow-none">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xl font-black text-black">{val}</p>
                  <p className="text-xs text-black/40">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>

      {/* Tawiq Templates */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="border border-black/[0.06] bg-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-black text-sm">قوالب QIROX الجاهزة</h2>
            <p className="text-xs text-black/40 mr-1">قوالب تصميم جاهزة بهوية QIROX Studio</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tawiqTemplates.map((tmpl, i) => (
              <div key={i} className={`bg-gradient-to-br ${tmpl.color} rounded-2xl p-4 text-white cursor-pointer hover:opacity-90 transition-opacity`}>
                <p className="font-bold text-sm mb-1">{tmpl.name}</p>
                <p className="text-white/60 text-[11px] leading-relaxed">{tmpl.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-white/60 text-[10px]">
                  <Palette className="w-3 h-3" />
                  <span>فتح في Canva</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Uploaded Posts */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black/40 uppercase tracking-wider flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-500" />
            البوسترات المرفوعة
            {posts && posts.length > 0 && <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">{posts.length}</span>}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin w-6 h-6 text-black/30" /></div>
        ) : !posts || posts.length === 0 ? (
          <div className="border border-dashed border-black/[0.12] rounded-2xl p-12 text-center">
            <Image className="w-12 h-12 mx-auto mb-4 text-black/20" />
            <p className="font-medium text-black/40">لا توجد بوسترات مرفوعة بعد</p>
            <p className="text-sm text-black/25 mt-1">ارفع أول بوستر تسويقي لـ QIROX Studio</p>
            <Button className="premium-btn mt-4 gap-2" onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4" />
              رفع بوستر
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="group border border-black/[0.06] bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all" data-testid={`post-card-${post.id}`}>
                <div className="aspect-square bg-black/[0.03] relative overflow-hidden">
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-black/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button onClick={() => setPreviewPost(post)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <Eye className="w-4 h-4 text-black" />
                    </button>
                    <a href={post.imageUrl} download target="_blank" rel="noreferrer" className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <Download className="w-4 h-4 text-black" />
                    </a>
                    <button onClick={() => deleteMutation.mutate(post.id)} className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-black truncate">{post.title}</p>
                  <p className="text-[10px] text-black/40 mt-0.5">{platformLabels[post.platform] || post.platform}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-black flex items-center gap-2">
              <Upload className="w-5 h-5 text-black/40" />
              رفع بوستر جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">عنوان البوستر *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="بوستر عرض رمضان 2025" data-testid="input-post-title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">رابط الصورة *</label>
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." dir="ltr" data-testid="input-post-image-url" />
              <p className="text-[11px] text-black/30 mt-1">ارفع الصورة على Canva أو Imgur وضع الرابط هنا</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">المنصة المستهدفة</label>
              <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                <SelectTrigger data-testid="select-post-platform"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">انستغرام</SelectItem>
                  <SelectItem value="twitter">تويتر/X</SelectItem>
                  <SelectItem value="facebook">فيسبوك</SelectItem>
                  <SelectItem value="linkedin">لينكدإن</SelectItem>
                  <SelectItem value="tiktok">تيك توك</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">وصف (اختياري)</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف البوستر والهدف منه..." rows={2} data-testid="input-post-description" />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 premium-btn gap-2" onClick={() => uploadMutation.mutate(form)} disabled={uploadMutation.isPending || !form.title || !form.imageUrl} data-testid="button-submit-post">
                {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                رفع البوستر
              </Button>
              <Button variant="outline" onClick={() => setUploadOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewPost && (
        <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
          <DialogContent className="bg-white border-black/[0.06] text-black max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">{previewPost.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {previewPost.imageUrl && (
                <img src={previewPost.imageUrl} alt={previewPost.title} className="w-full rounded-xl object-cover" />
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-black/40">{platformLabels[previewPost.platform] || previewPost.platform}</span>
                <div className="flex gap-2">
                  <a href={previewPost.imageUrl} download target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />تنزيل</Button>
                  </a>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { navigator.clipboard.writeText(previewPost.imageUrl); toast({ title: "تم نسخ الرابط" }); }}>
                    <Share2 className="w-3.5 h-3.5" />مشاركة
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
