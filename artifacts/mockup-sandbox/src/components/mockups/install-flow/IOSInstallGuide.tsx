import { useState } from "react";

export default function IOSInstallGuide() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [step, setStep] = useState(0);
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";

  const T = {
    title: ar ? "إضافة كيروكس لشاشة iPhone" : "Add Qirox to iPhone Screen",
    subtitle: ar ? "خطوات بسيطة لتثبيت التطبيق" : "Simple steps to install the app",
    step1Title: ar ? "اضغط زر المشاركة" : "Tap the Share button",
    step1Sub: ar ? "الزر الموجود في شريط Safari السفلي" : "Located in the Safari bottom toolbar",
    step2Title: ar ? "مرّر للأسفل" : "Scroll Down",
    step2Sub: ar ? "في قائمة الخيارات المنبثقة" : "In the share sheet menu",
    step3Title: ar ? "اضغط «إضافة إلى الشاشة الرئيسية»" : `Tap "Add to Home Screen"`,
    step3Sub: ar ? "ثم اضغط «إضافة» للتأكيد" : `Then tap "Add" to confirm`,
    stepLabel: ar ? "خطوة" : "Step",
    ofLabel: ar ? "من" : "of",
    done: ar ? "تم! ابحث عن كيروكس على شاشتك 🎉" : "Done! Find Qirox on your home screen 🎉",
    next: ar ? "التالي ←" : "Next →",
    prev: ar ? "→ السابق" : "← Back",
    restart: ar ? "إعادة العرض" : "Restart",
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
          <div className="absolute inset-[2px] rounded-[48px] bg-white overflow-hidden" dir={dir}>

            {/* Status bar */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1 bg-white">
              <span className="text-[11px] font-bold text-black">9:41</span>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-[34px] bg-black rounded-b-[20px]" />
              <div className="flex items-center gap-1.5">
                <svg width="16" height="12" viewBox="0 0 16 12"><path d="M0 4.5C2.67 2 5.33 0.75 8 0.75s5.33 1.25 8 3.75" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M2.5 7C4.17 5.33 6 4.5 8 4.5s3.83.83 5.5 2.5" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="8" cy="10.5" r="1.5" fill="#000"/></svg>
                <svg width="14" height="12" viewBox="0 0 14 12"><rect x="0.5" y="2.5" width="11" height="8" rx="1.5" stroke="#000" strokeWidth="1.5" fill="none"/><path d="M12 5.5h1a.5.5 0 010 1h-1" stroke="#000" strokeWidth="1.5" fill="none"/><rect x="2.5" y="4.5" width="6.5" height="4" rx="0.5" fill="#000"/></svg>
              </div>
            </div>

            {/* Safari browser mockup */}
            <div className="flex flex-col h-full bg-[#f2f2f7]">
              {/* Safari address bar */}
              <div className="bg-[#f2f2f7] px-3 py-2">
                <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 border border-black/[0.08] shadow-sm">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span className="text-[11px] text-black/60 flex-1 text-center font-medium">qirox.online</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="5" r="3"/><circle cx="12" cy="19" r="3"/></svg>
                </div>
              </div>

              {/* Website content */}
              <div className="flex-1 bg-black mx-0 rounded-none overflow-hidden relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-[#c9a84c] flex items-center justify-center">
                    <span className="text-black font-black text-2xl">Q</span>
                  </div>
                  <span className="text-white font-black text-xl">QIROX</span>
                  <span className="text-white/40 text-[10px]">{ar ? "مصنع الأنظمة الرقمية" : "Digital Systems Factory"}</span>
                </div>

                {/* Overlay instruction - changes per step */}
                {step < 3 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col">
                    {/* Step indicator */}
                    <div className="flex-1 flex flex-col items-center justify-center px-6">
                      <div className="bg-white/10 backdrop-blur rounded-3xl p-5 w-full border border-white/10">
                        {/* Step number */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-full bg-[#c9a84c] flex items-center justify-center shrink-0">
                            <span className="text-black font-black text-xs">{step + 1}</span>
                          </div>
                          <span className="text-white/50 text-[10px]">{T.stepLabel} {step + 1} {T.ofLabel} 3</span>
                        </div>

                        {/* Visual for each step */}
                        {step === 0 && (
                          <div className="flex flex-col items-center mb-4">
                            {/* iOS share button illustration */}
                            <div className="relative">
                              <div className="w-14 h-14 rounded-2xl bg-[#007AFF] flex items-center justify-center shadow-xl mb-2">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                  <polyline points="16 6 12 2 8 6"/>
                                  <line x1="12" y1="2" x2="12" y2="15"/>
                                </svg>
                              </div>
                              {/* Pulse ring */}
                              <div className="absolute inset-0 rounded-2xl border-2 border-[#c9a84c] animate-ping opacity-60" />
                            </div>
                            <div className="flex gap-2 mt-2 opacity-60">
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="w-5 h-5 rounded bg-white/20" />
                                <span className="text-white/50 text-[8px]">⬅</span>
                              </div>
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="w-7 h-7 rounded-xl bg-[#007AFF] flex items-center justify-center">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                                </div>
                                <span className="text-[#c9a84c] text-[8px] font-bold">◀ {ar ? "هنا" : "here"}</span>
                              </div>
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="w-5 h-5 rounded bg-white/20" />
                                <span className="text-white/50 text-[8px]">⬅</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {step === 1 && (
                          <div className="flex flex-col items-center mb-4">
                            {/* Scroll illustration */}
                            <div className="w-28 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                              {["AirDrop", "Messages", "Mail", ar ? "إضافة لـ Reminders" : "Add to Reminders", ar ? "إضافة إلى الشاشة الرئيسية ←" : "Add to Home Screen ←", ar ? "إنشاء PDF" : "Create PDF"].map((item, i) => (
                                <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 border-b border-white/5 ${i === 4 ? "bg-[#c9a84c]/20 border-[#c9a84c]/30" : ""}`}>
                                  <div className={`w-5 h-5 rounded-lg ${i === 4 ? "bg-[#c9a84c]" : "bg-white/20"} flex-shrink-0`} />
                                  <span className={`text-[8px] ${i === 4 ? "text-[#c9a84c] font-bold" : "text-white/50"}`}>{item}</span>
                                </div>
                              ))}
                            </div>
                            {/* Scroll arrow */}
                            <div className="flex flex-col items-center mt-2 gap-0.5">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5" className="animate-bounce"><polyline points="6 9 12 15 18 9"/></svg>
                              <span className="text-[#c9a84c] text-[9px] font-bold">{ar ? "مرر للأسفل" : "Scroll down"}</span>
                            </div>
                          </div>
                        )}

                        {step === 2 && (
                          <div className="flex flex-col items-center mb-4">
                            {/* Add to Home Screen button */}
                            <div className="bg-white/10 rounded-2xl border border-[#c9a84c]/50 p-3 flex items-center gap-3 w-full mb-2">
                              <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/20 border border-[#c9a84c]/30 flex items-center justify-center shrink-0">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                              </div>
                              <div>
                                <p className="text-white text-[10px] font-bold">{ar ? "إضافة إلى الشاشة الرئيسية" : "Add to Home Screen"}</p>
                                <p className="text-white/40 text-[9px]">qirox.online</p>
                              </div>
                              {/* Tap indicator */}
                              <div className="mr-auto w-5 h-5 rounded-full border-2 border-[#c9a84c] flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse" />
                              </div>
                            </div>
                            {/* Then Add button */}
                            <div className="flex items-center gap-2">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white/50" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                              <span className="text-white/50 text-[9px]">{ar ? "ثم اضغط «إضافة»" : `Then tap "Add"`}</span>
                            </div>
                          </div>
                        )}

                        <p className="text-white font-bold text-sm mb-0.5">{[T.step1Title, T.step2Title, T.step3Title][step]}</p>
                        <p className="text-white/50 text-[10px]">{[T.step1Sub, T.step2Sub, T.step3Sub][step]}</p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-[#c9a84c] flex items-center justify-center shadow-xl">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p className="text-white font-bold text-sm text-center">{T.done}</p>
                  </div>
                )}
              </div>

              {/* Safari bottom toolbar */}
              <div className="bg-[#f2f2f7] border-t border-black/[0.08]">
                {/* Navigation buttons */}
                <div className="flex items-center justify-around px-4 py-2">
                  <button className="p-2 opacity-30">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button className="p-2 opacity-30">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  {/* Share button — highlighted on step 0 */}
                  <button className={`p-2 relative ${step === 0 ? "scale-125" : ""} transition-transform`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={step === 0 ? "#007AFF" : "#000"} strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    {step === 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#c9a84c] rounded-full animate-ping" />}
                  </button>
                  <button className="p-2 opacity-30">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                  </button>
                  <button className="p-2 opacity-30">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  </button>
                </div>
                {/* Home indicator */}
                <div className="flex justify-center pb-2">
                  <div className="w-28 h-1 bg-black/25 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step navigation controls */}
        <div className="absolute -bottom-16 left-0 right-0">
          <div className="flex items-center justify-center gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="px-3 py-1.5 rounded-xl bg-black/10 text-black/60 text-xs font-bold">
                {T.prev}
              </button>
            )}
            {/* Dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className={`rounded-full transition-all ${step === i ? "w-4 h-2 bg-black" : "w-2 h-2 bg-black/20"}`} />
              ))}
            </div>
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold">
                {step === 2 ? (ar ? "تم ✓" : "Done ✓") : T.next}
              </button>
            ) : (
              <button onClick={() => setStep(0)}
                className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold">
                {T.restart}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
