import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Loader2, Newspaper, Calendar, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useSEO } from "@/hooks/use-seo";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  category?: string;
  createdAt: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }
  })
};

function formatDate(dateStr: string, lang: string) {
  const locale = lang === "ar" ? "ar-SA" : "en-US";
  return new Date(dateStr).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

function NewsCard({ item, index, onClick, lang }: { item: NewsItem; index: number; onClick: () => void; lang: string }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      onClick={onClick}
      className="group cursor-pointer bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden hover:shadow-lg hover:shadow-black/[0.07] transition-all duration-300 hover:-translate-y-1"
      data-testid={`card-news-${item.id}`}
    >
      {item.imageUrl ? (
        <div className="aspect-video overflow-hidden bg-black/[0.04]">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-black to-black/70 flex items-center justify-center">
          <Newspaper className="w-10 h-10 text-white/20" />
        </div>
      )}
      <div className="p-5">
        {item.category && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black px-2.5 py-1 rounded-full mb-3">
            {item.category}
          </span>
        )}
        <h2 className="text-base font-black text-black dark:text-white mb-2 leading-snug group-hover:text-black/70 dark:group-hover:text-white/70 transition-colors line-clamp-2">
          {item.title}
        </h2>
        {item.excerpt && (
          <p className="text-sm text-black/50 dark:text-white/50 leading-relaxed line-clamp-3 mb-4">{item.excerpt}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-black/35 dark:text-white/35">
            <Calendar className="w-3 h-3" />
            {formatDate(item.createdAt, lang)}
          </div>
          <span className="text-xs font-bold text-black/50 dark:text-white/50 group-hover:text-black dark:group-hover:text-white flex items-center gap-1 transition-colors">
            {lang === "ar" ? "اقرأ المزيد" : "Read More"}
            <ChevronLeft className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function NewsModal({ item, onClose, lang }: { item: NewsItem; onClose: () => void; lang: string }) {
  const { dir } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        {item.imageUrl && (
          <div className="aspect-video overflow-hidden rounded-t-3xl">
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-7" dir={dir}>
          {item.category && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black px-2.5 py-1 rounded-full mb-4">
              {item.category}
            </span>
          )}
          <h1 className="text-2xl font-black text-black dark:text-white mb-3 leading-snug">{item.title}</h1>
          <div className="flex items-center gap-1.5 text-xs text-black/35 dark:text-white/35 mb-6">
            <Calendar className="w-3 h-3" />
            {formatDate(item.createdAt, lang)}
          </div>
          <div className="text-sm text-black/70 dark:text-white/70 leading-relaxed whitespace-pre-line">{item.content}</div>
          <div className="mt-8 flex gap-2">
            <button
              onClick={() => {
                const text = `${item.title}\n${window.location.origin}/news`;
                if (navigator.share) {
                  navigator.share({ title: item.title, text: item.excerpt || item.title, url: window.location.origin + "/news" }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(text).then(() => alert(lang === "ar" ? "تم نسخ الرابط" : "Link copied!"));
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-black/[0.04] dark:bg-white/[0.06] text-black/60 dark:text-white/50 rounded-xl py-3 font-bold text-sm hover:bg-black/[0.08] dark:hover:bg-white/[0.09] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              {lang === "ar" ? "مشاركة" : "Share"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl py-3 font-bold text-sm hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
              data-testid="button-close-news-modal"
            >
              {lang === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function News() {
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const { lang, dir } = useI18n();

  useSEO({
    title: lang === "ar"
      ? "أخبار كيروكس استوديو آخر المستجدات والتحديثات"
      : "Qirox Studio News Latest Updates & Announcements",
    description: lang === "ar"
      ? "تابع آخر أخبار كيروكس استوديو: إطلاقات جديدة، تحديثات الأنظمة، مشاريع العملاء، وأحدث المستجدات من مصنع الأنظمة الرقمية في الرياض."
      : "Follow the latest Qirox Studio news: new launches, system updates, client projects, and the latest from the digital systems factory in Riyadh.",
    keywords: "أخبار كيروكس, مستجدات كيروكس استوديو, Qirox news, تحديثات كيروكس, أخبار برمجة السعودية, مشاريع جديدة كيروكس, Qirox Studio updates, شركة برمجة الرياض أخبار",
    canonical: "/news",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": lang === "ar" ? "أخبار كيروكس استوديو" : "Qirox Studio News",
      "url": "https://qiroxstudio.online/news",
      "publisher": {
        "@type": "Organization",
        "name": "Qirox Studio",
        "logo": "https://qiroxstudio.online/qirox-icon.png"
      }
    }
  });

  const { data: news = [], isLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/news"],
    queryFn: async () => {
      const r = await fetch("/api/news");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const labels = {
    badge:    lang === "ar" ? "آخر الأخبار والتحديثات" : "Latest News & Updates",
    title:    lang === "ar" ? "أخبار QIROX"            : "QIROX News",
    subtitle: lang === "ar" ? "ابق على اطلاع بأحدث المستجدات والإطلاقات من فريقنا" : "Stay up to date with the latest updates and launches from our team",
    empty:    lang === "ar" ? "لا توجد أخبار حالياً"   : "No news available",
    emptyMsg: lang === "ar" ? "سيتم نشر التحديثات والأخبار هنا قريباً" : "Updates and news will be published here soon",
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black" dir={dir}>
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0 pointer-events-none opacity-[0.055]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 pt-24 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.05] mb-6">
              <Newspaper className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs font-medium text-white/45">{labels.badge}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{labels.title}</h1>
            <p className="text-white/45 text-lg max-w-xl mx-auto">{labels.subtitle}</p>
          </motion.div>
        </div>
      </section>

      <main className="relative overflow-hidden container mx-auto px-4 pt-16 pb-20">

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
          </div>
        ) : news.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-20 h-20 bg-black/[0.04] dark:bg-white/[0.04] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Newspaper className="w-9 h-9 text-black/20 dark:text-white/20" />
            </div>
            <h3 className="text-lg font-black text-black/40 dark:text-white/40 mb-2">{labels.empty}</h3>
            <p className="text-sm text-black/25 dark:text-white/25">{labels.emptyMsg}</p>
          </motion.div>
        ) : (() => {
          const categories = ["all", ...Array.from(new Set(news.map(n => n.category).filter(Boolean)))];
          const filtered = activeCategory === "all" ? news : news.filter(n => n.category === activeCategory);
          const visible = filtered.slice(0, visibleCount);
          return (
            <>
              {categories.length > 1 && (
                <div className="flex gap-2 flex-wrap justify-center mb-10" dir="rtl">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        activeCategory === cat
                          ? "bg-black dark:bg-white text-white dark:text-black border-transparent"
                          : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/40 hover:border-black/25 dark:hover:border-white/25"
                      }`}
                    >
                      {cat === "all" ? (lang === "ar" ? "الكل" : "All") : cat}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visible.map((item, i) => (
                  <NewsCard key={item.id} item={item} index={i} onClick={() => setSelected(item)} lang={lang} />
                ))}
              </div>
              {filtered.length > visibleCount && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setVisibleCount(v => v + 9)}
                    className="px-8 py-3 rounded-2xl border border-black/[0.10] dark:border-white/[0.10] text-sm font-bold text-black/60 dark:text-white/60 hover:border-black/20 dark:hover:border-white/20 hover:text-black dark:hover:text-white transition-all"
                  >
                    {lang === "ar" ? "تحميل المزيد" : "Load More"} ({filtered.length - visibleCount})
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </main>

      {selected && <NewsModal item={selected} onClose={() => setSelected(null)} lang={lang} />}

      <Footer />
    </div>
  );
}
