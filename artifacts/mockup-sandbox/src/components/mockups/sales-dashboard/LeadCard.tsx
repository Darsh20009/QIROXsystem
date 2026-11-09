import { useState } from "react";
import { Phone, MapPin, Star, CheckCircle2, XCircle, MessageCircle, Clock, ChevronDown, MoreHorizontal, Utensils } from "lucide-react";

const STATUSES = [
  { key: "new",           label: "جديد",          color: "bg-slate-100 text-slate-600",   dot: "bg-slate-400",   badge: "bg-slate-50 border-slate-200 text-slate-600" },
  { key: "contacted",     label: "تم التواصل",    color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500",    badge: "bg-blue-50 border-blue-200 text-blue-700" },
  { key: "subscribed",    label: "تم الاشتراك",   color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", badge: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { key: "not_interested",label: "لا يريد",       color: "bg-red-100 text-red-600",      dot: "bg-red-400",     badge: "bg-red-50 border-red-200 text-red-600" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 font-medium mr-1">{rating}</span>
    </div>
  );
}

export function LeadCard() {
  const [status, setStatus] = useState("contacted");
  const [showMenu, setShowMenu] = useState(false);
  const [note, setNote] = useState("يطلب عرض السعر — متحمس للمنصة");

  const st = STATUSES.find(s => s.key === status)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 font-['Tajawal']"
      dir="rtl" style={{ fontFamily: "'Tajawal','Cairo',sans-serif" }}>
      <div className="w-[360px] bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

        {/* Top accent */}
        <div className={`h-1.5 w-full ${status === "subscribed" ? "bg-gradient-to-r from-emerald-400 to-teal-500" : status === "contacted" ? "bg-gradient-to-r from-blue-400 to-cyan-500" : status === "not_interested" ? "bg-gradient-to-r from-red-400 to-rose-500" : "bg-gradient-to-r from-gray-300 to-slate-400"}`} />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                <Utensils className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-base">مطعم الأصيل</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">مطعم / الرياض، العليا</p>
              </div>
            </div>
            <div className="relative">
              <button onClick={() => setShowMenu(o => !o)}
                className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Stars + Info */}
          <div className="flex items-center justify-between mb-4">
            <StarRating rating={4.5} />
            <span className="text-xs text-gray-400 font-medium">312 تقييم على الخريطة</span>
          </div>

          {/* Contact info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-700 font-mono font-medium">0501234567</span>
              <div className="flex-1" />
              <button className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg hover:bg-violet-100 transition">اتصال</button>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-600">الرياض — حي العليا</span>
              <div className="flex-1" />
              <button className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg hover:bg-blue-100 transition">الخريطة</button>
            </div>
          </div>

          {/* Note */}
          <div className="mb-4">
            <textarea value={note} onChange={e => setNote(e.target.value)}
              className="w-full text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 outline-none focus:border-amber-300 resize-none font-medium"
              rows={2} placeholder="ملاحظات عن العميل..." />
          </div>

          {/* Status buttons */}
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">تحديث الحالة</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {STATUSES.filter(s => s.key !== "new").map(s => (
              <button key={s.key} onClick={() => setStatus(s.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${status === s.key ? `${s.badge} border-current shadow-sm scale-[1.02]` : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${status === s.key ? s.dot : "bg-gray-300"}`} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Current status badge */}
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${st.badge}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${st.dot} animate-pulse`} />
            <span className="text-sm font-black">الحالة الحالية: {st.label}</span>
            <div className="flex-1" />
            <Clock className="w-3.5 h-3.5 opacity-60" />
            <span className="text-xs opacity-60">منذ يوم</span>
          </div>
        </div>
      </div>
    </div>
  );
}
