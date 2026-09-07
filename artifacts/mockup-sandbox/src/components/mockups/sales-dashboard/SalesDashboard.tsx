import { useState } from "react";
import {
  MapPin, Phone, Building2, Search, Plus, CheckCircle2, XCircle,
  MessageCircle, Star, TrendingUp, Users, Target, Award,
  ChevronDown, Filter, MoreHorizontal, Flame, Clock,
  BarChart3, Zap, Globe, Coffee, ShoppingBag, Utensils,
  Briefcase, Heart, BookOpen, Wifi, Car, Home
} from "lucide-react";

const SECTOR_ICONS: Record<string, any> = {
  مطعم: Utensils, متجر: ShoppingBag, مقهى: Coffee, عيادة: Heart,
  صالون: Star, تعليم: BookOpen, تقنية: Wifi, سيارات: Car,
  عقارات: Home, أعمال: Briefcase, عام: Globe,
};

const STATUSES = [
  { key: "new", label: "جديد", color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  { key: "contacted", label: "تم التواصل", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  { key: "subscribed", label: "تم الاشتراك", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  { key: "not_interested", label: "لا يريد", color: "bg-red-100 text-red-600", dot: "bg-red-400" },
];

const INITIAL_LEADS = [
  { id: 1, name: "مطعم الأصيل", phone: "0501234567", sector: "مطعم", city: "الرياض", district: "العليا", rating: 4.5, reviews: 312, status: "subscribed", note: "متحمس جداً للنظام", mapUrl: "https://maps.google.com" },
  { id: 2, name: "متجر الأناقة", phone: "0559876543", sector: "متجر", city: "جدة", district: "الحمراء", rating: 4.2, reviews: 187, status: "contacted", note: "يطلب عرض السعر", mapUrl: "" },
  { id: 3, name: "مقهى السكينة", phone: "0534567890", sector: "مقهى", city: "الرياض", district: "النزهة", rating: 4.8, reviews: 520, status: "new", note: "", mapUrl: "" },
  { id: 4, name: "عيادة الشفاء", phone: "0512345678", sector: "عيادة", city: "الدمام", district: "الفيصلية", rating: 4.6, reviews: 94, status: "not_interested", note: "لديهم نظام قديم يريدون الإبقاء عليه", mapUrl: "" },
  { id: 5, name: "صالون لمسة", phone: "0523456789", sector: "صالون", city: "الرياض", district: "الملقا", rating: 4.3, reviews: 230, status: "contacted", note: "موعد غداً الساعة 10", mapUrl: "" },
  { id: 6, name: "كافيه بلوم", phone: "0567891234", sector: "مقهى", city: "جدة", district: "الروضة", rating: 4.7, reviews: 401, status: "subscribed", note: "وقّع العقد اليوم ✅", mapUrl: "" },
  { id: 7, name: "مجمع التقنية", phone: "0598765432", sector: "تقنية", city: "الرياض", district: "طويق", rating: 3.9, reviews: 58, status: "new", note: "", mapUrl: "" },
  { id: 8, name: "مركز سيارات الخليج", phone: "0543219876", sector: "سيارات", city: "الدمام", district: "العزيزية", rating: 4.1, reviews: 143, status: "new", note: "", mapUrl: "" },
];

const STATS = [
  { label: "إجمالي العملاء", value: 128, icon: Users, color: "from-violet-600 to-purple-700", light: "bg-violet-50", textColor: "text-violet-700" },
  { label: "تم التواصل", value: 47, icon: MessageCircle, color: "from-blue-500 to-cyan-600", light: "bg-blue-50", textColor: "text-blue-700" },
  { label: "مشتركون", value: 23, icon: CheckCircle2, color: "from-emerald-500 to-teal-600", light: "bg-emerald-50", textColor: "text-emerald-700" },
  { label: "نسبة التحويل", value: "18%", icon: Target, color: "from-orange-500 to-amber-500", light: "bg-orange-50", textColor: "text-orange-700" },
];

function getStatusObj(key: string) {
  return STATUSES.find(s => s.key === key) || STATUSES[0];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 mr-1">{rating}</span>
    </div>
  );
}

function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (l: any) => void }) {
  const [form, setForm] = useState({ name: "", phone: "", sector: "مطعم", city: "", district: "", note: "" });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-black text-gray-900 mb-5">إضافة عميل محتمل جديد</h3>
        <div className="space-y-3">
          {[
            { key: "name", label: "اسم المنشأة", placeholder: "مثال: مطعم الوفاء" },
            { key: "phone", label: "رقم الهاتف", placeholder: "05xxxxxxxx" },
            { key: "city", label: "المدينة", placeholder: "الرياض" },
            { key: "district", label: "الحي", placeholder: "العليا" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold text-gray-500 mb-1 block">{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition" />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">القطاع</label>
            <select value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))}
              className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm outline-none focus:border-violet-400 bg-white">
              {Object.keys(SECTOR_ICONS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">ملاحظة</label>
            <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="أي ملاحظات عن العميل..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400 resize-none" rows={2} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition">إلغاء</button>
          <button onClick={() => { if (form.name && form.phone) { onAdd({ ...form, id: Date.now(), rating: 4.0, reviews: 0, status: "new" }); onClose(); }}}
            className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl text-sm font-bold text-white hover:opacity-90 transition shadow-lg shadow-violet-200">
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}

function LeadCard({ lead, onStatusChange }: { lead: any; onStatusChange: (id: number, s: string) => void }) {
  const [open, setOpen] = useState(false);
  const status = getStatusObj(lead.status);
  const SectorIcon = SECTOR_ICONS[lead.sector] || Globe;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-violet-100 transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shrink-0">
          <SectorIcon className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-gray-900 text-sm truncate">{lead.name}</h4>
            <div className="relative shrink-0">
              <button onClick={() => setOpen(o => !o)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
                <ChevronDown className="w-3 h-3" />
              </button>
              {open && (
                <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 min-w-[140px]">
                  {STATUSES.map(s => (
                    <button key={s.key} onClick={() => { onStatusChange(lead.id, s.key); setOpen(false); }}
                      className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-gray-50 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
            <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.city}، {lead.district}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <StarRating rating={lead.rating} />
            <span className="text-xs text-gray-400">{lead.reviews} تقييم</span>
          </div>
          {lead.note && (
            <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">{lead.note}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SalesDashboard() {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSector, setFilterSector] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"leads"|"map">("leads");
  const [mapSearch, setMapSearch] = useState("");
  const [mapCity, setMapCity] = useState("الرياض");
  const [mapSector, setMapSector] = useState("مطعم");
  const [mapResults, setMapResults] = useState<any[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  const filtered = leads.filter(l => {
    const matchSearch = !search || l.name.includes(search) || l.phone.includes(search);
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    const matchSector = filterSector === "all" || l.sector === filterSector;
    return matchSearch && matchStatus && matchSector;
  });

  const stats = [
    { label: "إجمالي العملاء", value: leads.length, icon: Users, grad: "from-violet-600 to-purple-700", bg: "bg-violet-50", fg: "text-violet-700" },
    { label: "تم التواصل", value: leads.filter(l => l.status === "contacted").length, icon: MessageCircle, grad: "from-blue-500 to-cyan-600", bg: "bg-blue-50", fg: "text-blue-700" },
    { label: "مشتركون", value: leads.filter(l => l.status === "subscribed").length, icon: CheckCircle2, grad: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", fg: "text-emerald-700" },
    { label: "نسبة التحويل", value: leads.length ? Math.round(leads.filter(l => l.status==="subscribed").length / leads.length * 100) + "%" : "0%", icon: Target, grad: "from-orange-500 to-amber-500", bg: "bg-orange-50", fg: "text-orange-700" },
  ];

  const simulateMapSearch = () => {
    setMapLoading(true);
    setTimeout(() => {
      const results = [
        { name: `${mapSector} ${mapCity} الأول`, phone: "0501234001", rating: 4.3, reviews: 211, district: "العليا", sector: mapSector },
        { name: `${mapSector} الذهبي`, phone: "0501234002", rating: 4.7, reviews: 435, district: "النزهة", sector: mapSector },
        { name: `${mapSector} الفاخر`, phone: "0501234003", rating: 4.1, reviews: 98, district: "الورود", sector: mapSector },
        { name: `${mapSector} الأصيل`, phone: "0501234004", rating: 4.5, reviews: 317, district: "السليمانية", sector: mapSector },
        { name: `${mapSector} الخليج`, phone: "0501234005", rating: 3.9, reviews: 72, district: "الملقا", sector: mapSector },
        { name: `${mapSector} الراقي`, phone: "0501234006", rating: 4.6, reviews: 289, district: "الروضة", sector: mapSector },
      ];
      setMapResults(results);
      setMapLoading(false);
    }, 1200);
  };

  const addFromMap = (r: any) => {
    setLeads(prev => [...prev, { ...r, id: Date.now(), city: mapCity, note: "", status: "new" }]);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Tajawal'] text-right" dir="rtl"
      style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>

      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium leading-none">لوحة تحكم</p>
            <h1 className="text-base font-black text-gray-900 leading-tight">مستشار المبيعات</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-violet-700">نشط الآن</span>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition shadow-md shadow-violet-200">
            <Plus className="w-4 h-4" /> إضافة عميل
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white border border-gray-100 rounded-2xl p-1 w-fit shadow-sm">
          {[{ key: "leads", label: "العملاء المحتملون", icon: Users }, { key: "map", label: "بحث الخرائط", icon: MapPin }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === t.key ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "leads" && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو الرقم..."
                  className="w-full h-9 border border-gray-200 rounded-xl pr-9 pl-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm outline-none focus:border-violet-400 bg-white text-gray-600">
                <option value="all">كل الحالات</option>
                {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm outline-none focus:border-violet-400 bg-white text-gray-600">
                <option value="all">كل القطاعات</option>
                {Object.keys(SECTOR_ICONS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-xs text-gray-400 font-medium">{filtered.length} نتيجة</span>
            </div>

            {/* Leads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(lead => (
                <LeadCard key={lead.id} lead={lead}
                  onStatusChange={(id, s) => setLeads(prev => prev.map(l => l.id === id ? { ...l, status: s } : l))} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-3 py-16 text-center text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد نتائج</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "map" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-violet-600" />
              استخراج بيانات المنشآت من الخرائط
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">القطاع</label>
                <select value={mapSector} onChange={e => setMapSector(e.target.value)}
                  className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm outline-none focus:border-violet-400 bg-white">
                  {Object.keys(SECTOR_ICONS).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">المدينة</label>
                <select value={mapCity} onChange={e => setMapCity(e.target.value)}
                  className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm outline-none focus:border-violet-400 bg-white">
                  {["الرياض","جدة","الدمام","مكة المكرمة","المدينة المنورة","الخبر","تبوك","أبها"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={simulateMapSearch} disabled={mapLoading}
                  className="w-full h-10 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
                  {mapLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جاري البحث...</> : <><Search className="w-4 h-4" />بحث في الخرائط</>}
                </button>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 mb-4 bg-gradient-to-br from-violet-50 to-indigo-50 h-48 flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 2px 2px, rgba(139,92,246,0.6) 1px, transparent 0)", backgroundSize:"28px 28px"}} />
              <div className="text-center">
                <MapPin className="w-10 h-10 text-violet-400 mx-auto mb-2" />
                <p className="text-sm text-violet-600 font-bold">خريطة المنطقة</p>
                <p className="text-xs text-violet-400 mt-1">{mapCity} — {mapResults.length} منشأة</p>
              </div>
            </div>

            {mapResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mapResults.map((r, i) => {
                  const SectorIcon = SECTOR_ICONS[r.sector] || Globe;
                  const alreadyAdded = leads.some(l => l.phone === r.phone);
                  return (
                    <div key={i} className="border border-gray-100 rounded-xl p-3 flex items-center gap-3 hover:border-violet-200 hover:bg-violet-50/30 transition">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <SectorIcon className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate">{r.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating rating={r.rating} />
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">{r.district}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{r.phone}</p>
                      </div>
                      <button onClick={() => !alreadyAdded && addFromMap(r)} disabled={alreadyAdded}
                        className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition ${alreadyAdded ? "bg-emerald-50 text-emerald-600 cursor-default" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
                        {alreadyAdded ? "مضاف ✓" : "إضافة"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {!mapLoading && mapResults.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">اضغط "بحث في الخرائط" لاستخراج بيانات المنشآت</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onAdd={l => setLeads(prev => [...prev, l])} />}
    </div>
  );
}
