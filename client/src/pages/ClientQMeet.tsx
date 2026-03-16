import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Video, Zap, Copy, Check, ExternalLink, Calendar, Clock,
  Loader2, Users, CheckCircle2, ArrowRight, Link2, Hash,
} from "lucide-react";

export default function ClientQMeet() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const [instantResult, setInstantResult] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: meetings = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/qmeet/upcoming"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const instantMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/qmeet/instant", {}),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/qmeet/upcoming"] });
      setInstantResult(data);
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const upcoming = meetings.filter((m: any) => m.status === "scheduled" || m.status === "live");
  const past = meetings.filter((m: any) => m.status === "completed");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.06] px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center">
              <Video className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-base font-black text-black dark:text-white">QMeet</h1>
              <p className="text-xs text-black/40 dark:text-white/40">{L ? "اجتماعاتي المرئية" : "My Video Meetings"}</p>
            </div>
          </div>
          <Button
            onClick={() => instantMutation.mutate()}
            disabled={instantMutation.isPending}
            className="h-10 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2 text-sm"
            data-testid="btn-client-instant-meet"
          >
            {instantMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Zap className="w-4 h-4" /> {L ? "اجتماع سريع" : "Quick Meeting"}</>
            }
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Join by code */}
        <div
          onClick={() => navigate("/meet/join")}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-sm text-black dark:text-white">{L ? "انضم برمز" : "Join by Code"}</p>
              <p className="text-xs text-black/40 dark:text-white/40">{L ? "أدخل رمز الاجتماع للانضمام" : "Enter meeting code to join"}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-black/30 dark:text-white/30" />
        </div>

        {/* Upcoming meetings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-black dark:text-white">{L ? "الاجتماعات القادمة" : "Upcoming Meetings"}</h2>
            {upcoming.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {upcoming.length} {L ? "اجتماع" : "meeting(s)"}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-8 text-center shadow-sm">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Video className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="font-bold text-sm text-black/40 dark:text-white/40">
                {L ? "لا توجد اجتماعات قادمة" : "No upcoming meetings"}
              </p>
              <p className="text-xs text-black/30 dark:text-white/30 mt-1">
                {L ? "أنشئ اجتماعاً سريعاً أو انتظر دعوة من الفريق" : "Start a quick meeting or wait for a team invite"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((m: any) => {
                const isLive = m.status === "live";
                return (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isLive && (
                            <span className="flex items-center gap-1 text-[10px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              {L ? "مباشر" : "LIVE"}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isLive
                              ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                              : "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400"
                          }`}>
                            {isLive ? (L ? "مباشر الآن" : "Live Now") : (L ? "مجدول" : "Scheduled")}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-black dark:text-white truncate">{m.title}</p>
                        {m.scheduledAt && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-black/40 dark:text-white/40">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(m.scheduledAt).toLocaleString(L ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-black/40 dark:text-white/40">
                          <Clock className="w-3 h-3" />
                          <span>{m.durationMinutes} {L ? "دقيقة" : "min"}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(`/meet/${m.roomName}`)}
                        size="sm"
                        className={`rounded-2xl h-9 text-xs font-bold gap-1.5 shrink-0 ${
                          isLive
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-violet-600 hover:bg-violet-700 text-white"
                        }`}
                        data-testid={`btn-join-meeting-${m._id}`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        {isLive ? (L ? "انضم الآن" : "Join Now") : (L ? "دخول" : "Enter")}
                      </Button>
                    </div>
                    {m.joinCode && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-2">
                        <Hash className="w-3 h-3 text-black/30 dark:text-white/30" />
                        <span className="font-mono text-xs text-black/50 dark:text-white/50 tracking-widest">{m.joinCode}</span>
                        <button onClick={() => copy(m.joinCode, m._id)} className="ml-auto">
                          {copied === m._id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past meetings */}
        {past.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-black dark:text-white mb-3">{L ? "الاجتماعات السابقة" : "Past Meetings"}</h2>
            <div className="space-y-2">
              {past.slice(0, 5).map((m: any) => (
                <div
                  key={m._id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 px-4 py-3 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    <div>
                      <p className="text-sm font-bold text-black/60 dark:text-white/60 truncate max-w-[180px]">{m.title}</p>
                      {m.scheduledAt && (
                        <p className="text-[10px] text-black/30 dark:text-white/30">
                          {new Date(m.scheduledAt).toLocaleDateString(L ? "ar-SA" : "en-US")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-black/30 dark:text-white/30">
                    <Clock className="w-3 h-3" />
                    <span>{m.durationMinutes} {L ? "د" : "m"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instant Meeting Result Dialog */}
      <Dialog open={!!instantResult} onOpenChange={v => { if (!v) setInstantResult(null); }}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-0" dir={dir}>
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-3">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-black">{L ? "الاجتماع جاهز!" : "Meeting Ready!"}</h2>
            <p className="text-white/70 text-sm mt-1">{instantResult?.title}</p>
          </div>
          {instantResult && (
            <div className="p-5 space-y-3">
              {/* Join Code */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                <p className="text-xs font-bold text-black/40 dark:text-white/40 mb-2">{L ? "رمز الانضمام" : "Join Code"}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-2xl tracking-[0.3em] text-black dark:text-white">{instantResult.joinCode}</span>
                  <button onClick={() => copy(instantResult.joinCode, "code")} className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                    {copied === "code" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-black/40 dark:text-white/40" />}
                  </button>
                </div>
              </div>

              {/* Link */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Link2 className="w-4 h-4 text-black/30 dark:text-white/30 shrink-0" />
                  <span className="text-xs text-black/50 dark:text-white/50 truncate">{`${window.location.origin}/meet/join?code=${instantResult.joinCode}`}</span>
                </div>
                <button onClick={() => copy(`${window.location.origin}/meet/join?code=${instantResult.joinCode}`, "link")} className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 shrink-0">
                  {copied === "link" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />}
                </button>
              </div>

              <Button
                onClick={() => { navigate(`/meet/${instantResult.roomName}`); setInstantResult(null); }}
                className="w-full h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black gap-2"
                data-testid="btn-enter-instant-meet"
              >
                <ExternalLink className="w-4 h-4" />
                {L ? "ادخل الاجتماع" : "Enter Meeting"}
              </Button>
              <button
                onClick={() => setInstantResult(null)}
                className="w-full text-center text-xs text-black/30 dark:text-white/30 hover:text-black/50 py-1"
              >
                {L ? "إغلاق" : "Close"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
