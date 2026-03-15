import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Loader2, Newspaper, Calendar, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

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
        <div className="p-7" dir="rtl">
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
          <button
            onClick={onClose}
            className="mt-8 w-full bg-black dark:bg-white text-white dark:text-black rounded-xl py-3 font-bold text-sm hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
            data-testid="button-close-news-modal"
          >
            {lang === "ar" ? "إغلاق" : "Close"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function News() {
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const { lang, dir } = useI18n();

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

      <main className="relative overflow-hidden container mx-auto px-4 pt-28 pb-20">
        <PageGraphics variant="line-top" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-black/[0.05] dark:bg-white/[0.05] rounded-full px-4 py-2 mb-6">
            <Newspaper className="w-4 h-4 text-black/50 dark:text-white/50" />
            <span className="text-sm font-medium text-black/50 dark:text-white/50">{labels.badge}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white mb-4">{labels.title}</h1>
          <p className="text-black/50 dark:text-white/50 text-lg max-w-xl mx-auto">{labels.subtitle}</p>
        </motion.div>

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item, i) => (
              <NewsCard key={item.id} item={item} index={i} onClick={() => setSelected(item)} lang={lang} />
            ))}
          </div>
        )}
      </main>

      {selected && <NewsModal item={selected} onClose={() => setSelected(null)} lang={lang} />}

      <Footer />
    </div>
  );
}
