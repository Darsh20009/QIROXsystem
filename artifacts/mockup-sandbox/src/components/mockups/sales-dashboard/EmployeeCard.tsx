import { Phone, MapPin, Star, Award, TrendingUp, CheckCircle2, QrCode, Zap, Shield } from "lucide-react";

export function EmployeeCard() {
  const employee = {
    name: "أحمد بن محمد القحطاني",
    role: "مستشار مبيعات أول",
    id: "QRX-SC-2024-0042",
    phone: "0501234567",
    region: "منطقة الرياض",
    joined: "مارس 2024",
    level: "بلاتيني",
    leads: 128,
    subscribed: 23,
    rating: 4.8,
    avatar: "أق",
  };

  const levelColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    بلاتيني: { bg: "from-slate-700 to-slate-900", text: "text-slate-100", border: "border-slate-600", badge: "bg-gradient-to-r from-slate-300 to-white text-slate-800" },
    ذهبي: { bg: "from-amber-600 to-yellow-700", text: "text-amber-100", border: "border-amber-500", badge: "bg-gradient-to-r from-amber-300 to-yellow-200 text-amber-900" },
    فضي: { bg: "from-gray-500 to-gray-700", text: "text-gray-100", border: "border-gray-400", badge: "bg-gradient-to-r from-gray-300 to-gray-100 text-gray-800" },
  };

  const lc = levelColors[employee.level];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center p-6 font-['Tajawal']"
      dir="rtl" style={{ fontFamily: "'Tajawal','Cairo',sans-serif" }}>
      <div className="w-[380px] select-none">
        {/* Main Card */}
        <div className={`rounded-3xl bg-gradient-to-br ${lc.bg} shadow-2xl overflow-hidden relative`}>

          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "radial-gradient(circle at 3px 3px,white 1px,transparent 0)", backgroundSize: "22px 22px" }} />

          {/* Top strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-400 opacity-80" />

          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white/70 text-xs font-bold tracking-widest uppercase">Qirox</span>
              </div>
              <p className={`text-[10px] font-bold tracking-widest ${lc.text} opacity-50 uppercase`}>
                بطاقة الموظف الرسمية
              </p>
            </div>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${lc.badge} shadow-sm`}>
              ★ {employee.level}
            </span>
          </div>

          {/* Avatar + Info */}
          <div className="relative px-6 pb-5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center shadow-inner">
                  <span className="text-2xl font-black text-white">{employee.avatar}</span>
                </div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-slate-800 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Name + Role */}
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-black text-lg leading-tight">{employee.name}</h2>
                <p className="text-white/60 text-xs font-medium mt-0.5">{employee.role}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3 h-3 text-white/50" />
                  <span className="text-xs text-white/60">{employee.region}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mx-4 mb-4 bg-white/10 rounded-2xl px-5 py-4 border border-white/10 backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "العملاء", value: employee.leads, icon: "👥" },
                { label: "مشتركون", value: employee.subscribed, icon: "✅" },
                { label: "التقييم", value: employee.rating, icon: "⭐" },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="text-[10px] text-white/50 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info strips */}
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2.5 border border-white/10">
              <Phone className="w-3.5 h-3.5 text-white/50 shrink-0" />
              <span className="text-xs text-white/70 font-medium flex-1">رقم التواصل</span>
              <span className="text-xs text-white font-bold font-mono">{employee.phone}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2.5 border border-white/10">
              <Shield className="w-3.5 h-3.5 text-white/50 shrink-0" />
              <span className="text-xs text-white/70 font-medium flex-1">رقم الموظف</span>
              <span className="text-xs text-white font-bold font-mono">{employee.id}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2.5 border border-white/10">
              <TrendingUp className="w-3.5 h-3.5 text-white/50 shrink-0" />
              <span className="text-xs text-white/70 font-medium flex-1">تاريخ الانضمام</span>
              <span className="text-xs text-white font-bold">{employee.joined}</span>
            </div>
          </div>

          {/* Bottom bar with QR */}
          <div className="mx-4 mb-4 flex items-center gap-3 bg-black/20 rounded-2xl px-4 py-3 border border-white/10">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
              <QrCode className="w-8 h-8 text-gray-800" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/50 font-medium">امسح للتحقق من هوية الموظف</p>
              <p className="text-xs text-white/80 font-bold mt-0.5">مُصادق ومُفعّل</p>
            </div>
            <Award className="w-5 h-5 text-amber-300 shrink-0" />
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex items-center justify-between">
            <p className="text-[10px] text-white/30 font-medium">© 2024 Qirox Platform</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/40 font-medium">بطاقة نشطة</span>
            </div>
          </div>
        </div>

        {/* Shadow card underneath */}
        <div className="h-3 mx-4 bg-slate-300/40 rounded-b-3xl blur-sm -mt-1" />
        <div className="h-2 mx-8 bg-slate-300/20 rounded-b-3xl blur-sm -mt-0.5" />
      </div>
    </div>
  );
}
