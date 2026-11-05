/**
 * StoreViewer — public page at /s/:slug
 * Renders the store in an iframe (for supported templates) or a "Coming Soon" page.
 */
import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ExternalLink, Store, ArrowRight, Loader2, AlertCircle, ShoppingBag } from "lucide-react";

// Template → live URL mapping
const TEMPLATE_URLS: Record<string, string | null> = {
  ecommerce:   "https://e-commerce.qiroxstudio.online",
  restaurant:  null,
  fashion:     null,
  electronics: null,
  beauty:      null,
  grocery:     null,
  pharmacy:    null,
  bookstore:   null,
};

const TEMPLATE_NAMES: Record<string, string> = {
  ecommerce:   "متجر إلكتروني",
  restaurant:  "مطعم وكافيه",
  fashion:     "متجر أزياء",
  electronics: "إلكترونيات",
  beauty:      "تجميل وعناية",
  grocery:     "بقالة وسوبرماركت",
  pharmacy:    "صيدلية",
  bookstore:   "مكتبة",
};

interface StoreData {
  id: string;
  storeNameAr: string;
  storeNameEn: string;
  templateSlug: string;
  subdomain: string;
  customDomain: string;
  description: string;
  logoUrl: string;
  primaryColor: string;
  status: string;
}

export default function StoreViewer() {
  const [, params] = useRoute("/s/:slug");
  const slug = params?.slug || "";

  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/public/stores/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => { setStore(d); setLoading(false); })
      .catch(() => { setError("المتجر غير موجود أو غير نشط"); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-black/20" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-5 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-black/[0.04] flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-black/20" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-black mb-2">المتجر غير موجود</h1>
          <p className="text-black/40 text-sm">تأكد من الرابط أو تواصل مع QIROX Studio</p>
        </div>
        <Link href="/">
          <a className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold">
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </a>
        </Link>
      </div>
    );
  }

  const liveUrl = TEMPLATE_URLS[store.templateSlug];
  const storeName = store.storeNameAr || store.storeNameEn || "المتجر";
  const templateName = TEMPLATE_NAMES[store.templateSlug] || store.templateSlug;

  // ── Has live URL: embed iframe ──────────────────────────────────────────────
  if (liveUrl) {
    return (
      <div className="min-h-screen flex flex-col bg-black" dir="rtl">
        {/* Top bar */}
        <div className="h-10 bg-black flex items-center justify-between px-4 flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
              <ShoppingBag className="w-3 h-3 text-white/60" />
            </div>
            <span className="text-white/70 text-[11px] font-semibold truncate max-w-[160px]">{storeName}</span>
            <span className="text-white/25 text-[10px]">·</span>
            <span className="text-white/30 text-[10px]">{templateName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-white/25 font-mono">{slug}.stores.qiroxstudio.online</span>
            <a href={liveUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white transition-colors">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Iframe */}
        <div className="flex-1 relative">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <Loader2 className="w-8 h-8 animate-spin text-black/20" />
            </div>
          )}
          <iframe
            src={liveUrl}
            className="w-full h-full border-0"
            style={{ minHeight: "calc(100vh - 40px)" }}
            onLoad={() => setIframeLoaded(true)}
            title={storeName}
            allow="payment; camera; microphone"
          />
        </div>
      </div>
    );
  }

  // ── No live URL: Coming Soon page ───────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center" dir="rtl">
      {/* QIROX badge */}
      <Link href="/">
        <a className="flex items-center gap-2 mb-12 opacity-30 hover:opacity-60 transition-opacity">
          <img src="/qirox-icon.png" alt="QIROX" className="w-6 h-6" />
          <span className="text-xs font-black tracking-widest uppercase">QIROX Studio</span>
        </a>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm w-full"
      >
        {/* Store icon */}
        <div className="w-20 h-20 rounded-3xl bg-black flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Store className="w-9 h-9 text-white" />
        </div>

        <h1 className="text-3xl font-black text-black mb-2 leading-tight">
          {storeName}
        </h1>
        {store.description && (
          <p className="text-black/40 text-sm leading-relaxed mb-2">{store.description}</p>
        )}
        <p className="text-black/25 text-xs mb-8 font-mono">{slug}.stores.qiroxstudio.online</p>

        {/* Coming soon badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/[0.04] border border-black/[0.06] mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-bold text-black/50">قريباً — المتجر قيد الإعداد</span>
        </div>

        {/* Template tag */}
        <p className="text-[10px] text-black/20 uppercase tracking-widest">{templateName}</p>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 flex items-center gap-2 text-black/15 text-[10px]">
        <span>مدعوم بواسطة</span>
        <span className="font-black tracking-widest uppercase">QIROX</span>
      </div>
    </div>
  );
}
