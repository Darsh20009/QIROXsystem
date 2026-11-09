import { useState } from "react";

export default function PWAInstallPopup() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [installed, setInstalled] = useState(false);
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";

  const T = {
    title: ar ? "تثبيت نظام كيروكس" : "Install Qirox System",
    subtitle: ar ? "على جهازك مباشرةً — بدون متجر التطبيقات" : "Directly on your device — no app store needed",
    f1: ar ? "وصول سريع من الشاشة الرئيسية" : "Quick access from home screen",
    f2: ar ? "إشعارات فورية لمشروعك" : "Instant project notifications",
    f3: ar ? "يعمل بدون إنترنت جزئياً" : "Works partially offline",
    f4: ar ? "تحديثات تلقائية دائماً" : "Always auto-updated",
    btn: ar ? "تثبيت الآن" : "Install Now",
    later: ar ? "لاحقاً" : "Maybe Later",
    installedTitle: ar ? "تم التثبيت بنجاح! 🎉" : "Installed Successfully! 🎉",
    installedSub: ar ? "ستجد كيروكس على شاشتك الرئيسية" : "Find Qirox on your home screen",
    size: ar ? "الحجم: ٢.١ ميغابايت فقط" : "Size: 2.1 MB only",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6" dir={dir}>
      {/* Lang toggle */}
      <div className="absolute top-4 right-4 flex gap-1 bg-white rounded-full p-1 shadow-sm border border-black/10">
        {(["ar", "en"] as const).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === l ? "bg-black text-white" : "text-black/40"}`}>
            {l === "ar" ? "عربي" : "EN"}
          </button>
        ))}
      </div>

      {/* iPhone frame */}
      <div className="relative" style={{ width: 320, height: 693 }}>
        <div className="absolute inset-0 rounded-[52px] bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl" />
        <div className="absolute left-[-3px] top-[120px] w-[3px] h-[36px] bg-gray-700 rounded-l-full" />
        <div className="absolute left-[-3px] top-[168px] w-[3px] h-[62px] bg-gray-700 rounded-l-full" />
        <div className="absolute left-[-3px] top-[242px] w-[3px] h-[62px] bg-gray-700 rounded-l-full" />
        <div className="absolute right-[-3px] top-[180px] w-[3px] h-[90px] bg-gray-700 rounded-r-full" />
        <div className="absolute inset-[3px] rounded-[50px] bg-black overflow-hidden">
          <div className="absolute inset-[2px] rounded-[48px] bg-gray-900 overflow-hidden flex flex-col" dir={dir}>

            {/* Status bar */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1 bg-gray-900">
              <span className="text-[11px] font-bold text-white">9:41</span>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-[34px] bg-black rounded-b-[20px]" />
              <div className="flex items-center gap-1.5">
                <svg width="16" height="12" viewBox="0 0 16 12"><path d="M0 4.5C2.67 2 5.33 0.75 8 0.75s5.33 1.25 8 3.75" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M2.5 7C4.17 5.33 6 4.5 8 4.5s3.83.83 5.5 2.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="8" cy="10.5" r="1.5" fill="white"/></svg>
                <svg width="14" height="12" viewBox="0 0 14 12"><rect x="0.5" y="2.5" width="11" height="8" rx="1.5" stroke="white" strokeWidth="1.5" fill="none"/><path d="M12 5.5h1a.5.5 0 010 1h-1" stroke="white" strokeWidth="1.5" fill="none"/><rect x="2.5" y="4.5" width="6.5" height="4" rx="0.5" fill="white"/></svg>
              </div>
            </div>

            {/* Blurred background app */}
            <div className="flex-1 relative overflow-hidden">
              {/* Fake blurred app bg */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="text-white font-black text-7xl">Q</div>
              </div>

              {/* Bottom sheet popup */}
              <div className="absolute bottom-0 left-0 right-0">
                {/* Backdrop */}
                <div className="absolute inset-x-0 -top-full h-[200%] bg-black/50 backdrop-blur-sm" />

                <div className="relative bg-white rounded-t-[32px] overflow-hidden shadow-2xl">
                  {/* Handle */}
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-black/15 rounded-full" />
                  </div>

                  {!installed ? (
                    <div className="px-5 pb-6">
                      {/* App identity */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-lg">
                          <span className="text-[#c9a84c] font-black text-2xl">Q</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-black text-base">{T.title}</p>
                          <p className="text-black/40 text-xs leading-tight mt-0.5">{T.subtitle}</p>
                          <p className="text-black/25 text-[10px] mt-1">{T.size}</p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-black/[0.06] mb-4" />

                      {/* Features */}
                      <div className="space-y-3 mb-5">
                        {[T.f1, T.f2, T.f3, T.f4].map((f, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-xl bg-[#c9a84c]/15 flex items-center justify-center shrink-0">
                              {i === 0 && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1"/></svg>}
                              {i === 1 && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
                              {i === 2 && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/></svg>}
                              {i === 3 && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>}
                            </div>
                            <span className="text-xs text-black/70 font-medium">{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Buttons */}
                      <button onClick={() => setInstalled(true)}
                        className="w-full bg-black text-white font-black py-3.5 rounded-2xl text-sm mb-2.5 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {T.btn}
                      </button>
                      <button className="w-full text-black/30 font-medium py-2 text-xs">{T.later}</button>
                    </div>
                  ) : (
                    <div className="px-5 pb-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#c9a84c] flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <p className="font-black text-black text-base mb-1">{T.installedTitle}</p>
                      <p className="text-black/40 text-xs">{T.installedSub}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <p className="text-sm font-bold text-black/60">{ar ? "نافذة تثبيت النظام" : "PWA Install Popup"}</p>
          <p className="text-xs text-black/30">{ar ? "مُصممة بهوية كيروكس" : "Qirox branded"}</p>
        </div>
      </div>
    </div>
  );
}
