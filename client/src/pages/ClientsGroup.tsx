import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Loader2, Send, Image, Newspaper, Shield, Lock,
  Users, Calendar, ChevronLeft, X, Paperclip
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  category?: string;
  publishedAt?: string;
  createdAt: string;
}

function formatTime(dateStr: string, lang: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return lang === "ar" ? "أمس" : "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { weekday: "long" });
  return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

function groupByDate(items: NewsItem[], lang: string) {
  const groups: Record<string, NewsItem[]> = {};
  items.forEach(item => {
    const d = new Date(item.createdAt);
    const key = d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}

interface PostForm {
  title: string;
  content: string;
  imageUrl: string;
  category: string;
}

const emptyPost: PostForm = { title: "", content: "", imageUrl: "", category: "إعلان" };

export default function ClientsGroup() {
  const { lang, dir } = useI18n();
  const { data: user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState<PostForm>(emptyPost);
  const [selectedMsg, setSelectedMsg] = useState<NewsItem | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isAdmin = user && ["admin", "manager"].includes((user as any).role);

  const { data: news = [], isLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/news"],
    queryFn: async () => {
      const r = await fetch("/api/news");
      if (!r.ok) return [];
      const data = await r.json();
      return [...data].reverse();
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [news.length]);

  const postMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/news", {
      title: form.title,
      content: form.content,
      imageUrl: form.imageUrl || undefined,
      category: form.category || "إعلان",
      excerpt: form.content.slice(0, 120),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setForm(emptyPost);
      setShowCompose(false);
      toast({ title: lang === "ar" ? "تم نشر الإعلان" : "Announcement published" });
    },
    onError: () => toast({ title: lang === "ar" ? "فشل النشر" : "Failed to publish", variant: "destructive" }),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col" dir={dir}>
      <PageGraphics variant="hero-light" />
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm px-6">
            <div className="w-16 h-16 bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-black/30 dark:text-white/30" />
            </div>
            <h2 className="text-xl font-black text-black dark:text-white mb-2">
              {lang === "ar" ? "هذه المجموعة خاصة بالعملاء" : "This group is for clients only"}
            </h2>
            <p className="text-sm text-black/40 dark:text-white/40 mb-6">
              {lang === "ar" ? "يجب تسجيل الدخول للوصول إلى مجموعة عملاء QIROX" : "You must be logged in to access the QIROX Clients Group"}
            </p>
            <Button onClick={() => setLocation("/login")} className="premium-btn rounded-xl px-6">
              {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const dateGroups = groupByDate(news, lang);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col" dir={dir}>
      <Navigation />

      {/* Group Header */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-black/[0.07] dark:border-white/[0.07] shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <img src={qiroxLogoPath} alt="QIROX" className="w-7 h-7 object-contain dark:invert" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black dark:text-white truncate">
              {lang === "ar" ? "مجموعة عملاء QIROX" : "QIROX Clients Group"}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-black/40 dark:text-white/40">
              <Users className="w-3 h-3" />
              <span>{lang === "ar" ? "قناة إعلانات رسمية" : "Official announcements channel"}</span>
              <span className="mx-1">·</span>
              <Shield className="w-3 h-3 text-green-500" />
              <span className="text-green-600 dark:text-green-400">{lang === "ar" ? "موثّق" : "Verified"}</span>
            </div>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setShowCompose(true)}
              className="premium-btn rounded-xl text-xs gap-1.5"
              data-testid="button-compose-announcement"
            >
              <Send className="w-3.5 h-3.5" />
              {lang === "ar" ? "إعلان جديد" : "New Post"}
            </Button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-36 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-black/30 dark:text-white/30" />
          </div>
        ) : news.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Newspaper className="w-7 h-7 text-black/20 dark:text-white/20" />
            </div>
            <p className="text-sm font-semibold text-black/40 dark:text-white/40">
              {lang === "ar" ? "لا توجد إعلانات بعد" : "No announcements yet"}
            </p>
            <p className="text-xs text-black/25 dark:text-white/25 mt-1">
              {lang === "ar" ? "سيتم نشر الإعلانات هنا قريباً" : "Announcements will appear here soon"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {Object.entries(dateGroups).map(([date, items]) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-black/[0.08] dark:bg-white/[0.08]" />
                  <span className="text-[11px] font-medium text-black/35 dark:text-white/35 bg-gray-100 dark:bg-gray-950 px-2">{date}</span>
                  <div className="flex-1 h-px bg-black/[0.08] dark:bg-white/[0.08]" />
                </div>

                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="flex items-end gap-2 mb-3"
                    data-testid={`group-message-${item.id}`}
                  >
                    {/* QIROX Avatar */}
                    <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0 mb-0.5">
                      <img src={qiroxLogoPath} alt="Q" className="w-5 h-5 object-contain dark:invert" />
                    </div>

                    {/* Message Bubble */}
                    <div className="max-w-[85%] sm:max-w-[70%]">
                      <p className="text-[11px] font-bold text-black/50 dark:text-white/50 mb-1 px-1">QIROX</p>
                      <button
                        onClick={() => setSelectedMsg(item)}
                        className="text-right w-full bg-white dark:bg-gray-800 rounded-2xl rounded-br-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-black/[0.05] dark:border-white/[0.05]"
                        data-testid={`group-bubble-${item.id}`}
                      >
                        {item.imageUrl && (
                          <div className="aspect-video overflow-hidden bg-black/[0.04]">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="px-4 py-3">
                          {item.category && (
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full mb-2">
                              {item.category}
                            </span>
                          )}
                          <p className="text-sm font-bold text-black dark:text-white leading-snug mb-1 text-start">{item.title}</p>
                          {item.excerpt && (
                            <p className="text-xs text-black/50 dark:text-white/50 line-clamp-2 leading-relaxed text-start">{item.excerpt}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-black/25 dark:text-white/25">{formatTime(item.createdAt, lang)}</span>
                            <span className="text-[10px] text-black/40 dark:text-white/40 font-medium">
                              {lang === "ar" ? "اقرأ أكثر ›" : "Read more ›"}
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* Admin: Compose announcement modal */}
      <AnimatePresence>
        {showCompose && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowCompose(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
              dir="rtl"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 pt-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.06] rounded-t-3xl flex items-center justify-between">
                <h2 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  {lang === "ar" ? "إعلان جديد" : "New Announcement"}
                </h2>
                <button onClick={() => setShowCompose(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4 text-black dark:text-white" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {lang === "ar"
                      ? "⚡ سيظهر هذا الإعلان في مجموعة العملاء وصفحة الأخبار في آن واحد"
                      : "⚡ This announcement will appear in both the Clients Group and the News page"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/50 dark:text-white/50 mb-1.5">{lang === "ar" ? "عنوان الإعلان *" : "Announcement Title *"}</label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={lang === "ar" ? "عنوان واضح ومباشر..." : "Clear and direct title..."} data-testid="input-announce-title" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/50 dark:text-white/50 mb-1.5">{lang === "ar" ? "نص الإعلان *" : "Announcement Content *"}</label>
                  <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder={lang === "ar" ? "اكتب تفاصيل الإعلان هنا..." : "Write announcement details here..."} className="h-28 resize-none" data-testid="textarea-announce-content" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/50 dark:text-white/50 mb-1.5">
                    <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> {lang === "ar" ? "رابط الصورة (اختياري)" : "Image URL (optional)"}</span>
                  </label>
                  <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." data-testid="input-announce-image" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/50 dark:text-white/50 mb-1.5">{lang === "ar" ? "التصنيف" : "Category"}</label>
                  <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder={lang === "ar" ? "إعلان، تحديث، عرض خاص..." : "Announcement, Update, Special offer..."} data-testid="input-announce-category" />
                </div>
                <Button
                  onClick={() => postMutation.mutate()}
                  disabled={postMutation.isPending || !form.title.trim() || !form.content.trim()}
                  className="w-full h-12 premium-btn rounded-xl font-bold gap-2"
                  data-testid="button-publish-announcement"
                >
                  {postMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === "ar" ? "جاري النشر..." : "Publishing..."}</>
                    : <><Send className="w-4 h-4" /> {lang === "ar" ? "نشر الإعلان" : "Publish Announcement"}</>}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMsg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMsg(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              dir="rtl"
            >
              {selectedMsg.imageUrl && (
                <div className="aspect-video overflow-hidden rounded-t-3xl">
                  <img src={selectedMsg.imageUrl} alt={selectedMsg.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-7">
                <button onClick={() => setSelectedMsg(null)} className="absolute top-5 left-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/[0.06] dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4 text-black dark:text-white" />
                </button>
                {selectedMsg.category && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black px-2.5 py-1 rounded-full mb-4">
                    {selectedMsg.category}
                  </span>
                )}
                <h2 className="text-2xl font-black text-black dark:text-white mb-3 leading-snug">{selectedMsg.title}</h2>
                <div className="flex items-center gap-2 text-xs text-black/35 dark:text-white/35 mb-5">
                  <Calendar className="w-3 h-3" />
                  {formatTime(selectedMsg.createdAt, lang)}
                  <span className="mx-1">·</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center">
                      <img src={qiroxLogoPath} alt="Q" className="w-3 h-3 object-contain dark:invert" />
                    </div>
                    QIROX
                  </div>
                </div>
                <div className="text-sm text-black/70 dark:text-white/70 leading-relaxed whitespace-pre-line">{selectedMsg.content}</div>
                <button
                  onClick={() => setSelectedMsg(null)}
                  className="mt-6 w-full bg-black dark:bg-white text-white dark:text-black rounded-xl py-3 font-bold text-sm hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
                  data-testid="button-close-group-message"
                >
                  {lang === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom info bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-black/[0.07] dark:border-white/[0.07] px-4 py-3 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-black/25 dark:text-white/25" />
          <p className="text-xs text-black/30 dark:text-white/30 text-center">
            {lang === "ar"
              ? "هذه قناة إعلانات رسمية. الإرسال محظور على غير المشرفين"
              : "This is an official announcements channel. Only admins can post"}
          </p>
        </div>
      </div>
    </div>
  );
}
