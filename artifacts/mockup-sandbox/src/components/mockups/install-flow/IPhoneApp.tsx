import { useState } from "react";

const AR = {
  installSystem: "تثبيت النظام",
  installIOS: "إضافة لشاشة iPhone",
  home: "الرئيسية",
  projects: "مشاريعي",
  wallet: "محفظتي",
  support: "الدعم",
  welcome: "مرحباً بك في",
  tagline: "مصنع الأنظمة الرقمية",
  activeProject: "مشروعك نشط",
  projectName: "نظام كافيه",
  progress: "٧٢٪ مكتمل",
  nextStep: "الخطوة التالية: مراجعة الواجهة",
  getApp: "احصل على تطبيق كيروكس",
  getAppSub: "تجربة أفضل على جهازك",
};

const EN = {
  installSystem: "Install App",
  installIOS: "Add to iPhone Screen",
  home: "Home",
  projects: "My Projects",
  wallet: "Wallet",
  support: "Support",
  welcome: "Welcome to",
  tagline: "Digital Systems Factory",
  activeProject: "Active Project",
  projectName: "Café System",
  progress: "72% Complete",
  nextStep: "Next: UI Review",
  getApp: "Get Qirox App",
  getAppSub: "Better experience on your device",
};

export default function IPhoneApp() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const t = lang === "ar" ? AR : EN;
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      {/* Lang toggle */}
      <div className="absolute top-4 right-4 flex gap-1 bg-white rounded-full p-1 shadow-sm border border-black/10">
        {(["ar", "en"] as const).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === l ? "bg-black text-white" : "text-black/40"}`}>
            {l === "ar" ? "عربي" : "EN"}
          </button>
        ))}
      </div>

      {/* iPhone 14 Pro frame */}
      <div className="relative" style={{ width: 320, height: 693 }}>
        {/* Outer shell */}
        <div className="absolute inset-0 rounded-[52px] bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl" />
        {/* Side buttons left */}
        <div className="absolute left-[-3px] top-[120px] w-[3px] h-[36px] bg-gray-700 rounded-l-full" />
        <div className="absolute left-[-3px] top-[168px] w-[3px] h-[62px] bg-gray-700 rounded-l-full" />
        <div className="absolute left-[-3px] top-[242px] w-[3px] h-[62px] bg-gray-700 rounded-l-full" />
        {/* Side button right */}
        <div className="absolute right-[-3px] top-[180px] w-[3px] h-[90px] bg-gray-700 rounded-r-full" />
        {/* Inner bezel */}
        <div className="absolute inset-[3px] rounded-[50px] bg-black overflow-hidden">
          {/* Screen */}
          <div className="absolute inset-[2px] rounded-[48px] bg-white overflow-hidden" dir={dir}>
            {/* Status bar */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1 bg-white">
              <span className="text-[11px] font-bold text-black">9:41</span>
              {/* Dynamic Island */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-[34px] bg-black rounded-b-[20px]" />
              <div className="flex items-center gap-1.5">
                <svg width="16" height="12" viewBox="0 0 16 12"><path d="M0 4.5C2.67 2 5.33 0.75 8 0.75s5.33 1.25 8 3.75" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M2.5 7C4.17 5.33 6 4.5 8 4.5s3.83.83 5.5 2.5" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="8" cy="10.5" r="1.5" fill="#000"/></svg>
                <svg width="14" height="12" viewBox="0 0 14 12"><rect x="0.5" y="2.5" width="11" height="8" rx="1.5" stroke="#000" strokeWidth="1.5" fill="none"/><path d="M12 5.5h1a.5.5 0 010 1h-1" stroke="#000" strokeWidth="1.5" fill="none"/><rect x="2.5" y="4.5" width="6.5" height="4" rx="0.5" fill="#000"/></svg>
              </div>
            </div>

            {/* App content */}
            <div className="flex flex-col h-full bg-gray-50">
              {/* Header */}
              <div className="bg-black px-4 pt-2 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#c9a84c] flex items-center justify-center">
                    <span className="text-black font-black text-[10px]">Q</span>
                  </div>
                  <div className={`text-center ${ar ? "" : ""}`}>
                    <p className="text-white/50 text-[10px]">{t.welcome}</p>
                    <p className="text-white font-black text-sm tracking-wide">QIROX</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </div>
                </div>
              </div>

              {/* Active project card */}
              <div className="mx-3 -mt-3 mb-3">
                <div className="bg-gradient-to-br from-[#c9a84c] to-[#a07830] rounded-2xl p-3.5 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-black/60 text-[10px] font-bold">{t.activeProject}</span>
                    <div className="bg-black/20 rounded-full px-2 py-0.5">
                      <span className="text-black/80 text-[9px] font-bold">{t.progress}</span>
                    </div>
                  </div>
                  <p className="text-black font-black text-base mb-1">{t.projectName}</p>
                  <p className="text-black/60 text-[10px]">{t.nextStep}</p>
                  <div className="mt-2 bg-black/20 rounded-full h-1.5">
                    <div className="bg-black/60 h-1.5 rounded-full" style={{ width: "72%" }} />
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-3 gap-2 mx-3 mb-3">
                {[
                  { icon: "📋", label: ar ? "عقودي" : "Contracts" },
                  { icon: "💳", label: ar ? "الفواتير" : "Invoices" },
                  { icon: "🎧", label: ar ? "الدعم" : "Support" },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-2.5 text-center shadow-sm border border-black/[0.05]">
                    <div className="text-lg mb-1">{item.icon}</div>
                    <p className="text-[9px] font-bold text-black/60">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* App install banner */}
              <div className="mx-3 mt-auto mb-3">
                <div className="bg-black rounded-2xl p-3 border border-white/5">
                  <p className="text-white font-bold text-xs mb-0.5">{t.getApp}</p>
                  <p className="text-white/40 text-[9px] mb-3">{t.getAppSub}</p>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-[#c9a84c] text-black font-bold text-[10px] py-2 rounded-xl flex items-center justify-center gap-1.5">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      {t.installSystem}
                    </button>
                    <button className="flex-1 bg-white/10 text-white font-bold text-[9px] py-2 rounded-xl flex items-center justify-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      {t.installIOS}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom tab bar */}
              <div className="bg-white border-t border-black/[0.06] px-2 py-2 pb-5">
                <div className="flex justify-around">
                  {[
                    { icon: "🏠", label: t.home, active: true },
                    { icon: "📁", label: t.projects },
                    { icon: "💰", label: t.wallet },
                    { icon: "🎧", label: t.support },
                  ].map((tab, i) => (
                    <div key={i} className={`flex flex-col items-center gap-0.5 ${tab.active ? "opacity-100" : "opacity-30"}`}>
                      <span className="text-base">{tab.icon}</span>
                      <span className={`text-[8px] font-bold ${tab.active ? "text-[#c9a84c]" : "text-black/40"}`}>{tab.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Label below */}
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <p className="text-sm font-bold text-black/60">{ar ? "تطبيق كيروكس" : "Qirox App"}</p>
          <p className="text-xs text-black/30">{ar ? "الشاشة الرئيسية" : "Home Screen"}</p>
        </div>
      </div>
    </div>
  );
}
