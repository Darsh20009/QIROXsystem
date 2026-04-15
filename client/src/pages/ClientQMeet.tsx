import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video, Copy, Check, Calendar, Clock,
  Loader2, CheckCircle2, ArrowRight, Hash,
  Users, Radio, Sparkles, ChevronRight,
} from "lucide-react";

function Countdown({ target }: { target: string }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const update = () => setDiff(Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [target]);
  if (diff <= 0) return <span className="text-red-500 font-bold text-xs">الآن</span>;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  const fmt = (n: number) => String(n).padStart(2, "0");
  if (h > 24) return null;
  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      {h > 0 && <><span className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded">{fmt(h)}</span><span className="text-black/30 dark:text-white/30">:</span></>}
      <span className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded">{fmt(m)}</span>
      <span className="text-black/30 dark:text-white/30">:</span>
      <span className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded">{fmt(s)}</span>
    </div>
  );
}

export default function ClientQMeet() {
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const [copied, setCopied] = useState<string | null>(null);

  const { data: meetings = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/qmeet/upcoming"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const upcoming = meetings.filter((m: any) => m.status === "scheduled" || m.status === "live");
  const past = meetings.filter((m: any) => m.status === "completed");
  const liveNow = upcoming.filter((m: any) => m.status === "live");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-blue-50/20 dark:from-gray-950 dark:via-violet-950/20 dark:to-gray-950" dir={dir}>

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-blue-700" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 25% 50%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(circle at 75% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-br from-slate-50 via-violet-50/30 to-blue-50/20 dark:from-gray-950 dark:via-violet-950/20 dark:to-gray-950 rounded-t-[2rem]" />

        <div className="relative px-4 pt-10 pb-12 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">QMeet</h1>
              <p className="text-white/60 text-xs">{L ? "اجتماعاتي المرئية" : "My Video Meetings"}</p>
            </div>
          </motion.div>

          {/* Live now banner */}
          <AnimatePresence>
            {liveNow.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-4 bg-red-500/90 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Radio className="w-4 h-4 text-white animate-pulse" />
                  <span className="text-white font-bold text-sm">{liveNow[0].title}</span>
                  <Badge className="bg-white/20 text-white text-[10px] border-0">LIVE</Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/meet/${liveNow[0].roomName}`)}
                  className="bg-white text-red-600 hover:bg-red-50 h-8 text-xs font-bold rounded-xl px-3"
                  data-testid="btn-join-live"
                >
                  {L ? "انضم الآن" : "Join Now"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: L ? "القادمة" : "Upcoming", value: upcoming.length, icon: Calendar },
              { label: L ? "المباشرة" : "Live", value: liveNow.length, icon: Radio },
              { label: L ? "المنتهية" : "Completed", value: past.length, icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm rounded-2xl px-3 py-3 text-center border border-white/20">
                <Icon className="w-4 h-4 text-white/70 mx-auto mb-1" />
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-white/60 text-[10px] font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8 space-y-5 -mt-2">

        {/* Join by code card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate("/meet/join")}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-4 flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700/50 transition-all group"
          data-testid="btn-join-by-code"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-black dark:text-white">{L ? "انضم برمز الاجتماع" : "Join by Meeting Code"}</p>
              <p className="text-xs text-black/40 dark:text-white/40">{L ? "أدخل الكود المُرسَل إليك" : "Enter the code sent to you"}</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
            <ChevronRight className="w-4 h-4 text-black/30 dark:text-white/30 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
          </div>
        </motion.div>

        {/* Upcoming meetings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-black dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              {L ? "الاجتماعات القادمة" : "Upcoming Meetings"}
            </h2>
            {upcoming.length > 0 && (
              <Badge variant="secondary" className="text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-0">
                {upcoming.length}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
                <p className="text-xs text-black/30 dark:text-white/30">{L ? "جاري التحميل..." : "Loading..."}</p>
              </div>
            </div>
          ) : upcoming.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-7 h-7 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="font-bold text-sm text-black/40 dark:text-white/40">
                {L ? "لا توجد اجتماعات قادمة" : "No upcoming meetings"}
              </p>
              <p className="text-xs text-black/25 dark:text-white/25 mt-1 leading-relaxed">
                {L ? "ستصلك دعوة من الفريق عند جدولة اجتماع" : "You'll receive an invite when a meeting is scheduled"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((m: any, idx: number) => {
                const isLive = m.status === "live";
                const scheduledTime = m.scheduledAt ? new Date(m.scheduledAt) : null;
                const isWithin24h = scheduledTime && (scheduledTime.getTime() - Date.now()) < 86400000 && !isLive;
                return (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative bg-white dark:bg-gray-900 rounded-3xl border shadow-sm overflow-hidden ${
                      isLive
                        ? "border-red-200 dark:border-red-800/50 ring-1 ring-red-500/20"
                        : "border-gray-100 dark:border-white/5"
                    }`}
                  >
                    {isLive && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {isLive && (
                              <span className="flex items-center gap-1 text-[10px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                {L ? "مباشر الآن" : "LIVE NOW"}
                              </span>
                            )}
                            {!isLive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                                {L ? "مجدول" : "Scheduled"}
                              </span>
                            )}
                            {isWithin24h && scheduledTime && (
                              <Countdown target={scheduledTime.toISOString()} />
                            )}
                          </div>

                          <p className="font-black text-sm text-black dark:text-white truncate mb-1">{m.title}</p>

                          <div className="flex items-center gap-3 flex-wrap">
                            {scheduledTime && (
                              <div className="flex items-center gap-1 text-xs text-black/40 dark:text-white/40">
                                <Calendar className="w-3 h-3" />
                                <span>{scheduledTime.toLocaleString(L ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-black/40 dark:text-white/40">
                              <Clock className="w-3 h-3" />
                              <span>{m.durationMinutes} {L ? "دقيقة" : "min"}</span>
                            </div>
                            {m.participantCount > 0 && (
                              <div className="flex items-center gap-1 text-xs text-black/40 dark:text-white/40">
                                <Users className="w-3 h-3" />
                                <span>{m.participantCount}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={() => navigate(`/meet/${m.roomName}`)}
                          size="sm"
                          className={`rounded-2xl h-10 text-xs font-black gap-1.5 shrink-0 shadow-sm ${
                            isLive
                              ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-red-500/20"
                              : "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-violet-500/20"
                          }`}
                          data-testid={`btn-join-meeting-${m._id}`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          {isLive ? (L ? "انضم الآن" : "Join Now") : (L ? "دخول" : "Enter")}
                        </Button>
                      </div>

                      {m.joinCode && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-1.5 flex-1">
                            <Hash className="w-3 h-3 text-black/30 dark:text-white/30" />
                            <span className="font-mono text-xs text-black/60 dark:text-white/50 tracking-widest">{m.joinCode}</span>
                          </div>
                          <button
                            onClick={() => copy(m.joinCode, m._id)}
                            className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                            data-testid={`btn-copy-code-${m._id}`}
                          >
                            {copied === m._id
                              ? <Check className="w-3.5 h-3.5 text-green-500" />
                              : <Copy className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past meetings */}
        {past.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-black dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
              {L ? "الاجتماعات المنتهية" : "Past Meetings"}
            </h2>
            <div className="space-y-2">
              {past.slice(0, 5).map((m: any, idx: number) => (
                <motion.div
                  key={m._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 px-4 py-3 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black/60 dark:text-white/60 truncate max-w-[180px]">{m.title}</p>
                      {m.scheduledAt && (
                        <p className="text-[10px] text-black/30 dark:text-white/30">
                          {new Date(m.scheduledAt).toLocaleDateString(L ? "ar-SA" : "en-US", { dateStyle: "medium" })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-black/30 dark:text-white/30 bg-gray-50 dark:bg-gray-800 rounded-xl px-2 py-1">
                    <Clock className="w-3 h-3" />
                    <span>{m.durationMinutes}{L ? "د" : "m"}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Quick join tip */}
        <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-900/20 dark:to-blue-900/20 rounded-3xl p-4 border border-violet-200/50 dark:border-violet-700/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-black/70 dark:text-white/70">{L ? "هل لديك رمز اجتماع؟" : "Have a meeting code?"}</p>
              <p className="text-[11px] text-black/40 dark:text-white/40">{L ? "انضم مباشرة دون الحاجة للجدولة" : "Join directly without scheduling"}</p>
            </div>
            <button
              onClick={() => navigate("/meet/join")}
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline shrink-0"
            >
              {L ? "انضم الآن" : "Join Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
