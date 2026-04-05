import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const [, navigate] = useLocation();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 overflow-hidden"
      dir={dir}
      style={{ background: "linear-gradient(160deg, #f8faff 0%, #f0f4ff 50%, #f8faff 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-100/60 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative text-center max-w-md mx-auto"
      >
        {/* 404 badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 border border-violet-200"
        >
          <Search className="w-3 h-3" />
          {L ? "الصفحة غير موجودة" : "Page Not Found"}
        </motion.div>

        {/* Big 404 */}
        <div className="relative mb-6">
          <p className="text-[9rem] font-black leading-none select-none"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
            404
          </p>
          <div className="absolute inset-0 blur-3xl opacity-20"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7, #3b82f6)" }} />
        </div>

        <h1 className="text-xl font-black text-gray-900 mb-3">
          {L ? "عذراً، لم نجد هذه الصفحة!" : "Oops! This page doesn't exist."}
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          {L
            ? "الرابط الذي طلبته غير موجود أو ربما تم نقله أو حذفه."
            : "The page you're looking for doesn't exist or may have been moved."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-7 py-3 rounded-2xl font-bold text-sm text-white shadow-lg shadow-violet-500/25 transition-all"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            data-testid="button-go-home"
          >
            <Home className="w-4 h-4" />
            {L ? "العودة للرئيسية" : "Go Home"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
            data-testid="button-go-back"
          >
            <ArrowLeft className="w-4 h-4" />
            {L ? "الصفحة السابقة" : "Go Back"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
