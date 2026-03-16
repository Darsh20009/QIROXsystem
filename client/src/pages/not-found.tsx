import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const [, navigate] = useLocation();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-6" dir={dir}>
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <p className="text-8xl font-black text-black/10 mb-4">404</p>
          <h1 className="text-2xl font-black text-black mb-3">
            {L ? "الصفحة غير موجودة" : "Page Not Found"}
          </h1>
          <p className="text-black/40 text-sm leading-relaxed">
            {L
              ? "الرابط الذي طلبته غير موجود أو ربما تم نقله."
              : "The page you requested doesn't exist or may have been moved."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-7 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-black/80 transition-colors"
            data-testid="button-go-home"
          >
            {L ? "الرئيسية" : "Home"}
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-7 py-2.5 rounded-xl border border-black/10 text-black/60 text-sm font-bold hover:bg-black/5 hover:text-black transition-colors"
            data-testid="button-go-back"
          >
            {L ? "العودة للخلف" : "Go Back"}
          </button>
        </div>
      </div>
    </div>
  );
}
