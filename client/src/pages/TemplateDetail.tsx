import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import type { SectorTemplate } from "@shared/schema";
import {
  ArrowRight, Play, Globe, Download, BookOpen,
  Loader2, ChevronLeft, ExternalLink, Package,
  CheckCircle2, Zap, Star, FileText, Video,
  Monitor, Smartphone, Tablet,
  UtensilsCrossed, Users, ShieldCheck, Truck,
  LayoutDashboard, ChefHat, CreditCard, QrCode,
  BarChart3, Calendar, Heart,
  Settings, Lock, User, Coffee,
  MapPin, Bell, ClipboardList, Layers, Copy,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CAFE_SECTIONS } from "./cafe-pages-data";
import type { CafePageEntry } from "./cafe-pages-data";

const TIER_META: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  lite:     { label: "لايت",    color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   desc: "الباقة الأساسية — كل ما تحتاجه للبداية" },
  pro:      { label: "برو",     color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", desc: "الباقة الاحترافية — للمشاريع المتوسطة والكبيرة" },
  infinite: { label: "إنفينيت", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  desc: "الباقة الكاملة — بلا حدود لأكبر المشاريع" },
  custom:   { label: "مخصص",   color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-200",   desc: "باقة مخصصة حسب احتياجك" },
};

function getVideoEmbed(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
  return null;
}

// ── Legacy CafePage type alias for backwards compat ─────────────────────────
type CafePage = CafePageEntry;

interface PortalCredential {
  role: string;
  username: string;
  password: string;
  access: string;
  icon: any;
  color: string;
  bg: string;
}

const CAFE_PORTALS: PortalCredential[] = [
  { role: "عميل التجربة",    username: "512345678",  password: "demo1234",    access: "السلة، الدفع، تتبع الطلبات، بطاقة الولاء",          icon: User,          color: "text-orange-700", bg: "bg-orange-50" },
  { role: "كاشير",           username: "cashier",    password: "cashier123",  access: "الكاشير، الطلبات، الطاولات، الولاء، الحضور",        icon: CreditCard,    color: "text-emerald-700", bg: "bg-emerald-50" },
  { role: "باريستا",         username: "barista",    password: "barista123",  access: "المطبخ، الطلبات، الحضور",                           icon: Coffee,        color: "text-amber-700", bg: "bg-amber-50" },
  { role: "مدير فرع",        username: "manager",    password: "manager123",  access: "لوحة التحكم، المخزون، المحاسبة، الموظفين، التقارير", icon: LayoutDashboard, color: "text-violet-700", bg: "bg-violet-50" },
  { role: "مدير QIROX",      username: "qirox2026",  password: "qirox2026",   access: "نفس صلاحيات المدير",                                icon: Settings,      color: "text-slate-700",  bg: "bg-slate-50" },
  { role: "مسؤول النظام",    username: "qadmin",     password: "admin123",    access: "جميع الصفحات + إعدادات الفروع والنظام",              icon: ShieldCheck,   color: "text-red-700", bg: "bg-red-50" },
];

// ── Theme configs for page mock visuals ──────────────────────────────────
const THEME_STYLES = {
  orange: {
    navBg: "#1c0f00",
    heroBg: "linear-gradient(135deg,#92400e 0%,#d97706 60%,#f59e0b 100%)",
    accentColor: "#f59e0b",
    contentBg: "#fff9f0",
    pillBg: "#fef3c7",
    pillText: "#92400e",
    cardBg: "#fff",
    cardBorder: "#fed7aa",
    shimmer: "#fbbf24",
    gridColors: ["#fde68a","#fed7aa","#fde68a","#fdba74","#fef3c7","#fed7aa"],
  },
  dark: {
    navBg: "#0a0a0a",
    heroBg: "linear-gradient(135deg,#111827 0%,#1f2937 60%,#374151 100%)",
    accentColor: "#6ee7b7",
    contentBg: "#111827",
    pillBg: "#1f2937",
    pillText: "#9ca3af",
    cardBg: "#1f2937",
    cardBorder: "#374151",
    shimmer: "#4b5563",
    gridColors: ["#22c55e","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4"],
  },
  sky: {
    navBg: "#0c1a2e",
    heroBg: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 55%,#0ea5e9 100%)",
    accentColor: "#38bdf8",
    contentBg: "#f0f9ff",
    pillBg: "#e0f2fe",
    pillText: "#0369a1",
    cardBg: "#fff",
    cardBorder: "#bae6fd",
    shimmer: "#7dd3fc",
    gridColors: ["#7dd3fc","#93c5fd","#a5f3fc","#6ee7b7","#bae6fd","#c7d2fe"],
  },
  green: {
    navBg: "#052e16",
    heroBg: "linear-gradient(135deg,#14532d 0%,#15803d 55%,#16a34a 100%)",
    accentColor: "#4ade80",
    contentBg: "#f0fdf4",
    pillBg: "#dcfce7",
    pillText: "#15803d",
    cardBg: "#fff",
    cardBorder: "#bbf7d0",
    shimmer: "#86efac",
    gridColors: ["#86efac","#6ee7b7","#a7f3d0","#bbf7d0","#d1fae5","#a3e635"],
  },
  violet: {
    navBg: "#1a0533",
    heroBg: "linear-gradient(135deg,#3b0764 0%,#6d28d9 55%,#7c3aed 100%)",
    accentColor: "#a78bfa",
    contentBg: "#faf5ff",
    pillBg: "#ede9fe",
    pillText: "#6d28d9",
    cardBg: "#fff",
    cardBorder: "#ddd6fe",
    shimmer: "#c4b5fd",
    gridColors: ["#c4b5fd","#a78bfa","#d8b4fe","#f0abfc","#c084fc","#a78bfa"],
  },
  red: {
    navBg: "#1c0505",
    heroBg: "linear-gradient(135deg,#7f1d1d 0%,#b91c1c 55%,#dc2626 100%)",
    accentColor: "#f87171",
    contentBg: "#fff1f2",
    pillBg: "#fee2e2",
    pillText: "#b91c1c",
    cardBg: "#fff",
    cardBorder: "#fecaca",
    shimmer: "#fca5a5",
    gridColors: ["#fca5a5","#f87171","#fda4af","#fb923c","#fcd34d","#f87171"],
  },
  slate: {
    navBg: "#020617",
    heroBg: "linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#334155 100%)",
    accentColor: "#94a3b8",
    contentBg: "#f8fafc",
    pillBg: "#f1f5f9",
    pillText: "#475569",
    cardBg: "#fff",
    cardBorder: "#e2e8f0",
    shimmer: "#94a3b8",
    gridColors: ["#94a3b8","#cbd5e1","#e2e8f0","#94a3b8","#7dd3fc","#6ee7b7"],
  },
};

// ── Mock UI patterns based on theme ──────────────────────────────────────
function MockPageContent({ theme, icon: Icon, compact }: { theme: string; icon: any; compact: boolean }) {
  const s = THEME_STYLES[theme as keyof typeof THEME_STYLES] || THEME_STYLES.orange;
  const contentH = compact ? 120 : 320;

  if (theme === "dark") {
    // Display/screen pages — order queue style
    return (
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: s.contentBg }}>
        <div className="h-9 flex items-center gap-2 px-4 flex-shrink-0" style={{ background: s.navBg }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.accentColor }} />
          <div className="flex-1 h-2 rounded-full opacity-30" style={{ backgroundColor: s.accentColor }} />
          <div className="w-12 h-4 rounded-md opacity-20" style={{ backgroundColor: s.accentColor }} />
        </div>
        <div className="flex-1 overflow-hidden p-3 space-y-2" style={{ background: s.contentBg }}>
          {[1,2,3,4].map(n => (
            <div key={n} className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: s.cardBg, border: `1px solid ${s.cardBorder}` }}>
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: s.gridColors[(n - 1) % s.gridColors.length] + "40" }}>
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.gridColors[(n - 1) % s.gridColors.length] }} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: s.shimmer + "60" }} />
                <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: s.shimmer + "30" }} />
              </div>
              <div className="w-12 h-5 rounded-full text-[8px] font-bold flex items-center justify-center"
                style={{ backgroundColor: s.gridColors[(n) % s.gridColors.length] + "30", color: s.gridColors[(n) % s.gridColors.length] }}>
                {["قيد", "جاهز", "تم", "جديد"][n - 1]}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (theme === "violet") {
    // Manager dashboard — charts + KPIs
    return (
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: s.contentBg }}>
        <div className="h-9 flex items-center gap-2 px-4 flex-shrink-0" style={{ background: s.navBg }}>
          <div className="w-5 h-5 rounded-md" style={{ background: s.heroBg }} />
          <div className="flex gap-2 mr-auto">
            {[1,2,3].map(n => <div key={n} className="h-1.5 rounded-full" style={{ width: `${28 + n * 8}px`, backgroundColor: s.accentColor + "40" }} />)}
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-3" style={{ background: s.contentBg }}>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {["٥.٢k","٨٩٪","١٢٤"].map((v, i) => (
              <div key={i} className="rounded-lg p-1.5 text-center" style={{ backgroundColor: s.cardBg, border: `1px solid ${s.cardBorder}` }}>
                <div className="font-black text-xs" style={{ color: s.gridColors[i] }}>{v}</div>
                <div className="h-1 rounded-full mt-1" style={{ backgroundColor: s.shimmer + "30" }} />
              </div>
            ))}
          </div>
          {/* Chart bars */}
          <div className="rounded-lg p-2" style={{ backgroundColor: s.cardBg, border: `1px solid ${s.cardBorder}` }}>
            <div className="h-1.5 w-20 rounded-full mb-2" style={{ backgroundColor: s.shimmer + "40" }} />
            <div className="flex items-end gap-1 h-12">
              {[40,65,45,80,55,70,90,60,75,50,85,65].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: s.accentColor + (i % 3 === 0 ? "ff" : "60") }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (theme === "green") {
    // Employee portal — order management table
    return (
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: s.contentBg }}>
        <div className="h-9 flex items-center gap-2 px-4 flex-shrink-0" style={{ background: s.navBg }}>
          <div className="w-4 h-4 rounded" style={{ backgroundColor: s.accentColor + "80" }} />
          <div className="flex-1 h-1.5 rounded-full opacity-20" style={{ backgroundColor: s.accentColor }} />
          <div className="flex gap-1.5">
            {[1,2].map(n => <div key={n} className="h-4 w-10 rounded-md opacity-20" style={{ backgroundColor: s.accentColor }} />)}
          </div>
        </div>
        <div className="flex-1 overflow-hidden" style={{ background: s.contentBg }}>
          <div className="flex gap-1.5 p-2 pb-1">
            {["الكل","جديد","قيد","مكتمل"].map((t, i) => (
              <div key={t} className="px-2 py-0.5 rounded-full text-[8px] font-bold" style={{
                backgroundColor: i === 0 ? s.accentColor : s.pillBg,
                color: i === 0 ? "#fff" : s.pillText,
              }}>{t}</div>
            ))}
          </div>
          <div className="space-y-1 px-2">
            {[1,2,3].map(n => (
              <div key={n} className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: s.cardBg, border: `1px solid ${s.cardBorder}` }}>
                <div className="w-5 h-5 rounded-full font-black text-[9px] flex items-center justify-center" style={{ backgroundColor: s.accentColor + "20", color: s.accentColor }}>#{n}</div>
                <div className="flex-1">
                  <div className="h-1.5 rounded-full w-4/5" style={{ backgroundColor: s.shimmer + "50" }} />
                </div>
                <div className="h-4 w-12 rounded-full" style={{ backgroundColor: s.gridColors[n] + "40" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (theme === "sky") {
    // Driver/delivery — map & route style
    return (
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: s.contentBg }}>
        <div className="h-9 flex items-center gap-2 px-4 flex-shrink-0" style={{ background: s.navBg }}>
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.accentColor + "80" }} />
          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: s.accentColor + "30" }} />
        </div>
        <div className="flex-1 overflow-hidden relative" style={{ background: `linear-gradient(160deg, ${s.pillBg} 60%, #e0f2fe 100%)` }}>
          {/* Map grid */}
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `linear-gradient(${s.cardBorder} 1px, transparent 1px), linear-gradient(90deg, ${s.cardBorder} 1px, transparent 1px)`, backgroundSize: "16px 16px" }} />
          {/* Route line */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 80" preserveAspectRatio="none">
            <polyline points="20,65 35,50 55,40 75,25" stroke={s.accentColor} strokeWidth="1.5" fill="none" strokeDasharray="3,2" opacity="0.7" />
            <circle cx="20" cy="65" r="3" fill={s.shimmer} />
            <circle cx="75" cy="25" r="3" fill={s.accentColor} />
          </svg>
          {/* Info card */}
          <div className="absolute bottom-2 left-2 right-2 rounded-xl p-2" style={{ backgroundColor: s.cardBg, border: `1px solid ${s.cardBorder}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.accentColor + "20" }}>
                <Icon className="w-3 h-3" style={{ color: s.accentColor }} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: s.shimmer + "50" }} />
                <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: s.shimmer + "30" }} />
              </div>
              <div className="w-12 h-5 rounded-lg text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: s.accentColor, color: "#fff" }}>تتبع</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (theme === "red") {
    // Admin — system settings style
    return (
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: s.contentBg }}>
        <div className="h-9 flex items-center gap-2 px-4 flex-shrink-0" style={{ background: s.navBg }}>
          <div className="w-4 h-4 rounded" style={{ backgroundColor: s.accentColor + "60" }} />
          <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: s.accentColor + "40" }} />
          <div className="mr-auto flex gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ef4444" }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex" style={{ background: s.contentBg }}>
          <div className="w-16 h-full flex-shrink-0 py-2 space-y-1 px-2" style={{ backgroundColor: "#1f0808" }}>
            {[1,2,3,4,5].map(n => (
              <div key={n} className="h-6 rounded-md" style={{ backgroundColor: n === 1 ? s.accentColor + "40" : "#ffffff10" }} />
            ))}
          </div>
          <div className="flex-1 p-2 space-y-1.5">
            {[1,2,3].map(n => (
              <div key={n} className="rounded-lg p-2 flex items-center gap-2" style={{ backgroundColor: s.cardBg, border: `1px solid ${s.cardBorder}` }}>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: s.shimmer + "40" }} />
                <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: s.shimmer + "40" }} />
                <div className="w-8 h-4 rounded-md" style={{ backgroundColor: s.gridColors[n] + "30" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (theme === "slate") {
    // Advanced systems — data table style
    return (
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: "#f8fafc" }}>
        <div className="h-9 flex items-center gap-2 px-4 flex-shrink-0" style={{ background: s.navBg }}>
          <div className="flex gap-1.5">
            {["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />)}
          </div>
          <div className="flex-1 mx-2 h-4 rounded-md" style={{ backgroundColor: "#1e293b" }}>
            <div className="h-full w-3/4 rounded-md flex items-center px-2">
              <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: s.accentColor + "40" }} />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-2" style={{ background: s.contentBg }}>
          {/* Table header */}
          <div className="flex gap-1 mb-1 px-2 py-1 rounded-md" style={{ backgroundColor: s.pillBg }}>
            {["الاسم","النوع","الحالة","الإجراء"].map(h => (
              <div key={h} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: s.shimmer + "50" }} />
            ))}
          </div>
          {/* Table rows */}
          {[1,2,3].map(n => (
            <div key={n} className="flex gap-1 items-center px-2 py-1.5 rounded-md mb-1" style={{ backgroundColor: n % 2 === 0 ? s.pillBg : s.cardBg, border: `1px solid ${s.cardBorder}` }}>
              {[1,2,3,4].map(c => (
                <div key={c} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: c === 3 ? s.gridColors[n] + "60" : s.shimmer + "40" }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: orange — cafe customer pages
  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: s.contentBg }}>
      <div className="h-9 flex items-center gap-2 px-4 flex-shrink-0" style={{ background: s.navBg }}>
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: "#b45309" }}>
          <Coffee className="w-3 h-3 text-white" />
        </div>
        <div className="h-1.5 w-16 rounded-full opacity-30 bg-amber-300" />
        <div className="mr-auto flex gap-1.5">
          {[1,2,3].map(n => <div key={n} className="h-1.5 rounded-full opacity-20 bg-amber-300" style={{ width: `${24 + n * 8}px` }} />)}
        </div>
        <div className="w-6 h-6 rounded-full bg-amber-600/60 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-300/80" />
        </div>
      </div>
      {/* Hero */}
      <div className="h-16 flex-shrink-0 relative overflow-hidden" style={{ background: s.heroBg }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "12px 12px" }} />
        <div className="absolute inset-0 flex items-center px-4 gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-2.5 w-32 bg-white/35 rounded-full" />
            <div className="h-1.5 w-24 bg-white/20 rounded-full" />
          </div>
          <div className="h-7 w-16 rounded-xl bg-white/25 flex-shrink-0" />
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 p-2 overflow-hidden" style={{ background: s.contentBg }}>
        <div className="flex gap-1.5 mb-2">
          {["☕","🥐","❄️","🥗"].map(e => (
            <div key={e} className="px-2 py-0.5 rounded-full text-[8px]" style={{ backgroundColor: s.pillBg, color: s.pillText, border: `1px solid ${s.cardBorder}` }}>{e}</div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {s.gridColors.map((c, i) => (
            <div key={i} className="rounded-lg overflow-hidden" style={{ backgroundColor: s.cardBg, border: `1px solid ${s.cardBorder}` }}>
              <div className="h-8" style={{ backgroundColor: c + "40" }} />
              <div className="p-1 space-y-1">
                <div className="h-1.5 rounded-full w-4/5" style={{ backgroundColor: s.shimmer + "50" }} />
                <div className="h-1 rounded-full w-1/2" style={{ backgroundColor: s.shimmer + "30" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Browser Frame ─────────────────────────────────────────────────────────
const CAFE_ORIGIN = "https://cafe.qiroxstudio.online";

function toProxyUrl(url: string): string {
  if (url.startsWith(CAFE_ORIGIN)) {
    const path = url.slice(CAFE_ORIGIN.length) || "/";
    return `/cafe-proxy${path}`;
  }
  return url;
}

function BrowserFrame({ url, label, page, compact = false }: { url: string; label: string; page?: CafePage; compact?: boolean }) {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = (page as any)?.theme || "orange";
  const s = THEME_STYLES[theme as keyof typeof THEME_STYLES] || THEME_STYLES.orange;
  const previewHeight = compact ? 210 : 460;
  const proxyUrl = toProxyUrl(url);

  // Compact: render iframe at 1280×900 then scale down to fit container
  const IFRAME_W = 1280;
  const IFRAME_H = 900;
  const compactScale = 0.27; // 1280*0.27≈346px wide, 900*0.27≈243px tall

  // Non-compact viewport widths
  const vpWidth = !compact && viewport !== "desktop"
    ? (viewport === "tablet" ? 768 : 390)
    : null;

  // Start blocked-detection timer when url changes
  useEffect(() => {
    setLoaded(false);
    setBlocked(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setBlocked(true), 6000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [url]);

  function handleIframeLoad() {
    setLoaded(true);
    setBlocked(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border border-white/[0.06]" style={{ background: s.navBg }}>
      {/* Browser chrome */}
      <div className="px-3 py-2.5 flex items-center gap-2.5" style={{ background: s.navBg }}>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 rounded-md px-2.5 py-1 flex items-center gap-1.5 min-w-0" style={{ backgroundColor: "#ffffff12" }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.accentColor }} />
          <span className="text-white/40 text-[10px] font-mono truncate" dir="ltr">{url}</span>
        </div>
        {!compact && (
          <div className="flex items-center gap-0.5 rounded-md p-0.5" style={{ backgroundColor: "#ffffff10" }}>
            {(["desktop", "tablet", "mobile"] as const).map(v => (
              <button key={v} onClick={() => setViewport(v)}
                className="p-1 rounded transition-colors"
                style={{ backgroundColor: viewport === v ? "#ffffff20" : "transparent" }}>
                {v === "desktop" && <Monitor className="w-3 h-3 text-white/50" />}
                {v === "tablet" && <Tablet className="w-3 h-3 text-white/50" />}
                {v === "mobile" && <Smartphone className="w-3 h-3 text-white/50" />}
              </button>
            ))}
          </div>
        )}
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 opacity-30 hover:opacity-70 transition-opacity">
          <ExternalLink className="w-3 h-3 text-white" />
        </a>
      </div>

      {/* Preview area */}
      <div className="relative overflow-hidden flex justify-center" style={{ height: `${previewHeight}px`, background: s.contentBg }}>

        {/* Loading spinner */}
        {!loaded && !blocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2" style={{ background: s.contentBg }}>
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
            <span className="text-white/30 text-[10px]">جار التحميل...</span>
          </div>
        )}

        {/* Blocked fallback */}
        {blocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3" style={{ background: s.contentBg }}>
            <Globe className="w-8 h-8 text-white/20" />
            <p className="text-white/40 text-xs text-center px-4">لا يمكن تضمين الصفحة هنا</p>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-[11px] shadow-lg"
              style={{ backgroundColor: s.accentColor, color: "#000" }}>
              <ExternalLink className="w-3 h-3" />
              فتح في تبويب جديد
            </a>
          </div>
        )}

        {/* Compact iframe — scaled down */}
        {compact && (
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              key={proxyUrl}
              src={proxyUrl}
              title={label}
              onLoad={handleIframeLoad}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${IFRAME_W}px`,
                height: `${IFRAME_H}px`,
                transform: `scale(${compactScale})`,
                transformOrigin: "top left",
                border: "none",
                pointerEvents: "none",
              }}
            />
          </div>
        )}

        {/* Non-compact iframe — full size with viewport control */}
        {!compact && (
          <div
            className="transition-all duration-500 overflow-hidden"
            style={{
              width: vpWidth ? `${vpWidth}px` : "100%",
              height: "100%",
            }}
          >
            <iframe
              key={proxyUrl + viewport}
              src={proxyUrl}
              title={label}
              onLoad={handleIframeLoad}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page Card ─────────────────────────────────────────────────────────────
function PageCard({ page, baseUrl, index, onPreview }: {
  page: CafePage;
  baseUrl: string;
  index: number;
  onPreview: (page: CafePage) => void;
}) {
  const Icon = page.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
      data-testid={`card-page-${index}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
          <Icon className="w-5 h-5 text-black/40 dark:text-white/40 group-hover:text-orange-600 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-bold text-black dark:text-white">{page.titleAr}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${page.badgeColor}`}>{page.badge}</span>
          </div>
          <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed">{page.descAr}</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-[10px] text-black/30 dark:text-white/30 font-mono bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-md truncate block max-w-[200px]" dir="ltr">{page.path}</code>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => onPreview(page)}
            className="w-8 h-8 rounded-xl border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all group/btn"
            title="معاينة"
            data-testid={`btn-preview-page-${index}`}
          >
            <Eye className="w-3.5 h-3.5 text-black/30 group-hover/btn:text-orange-600" />
          </button>
          <a
            href={`${baseUrl}${page.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center hover:bg-black/[0.04] transition-all"
            title="فتح في تبويب جديد"
            data-testid={`btn-open-page-${index}`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-black/30" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ── Stat Badge ─────────────────────────────────────────────────────────────
function StatBadge({ value, label, icon: Icon }: { value: string | number; label: string; icon: any }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[100px]">
      <Icon className="w-4 h-4 text-white/50 mx-auto mb-1" />
      <p className="text-white font-black text-lg leading-none">{value}</p>
      <p className="text-white/40 text-[10px] mt-1">{label}</p>
    </div>
  );
}

// ── Feature Highlight Card ─────────────────────────────────────────────────
function FeatureHighlight({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-bold text-sm text-black dark:text-white mb-1">{title}</p>
        <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function TemplateDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: template, isLoading, isError } = useQuery<SectorTemplate>({
    queryKey: ["/api/templates/slug", slug],
    queryFn: () => fetch(`/api/templates/slug/${slug}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    enabled: !!slug,
  });

  const isRestaurant = template?.category === "restaurant" || template?.category === "food" || template?.slug === "cafe-restaurant";
  const baseUrl = isRestaurant ? "https://cafe.qiroxstudio.online" : (template?.demoUrl?.replace(/\/$/, "") || "");
  const color = template?.heroColor || (isRestaurant ? "#b45309" : "#0f172a");
  const tier = template?.tier ? TIER_META[template.tier] : null;
  const videoEmbed = template?.howToUseVideoUrl ? getVideoEmbed(template.howToUseVideoUrl) : null;
  const isDirectVideo = template?.howToUseVideoUrl && !videoEmbed && !template.howToUseVideoUrl.includes("youtube") && !template.howToUseVideoUrl.includes("vimeo");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir={dir}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-black/20 dark:text-white/20" />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir={dir}>
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Globe className="w-16 h-16 text-black/10 dark:text-white/10" />
          <p className="text-black/40 dark:text-white/40 font-bold text-xl">النموذج غير موجود</p>
          <Link href="/demos">
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="w-4 h-4" /> العودة للنماذج
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f2] dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-24 pb-20" style={{ backgroundColor: color }}>
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        {/* Diagonal overlay */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}00 40%, #00000066 100%)` }} />
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: color, filter: "brightness(1.8) blur(80px)" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-10">
            <Link href="/demos">
              <button className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm font-medium" data-testid="btn-back-to-demos">
                <ChevronLeft className="w-4 h-4" /> النماذج
              </button>
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/70 text-sm font-medium">{L ? template.nameAr : (template.name || template.nameAr)}</span>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-10">
            <div className="flex-1">
              {/* Status pill */}
              {template.status === "active" && (
                <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 bg-green-400/20 border border-green-400/30 text-green-300 text-xs font-bold px-3 py-1 rounded-full mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  متاح الآن — تجربة حية
                </motion.span>
              )}

              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight"
              >
                {L ? template.nameAr : (template.name || template.nameAr)}
              </motion.h1>

              {isRestaurant && (
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="text-white/40 text-base mb-3 font-medium">Cafe & Restaurant Management System</motion.p>
              )}

              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-white/60 text-base leading-relaxed mb-8 max-w-xl">
                {template.descriptionAr || template.description}
              </motion.p>

              {/* Tier */}
              {tier && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${tier.bg} ${tier.border} mb-6`}>
                  <Package className={`w-4 h-4 ${tier.color}`} />
                  <span className={`text-sm font-black ${tier.color}`}>باقة {tier.label}</span>
                  <span className="text-xs text-black/50 hidden sm:inline">{tier.desc}</span>
                </motion.div>
              )}

              {/* CTA Buttons */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-3">
                {template.demoUrl && template.status === "active" && (
                  <a href={template.demoUrl} target="_blank" rel="noopener noreferrer" data-testid="btn-open-demo">
                    <Button className="h-12 px-7 rounded-2xl font-bold gap-2 bg-white text-black hover:bg-white/90 text-sm">
                      <Globe className="w-4 h-4" /> فتح الديمو الحي
                      <ExternalLink className="w-3.5 h-3.5 opacity-40" />
                    </Button>
                  </a>
                )}
                <Link href={`/order?template=${template.slug}`}>
                  <Button variant="outline" className="h-12 px-7 rounded-2xl font-bold gap-2 border-white/20 text-white hover:bg-white/10 text-sm" data-testid="btn-order-template">
                    <ArrowRight className="w-4 h-4" /> ابدأ مشروعك
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
              className="flex flex-row lg:flex-col gap-3 flex-wrap lg:flex-nowrap">
              {isRestaurant && (
                <>
                  <StatBadge value="75+" label="صفحة متاحة" icon={Layers} />
                  <StatBadge value="6" label="بوابات دخول" icon={Lock} />
                  <StatBadge value="فورية" label="تحديثات مباشرة" icon={Zap} />
                </>
              )}
              {!isRestaurant && template.featuresAr && (
                <StatBadge value={template.featuresAr.length} label="ميزة مدمجة" icon={Zap} />
              )}
              {template.estimatedDuration && (
                <StatBadge value={template.estimatedDuration} label="مدة التسليم" icon={Star} />
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Restaurant-specific Enhanced Content ────────────────── */}
      {isRestaurant && (
        <div className="max-w-6xl mx-auto px-6 py-14 space-y-16">

          {/* ── System Capabilities Row ──────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="text-center mb-10">
              <p className="text-xs font-bold text-black/30 dark:text-white/30 uppercase tracking-widest mb-2">ما يقدمه هذا النظام</p>
              <h2 className="text-3xl font-black text-black dark:text-white">نظام متكامل من الطلب حتى التوصيل</h2>
              <p className="text-black/40 dark:text-white/40 mt-2 text-sm max-w-xl mx-auto">كل ما يحتاجه الكافيه والمطعم في منظومة واحدة — من إدارة القائمة والطلبات حتى المحاسبة والمخزون والموظفين.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureHighlight icon={UtensilsCrossed} title="إدارة القائمة والطلبات" desc="قائمة رقمية تفاعلية مع تخصيص المنتجات والإضافات وإدارة الطلبات في الوقت الفعلي." color="bg-orange-500" />
              <FeatureHighlight icon={QrCode} title="نظام الطاولات وQR" desc="يمسح العميل رمز QR على الطاولة فيطلب مباشرة بدون الحاجة لنادل — تحديث فوري للمطبخ." color="bg-amber-500" />
              <FeatureHighlight icon={CreditCard} title="دفع متعدد القنوات" desc="بطاقة، نقداً، Apple Pay، بطاقة الولاء — مع دعم نظام Geidea وفوترة ZATCA." color="bg-emerald-600" />
              <FeatureHighlight icon={ChefHat} title="شاشة المطبخ KDS" desc="عرض الطلبات للمطبخ بالترتيب مع تنبيه صوتي وتحديث الحالة بضغطة واحدة." color="bg-red-500" />
              <FeatureHighlight icon={Heart} title="برنامج الولاء والنقاط" desc="مستويات عضوية (برونزي، فضي، ذهبي، بلاتيني) مع بطاقة رقمية وبرنامج إحالة." color="bg-pink-500" />
              <FeatureHighlight icon={BarChart3} title="تقارير وتحليلات ذكية" desc="لوحة تحكم تنفيذية بمؤشرات الأداء والمخزون والحضور وتقارير قابلة للتصدير." color="bg-violet-600" />
              <FeatureHighlight icon={Truck} title="إدارة التوصيل والسائقين" desc="تتبع طلبات التوصيل بالخريطة — تعيين السائقين وتتبع موقعهم في الوقت الفعلي." color="bg-sky-500" />
              <FeatureHighlight icon={Calendar} title="حجز الطاولات المسبق" desc="العميل يحجز الطاولة بالتاريخ والوقت والعدد — بدون اتصال هاتفي." color="bg-teal-500" />
              <FeatureHighlight icon={Users} title="إدارة الموظفين والرواتب" desc="شيفتات، حضور، إجازات، رواتب تلقائية — دارة كاملة للموارد البشرية." color="bg-indigo-500" />
            </div>
          </motion.section>

          {/* ── All Pages Showcase — Full List ───────────────────── */}
          <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Layers className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-black dark:text-white">دليل صفحات النظام الكامل</h2>
                <p className="text-xs text-black/40 dark:text-white/40">100+ صفحة — كل صفحة بمعاينة بصرية وشرح تفصيلي</p>
              </div>
            </div>

            <div className="space-y-14">
              {CAFE_SECTIONS.map((section, si) => (
                <div key={section.id} data-testid={`section-${section.id}`}>
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: section.color + "15", border: `1.5px solid ${section.color}30` }}>
                      {section.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-black dark:text-white leading-snug">{section.titleAr}</p>
                      <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">{section.pages.length} صفحة</p>
                    </div>
                    <div className="text-2xl font-black tabular-nums" style={{ color: section.color + "60" }}>
                      {String(si + 1).padStart(2, "0")}
                    </div>
                  </div>

                  {/* Pages grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.pages.map((page, pi) => {
                      const PageIcon = page.icon;
                      const pageUrl = `${baseUrl}${page.path}`;
                      return (
                        <motion.div
                          key={page.path}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: si * 0.02 + pi * 0.03 }}
                          className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                          data-testid={`page-card-${page.path.replace(/\//g, "-")}`}
                        >
                          {/* Browser frame (compact) */}
                          <BrowserFrame
                            url={pageUrl}
                            label={page.titleAr}
                            page={page}
                            compact
                          />

                          {/* Page info below frame */}
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: section.color + "15" }}>
                                <PageIcon className="w-4.5 h-4.5" style={{ color: section.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                  <p className="font-black text-sm text-black dark:text-white">{page.titleAr}</p>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${page.badgeColor}`}>
                                    {page.badge}
                                  </span>
                                </div>
                                <p className="text-xs text-black/55 dark:text-white/55 leading-relaxed">{page.descAr}</p>
                                <div className="flex items-center gap-2 mt-3">
                                  <code className="text-[10px] text-black/30 dark:text-white/30 font-mono bg-black/[0.04] dark:bg-white/[0.04] px-2 py-1 rounded-lg truncate block max-w-[200px]" dir="ltr">
                                    {page.path}
                                  </code>
                                  <a
                                    href={pageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors text-black/50 dark:text-white/50 whitespace-nowrap flex-shrink-0"
                                    data-testid={`btn-open-${page.path.replace(/\//g, "-")}`}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    فتح
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── Portals Access & Credentials ─────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <ShieldCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-black dark:text-white">بيانات الدخول التجريبية</h2>
                <p className="text-xs text-black/40 dark:text-white/40">استخدم هذه البيانات لاستعراض كل البوابات بصلاحياتها المختلفة</p>
              </div>
            </div>

            <div className="space-y-3">
              {CAFE_PORTALS.map((portal, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`${portal.bg} border border-black/[0.06] rounded-2xl p-4`}
                  data-testid={`portal-credential-${i}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Role */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-black/[0.06] flex items-center justify-center flex-shrink-0">
                        <portal.icon className={`w-5 h-5 ${portal.color}`} />
                      </div>
                      <p className={`font-black text-sm ${portal.color}`}>{portal.role}</p>
                    </div>

                    {/* Credentials */}
                    <div className="flex flex-wrap gap-3 flex-1">
                      {/* Username */}
                      <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 border border-black/[0.06] min-w-[140px]">
                        <div className="text-[10px] text-black/30 font-bold whitespace-nowrap">اسم المستخدم</div>
                        <code className="text-xs font-mono font-bold text-black/80" dir="ltr">{portal.username}</code>
                        <button
                          onClick={() => copyToClipboard(portal.username, `user-${i}`)}
                          className="text-black/20 hover:text-black/60 transition-colors mr-auto"
                          data-testid={`btn-copy-user-${i}`}
                        >
                          {copiedField === `user-${i}` ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {/* Password */}
                      <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 border border-black/[0.06] min-w-[140px]">
                        <div className="text-[10px] text-black/30 font-bold whitespace-nowrap">كلمة المرور</div>
                        <code className="text-xs font-mono font-bold text-black/80" dir="ltr">{portal.password}</code>
                        <button
                          onClick={() => copyToClipboard(portal.password, `pass-${i}`)}
                          className="text-black/20 hover:text-black/60 transition-colors mr-auto"
                          data-testid={`btn-copy-pass-${i}`}
                        >
                          {copiedField === `pass-${i}` ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Access info */}
                    <div className="hidden lg:block text-xs text-black/40 max-w-[200px] leading-relaxed">{portal.access}</div>
                  </div>

                  {/* Access info mobile */}
                  <p className="text-xs text-black/40 mt-2 leading-relaxed lg:hidden">{portal.access}</p>
                </motion.div>
              ))}
            </div>

            {/* Portal links */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "بوابة العملاء", path: "/auth", icon: User, color: "bg-orange-500" },
                { label: "بوابة الموظفين", path: "/employee/login", icon: Users, color: "bg-emerald-600" },
                { label: "بوابة المديرين", path: "/manager", icon: LayoutDashboard, color: "bg-violet-600" },
                { label: "بوابة السائقين", path: "/driver/login", icon: Truck, color: "bg-sky-500" },
              ].map((p, i) => (
                <a
                  key={i}
                  href={`${baseUrl}${p.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-3 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  data-testid={`btn-portal-link-${i}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${p.color} flex items-center justify-center flex-shrink-0`}>
                    <p.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-black dark:text-white leading-none mb-0.5">{p.label}</p>
                    <code className="text-[10px] text-black/30 font-mono truncate block" dir="ltr">{p.path}</code>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-black/20 group-hover:text-black/50 mr-auto flex-shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </motion.section>

        </div>
      )}

      {/* ── Generic Content (for all templates) ─────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pb-14 space-y-10">

        {/* Demo Video */}
        {(videoEmbed || isDirectVideo) && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Video className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">فيديو تعريفي</h2>
                <p className="text-xs text-black/40 dark:text-white/40">شاهد النظام في العمل</p>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06] shadow-xl bg-black aspect-video">
              {videoEmbed ? (
                <iframe src={videoEmbed} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" data-testid="iframe-demo-video" />
              ) : (
                <video src={template.howToUseVideoUrl} controls className="w-full h-full" data-testid="video-demo" />
              )}
            </div>
          </motion.section>
        )}

        {/* How to Use */}
        {template.howToUseAr && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <BookOpen className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">طريقة الاستخدام</h2>
                <p className="text-xs text-black/40 dark:text-white/40">دليل استخدام النظام خطوة بخطوة</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-black/70 dark:text-white/70 whitespace-pre-line">
                {template.howToUseAr}
              </div>
            </div>
          </motion.section>
        )}

        {/* Tier */}
        {tier && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className={`border-2 ${tier.border} ${tier.bg} rounded-3xl p-6 flex items-center gap-5`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-sm border ${tier.border}`}>
                <Package className={`w-8 h-8 ${tier.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-black ${tier.color}`}>باقة {tier.label}</p>
                <p className="text-sm text-black/50 mt-1">{tier.desc}</p>
                <Link href="/pricing">
                  <button className={`mt-2 text-xs font-bold ${tier.color} flex items-center gap-1 hover:underline`} data-testid="btn-view-pricing">
                    عرض الأسعار والمقارنة <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* Demo Website (generic non-restaurant) */}
        {!isRestaurant && template.demoUrl && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Globe className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">موقع الديمو</h2>
                <p className="text-xs text-black/40 dark:text-white/40">جرّب النظام مباشرة</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black dark:text-white">رابط الديمو الحي</p>
                    <p className="text-xs text-black/40 dark:text-white/40 truncate">{template.demoUrl}</p>
                  </div>
                </div>
                <a href={template.demoUrl} target="_blank" rel="noopener noreferrer" data-testid="btn-open-demo-link">
                  <Button className="h-10 px-5 rounded-xl gap-2 font-bold" style={{ backgroundColor: color }}>
                    <Play className="w-3.5 h-3.5" /> فتح الديمو <ExternalLink className="w-3 h-3 opacity-70" />
                  </Button>
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06] h-64 bg-gray-50 dark:bg-gray-800">
                <iframe src={template.demoUrl} className="w-full h-full" sandbox="allow-scripts allow-same-origin allow-forms" data-testid="iframe-demo-preview" title="demo preview" />
              </div>
            </div>
          </motion.section>
        )}

        {/* Files */}
        {template.templateFiles && template.templateFiles.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Download className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">الملفات والموارد</h2>
                <p className="text-xs text-black/40 dark:text-white/40">{template.templateFiles.length} ملف متاح للتحميل</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl overflow-hidden divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {template.templateFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors" data-testid={`file-item-${i}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-black/40 dark:text-white/40" />
                    </div>
                    <p className="text-sm font-bold text-black dark:text-white truncate">{L ? file.nameAr : (file.name || file.nameAr)}</p>
                  </div>
                  {file.url && (
                    <a href={file.url} target="_blank" rel="noopener noreferrer" download data-testid={`btn-download-file-${i}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl gap-1.5 text-xs font-bold flex-shrink-0">
                        <Download className="w-3.5 h-3.5" /> تحميل
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Features */}
        {template.featuresAr && template.featuresAr.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Zap className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">مميزات النظام</h2>
                <p className="text-xs text-black/40 dark:text-white/40">{template.featuresAr.length} ميزة مدمجة</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {template.featuresAr.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 py-1" data-testid={`feature-item-${i}`}>
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-black/70 dark:text-white/70">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Feature Details */}
        {template.featuresDetails && template.featuresDetails.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <BookOpen className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">دليل المميزات التفصيلي</h2>
                <p className="text-xs text-black/40 dark:text-white/40">شرح كامل لكل ميزة في النظام</p>
              </div>
            </div>
            <div className="space-y-3">
              {template.featuresDetails.map((fd, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{fd.icon || "✨"}</span>
                    <div>
                      <p className="font-bold text-sm text-black dark:text-white">{fd.titleAr}</p>
                      {fd.descAr && (
                        <p className="text-xs text-black/50 dark:text-white/50 mt-1 leading-relaxed">{fd.descAr}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="relative rounded-3xl p-10 text-center overflow-hidden" style={{ backgroundColor: color }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: "white" }} />
          <div className="relative z-10">
            <Star className="w-10 h-10 text-white/50 mx-auto mb-4" />
            <h3 className="text-3xl font-black text-white mb-3">أعجبك هذا النظام؟</h3>
            <p className="text-white/50 text-sm mb-8 max-w-md mx-auto">ابدأ مشروعك الآن وسيتولى فريقنا تهيئة النظام وتخصيصه لكافيهك أو مطعمك خلال أيام.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/order?template=${template.slug}`}>
                <Button className="h-12 px-9 rounded-2xl bg-white text-black hover:bg-white/90 font-bold text-sm gap-2" data-testid="btn-start-order-cta">
                  <ArrowRight className="w-5 h-5" /> ابدأ مشروعك الآن
                </Button>
              </Link>
              <Link href="/demos">
                <Button variant="outline" className="h-12 px-9 rounded-2xl border-white/20 text-white hover:bg-white/10 font-bold text-sm">
                  استعرض نماذج أخرى
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

      </div>

      <Footer />
    </div>
  );
}
