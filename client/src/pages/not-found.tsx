import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-6" dir="rtl">
      <div className="text-center max-w-md mx-auto">
        <p className="text-[120px] font-black text-black/[0.06] leading-none select-none mb-2">404</p>

        <div className="mb-8 -mt-4">
          <h1 className="text-2xl font-black text-black mb-3">الصفحة غير موجودة</h1>
          <p className="text-black/40 text-sm leading-relaxed">
            الرابط الذي طلبته غير موجود أو ربما تم نقله.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-7 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-black/80 transition-colors"
            data-testid="button-go-home"
          >
            الرئيسية
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-7 py-2.5 rounded-xl border border-black/10 text-black/60 text-sm font-bold hover:bg-black/5 hover:text-black transition-colors"
            data-testid="button-go-back"
          >
            العودة للخلف
          </button>
        </div>
      </div>
    </div>
  );
}
