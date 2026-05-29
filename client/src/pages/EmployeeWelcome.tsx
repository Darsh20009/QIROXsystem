import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  LogIn, LogOut, Clock, CalendarDays, CheckCircle2, ListTodo, BarChart3,
  Zap, Timer, TrendingUp, ChevronRight, Loader2, Play, Volume2, VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function getGreeting(name: string, lang: string) {
  const h = new Date().getHours();
  if (lang === "ar") {
    const g = h < 12 ? "صباح الخير" : h < 17 ? "مساء الخير" : "مساء النور";
    return `${g}، ${name} 👋`;
  }
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${g}, ${name} 👋`;
}

function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" });
}

function hoursLabel(h: number) {
  if (h === 0) return "0 ساعة";
  if (h < 1) return `${Math.round(h * 60)}د`;
  return `${h}س`;
}

function VideoEmbed({ url, muted, onToggleMute }: { url: string; muted: boolean; onToggleMute: () => void }) {
  const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  if (isYoutube) {
    let embedId = "";
    try {
      const u = new URL(url);
      embedId = u.searchParams.get("v") || u.pathname.split("/").pop() || "";
    } catch {}
    return (
      <div className="relative w-full h-full">
        <iframe
          className="w-full h-full object-cover"
          src={`https://www.youtube.com/embed/${embedId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${embedId}&controls=0&modestbranding=1&playsinline=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
        <button
          onClick={onToggleMute}
          className="absolute bottom-3 left-3 z-20 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={url}
        autoPlay
        loop
        muted={muted}
        playsInline
        className="w-full h-full object-cover"
      />
      <button
        onClick={onToggleMute}
        className="absolute bottom-3 left-3 z-20 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
      >
        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function GradientBanner() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center mx-auto mb-3">
          <img src="/qirox-icon-nobg.png" alt="Qirox" className="w-12 h-12 object-contain opacity-90" />
        </div>
        <p className="text-white/40 text-xs">QIROX Studio</p>
      </div>
    </div>
  );
}

export default function EmployeeWelcome() {
  const { data: user } = useUser();
  const { lang } = useI18n();
  const L = lang === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [muted, setMuted] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: summary, isLoading } = useQuery<any>({
    queryKey: ["/api/employee/welcome-summary"],
    queryFn: async () => {
      const r = await fetch("/api/employee/welcome-summary", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  useEffect(() => {
    if (summary) setCheckedIn(summary.isCheckedInNow);
  }, [summary]);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/attendance/check-in", {});
      return r.json();
    },
    onSuccess: () => {
      setCheckedIn(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      qc.invalidateQueries({ queryKey: ["/api/employee/welcome-summary"] });
      qc.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({ title: L ? "تم تسجيل الحضور ✅" : "Checked in ✅" });
    },
    onError: (e: any) => {
      toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/attendance/check-out", {});
      return r.json();
    },
    onSuccess: () => {
      setCheckedIn(false);
      qc.invalidateQueries({ queryKey: ["/api/employee/welcome-summary"] });
      qc.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({ title: L ? "تم تسجيل الانصراف 👋" : "Checked out 👋" });
    },
    onError: (e: any) => {
      toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    },
  });

  const displayName = (user as any)?.fullName || (user as any)?.username || "الموظف";
  const stats = summary?.stats;
  const videoUrl = summary?.welcomeVideoUrl || "";
  const recent = summary?.recentAttendance || [];

  const statCards = stats ? [
    {
      icon: CalendarDays,
      label: L ? "أيام الحضور هذا الشهر" : "Days this month",
      value: stats.activeDaysThisMonth,
      unit: L ? "يوم" : "days",
      color: "bg-black/[0.04] dark:bg-white/[0.06]",
    },
    {
      icon: Timer,
      label: L ? "إجمالي ساعات العمل" : "Total hours",
      value: hoursLabel(stats.totalHoursThisMonth),
      unit: "",
      color: "bg-black/[0.04] dark:bg-white/[0.06]",
    },
    {
      icon: Zap,
      label: L ? "متوسط ساعات اليوم" : "Avg per day",
      value: hoursLabel(stats.avgHoursPerDay),
      unit: "",
      color: "bg-black/[0.04] dark:bg-white/[0.06]",
    },
    {
      icon: CheckCircle2,
      label: L ? "المهام المنجزة" : "Tasks done",
      value: `${stats.tasksDone}/${stats.tasksAssigned}`,
      unit: "",
      color: "bg-black/[0.04] dark:bg-white/[0.06]",
    },
    {
      icon: ListTodo,
      label: L ? "مهام نشطة" : "Active tasks",
      value: stats.tasksInProgress,
      unit: "",
      color: "bg-black/[0.04] dark:bg-white/[0.06]",
    },
    {
      icon: TrendingUp,
      label: L ? "نسبة الإنجاز" : "Completion",
      value: `${stats.completionRate}%`,
      unit: "",
      color: "bg-black/[0.04] dark:bg-white/[0.06]",
    },
  ] : [];

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir="rtl">

      {/* ── Video / Banner ── */}
      <div className="relative w-full h-[340px] md:h-[420px] overflow-hidden bg-black">
        {videoUrl ? (
          <VideoEmbed url={videoUrl} muted={muted} onToggleMute={() => setMuted(m => !m)} />
        ) : (
          <GradientBanner />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* Greeting inside banner */}
        <div className="absolute bottom-0 inset-x-0 px-5 pb-6 z-10">
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs rounded-full px-3 py-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                {L ? "تم تسجيل حضورك بنجاح!" : "Attendance recorded!"}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-white/70 text-sm mb-1">{new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            <h1 className="text-white text-2xl md:text-3xl font-black leading-tight tracking-tight">
              {getGreeting(displayName, lang)}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Check-in / Check-out card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${checkedIn ? "bg-green-50 dark:bg-green-950" : "bg-black/[0.04] dark:bg-white/[0.06]"}`}>
                {checkedIn
                  ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  : <Clock className="w-5 h-5 text-black/40 dark:text-white/40" />
                }
              </div>
              <div>
                <p className="text-sm font-bold text-black dark:text-white">
                  {checkedIn ? (L ? "أنت حاضر الآن" : "You're checked in") : (L ? "لم تسجل حضورك بعد" : "Not checked in yet")}
                </p>
                <p className="text-[11px] text-black/40 dark:text-white/40">
                  {checkedIn
                    ? (L ? "اضغط لتسجيل الانصراف" : "Tap to check out")
                    : (L ? "اضغط لتسجيل الحضور" : "Tap to check in")}
                </p>
              </div>
            </div>
            {checkedIn ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
                className="border-black/10 dark:border-white/10 gap-1.5"
                data-testid="button-checkout"
              >
                {checkOutMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                {L ? "انصراف" : "Check out"}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/85 gap-1.5"
                data-testid="button-checkin"
              >
                {checkInMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                {L ? "تسجيل حضور" : "Check in"}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-wider mb-3">
              {L ? "ملخص آخر 30 يوم" : "Last 30 days"}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {statCards.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 flex flex-col gap-2"
                  data-testid={`stat-card-${i}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-4 h-4 text-black dark:text-white" />
                  </div>
                  <p className="text-xl font-black text-black dark:text-white leading-none">{s.value}</p>
                  <p className="text-[10px] text-black/40 dark:text-white/40 leading-tight">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent attendance */}
        {recent.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-wider">
                {L ? "آخر أيام الحضور" : "Recent attendance"}
              </h2>
              <Link href="/admin/attendance">
                <span className="text-[11px] text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors cursor-pointer flex items-center gap-0.5">
                  {L ? "كل السجلات" : "All records"}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {recent.map((rec: any, i: number) => {
                const isOpen = !rec.checkOut;
                const hrs = rec.workHours ? `${rec.workHours}س` : isOpen ? "" : "--";
                return (
                  <div key={rec._id || i} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOpen ? "bg-green-500" : "bg-black/20 dark:bg-white/20"}`} />
                      <div>
                        <p className="text-xs font-semibold text-black dark:text-white">{formatDate(rec.checkIn)}</p>
                        <p className="text-[10px] text-black/40 dark:text-white/40">
                          {formatTime(rec.checkIn)} — {rec.checkOut ? formatTime(rec.checkOut) : (L ? "نشط الآن" : "Active")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen && (
                        <Badge className="text-[9px] bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200/50 px-1.5 py-0.5">
                          {L ? "نشط" : "Active"}
                        </Badge>
                      )}
                      {hrs && <span className="text-xs font-bold text-black/60 dark:text-white/60">{hrs}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <h2 className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-wider mb-3">
            {L ? "الوصول السريع" : "Quick access"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: L ? "ملفي الشخصي" : "My Profile", href: "/employee/profile", icon: BarChart3 },
              { label: L ? "صندوقي البريدي" : "My Mail", href: "/employee/mail", icon: LogIn },
              { label: L ? "لوحتي المتخصصة" : "My Board", href: "/employee/role-dashboard", icon: Zap },
              { label: L ? "صانع الأنظمة" : "System Builder", href: "/employee/system-builder", icon: Play },
            ].map((link, i) => (
              <Link key={i} href={link.href}>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group" data-testid={`link-quick-${i}`}>
                  <div className="w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                    <link.icon className="w-4 h-4 text-black dark:text-white" />
                  </div>
                  <span className="text-xs font-semibold text-black dark:text-white group-hover:text-black dark:group-hover:text-white">{link.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-black/20 dark:text-white/20 mr-auto" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        <div className="h-8" />
      </div>
    </div>
  );
}
