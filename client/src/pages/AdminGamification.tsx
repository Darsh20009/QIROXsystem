import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Star, Zap, Target, Award } from "lucide-react";

const BADGE_META: Record<string, { emoji: string; color: string; bg: string }> = {
  "محترف":  { emoji: "💎", color: "text-violet-700 dark:text-violet-300",  bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800" },
  "متميز":  { emoji: "🥇", color: "text-yellow-700 dark:text-yellow-300",   bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800" },
  "نشط":    { emoji: "🥈", color: "text-blue-700 dark:text-blue-300",       bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  "مبتدئ":  { emoji: "🥉", color: "text-slate-600 dark:text-slate-300",     bg: "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700" },
};

const ROLE_LABEL: Record<string, string> = {
  admin: "مدير النظام", manager: "مدير", developer: "مطور", designer: "مصمم",
  accountant: "محاسب", support: "دعم فني", marketing: "تسويق",
};

const RANK_STYLES = [
  "from-yellow-400 to-yellow-600 text-white",
  "from-slate-400 to-slate-500 text-white",
  "from-amber-600 to-amber-700 text-white",
];

export default function AdminGamification() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const { data: leaderboard = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/gamification/leaderboard"],
  });

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const totalPoints = leaderboard.reduce((s: number, e: any) => s + e.points, 0);
  const totalTasks  = leaderboard.reduce((s: number, e: any) => s + e.completedTasks, 0);

  return (
    <div className="p-6 space-y-6 font-sans" dir={dir}>
      <PageGraphics />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
          <Trophy className="w-6 h-6 text-yellow-500" />
          {L ? "لوحة التميّز — نقاط الفريق" : "Team Excellence Board"}
        </h1>
        <p className="text-sm text-foreground/40 mt-1">
          {L ? "تتبع إنجازات الفريق ونقاط الأداء ومستويات التطور" : "Track team achievements, performance points, and growth levels"}
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Trophy, label: L ? "إجمالي الأعضاء" : "Team Members",    value: leaderboard.length,                             color: "text-yellow-500" },
          { icon: Star,   label: L ? "إجمالي النقاط" : "Total Points",      value: totalPoints,                                    color: "text-violet-500" },
          { icon: Target, label: L ? "مهام مكتملة" : "Tasks Completed",     value: totalTasks,                                     color: "text-green-500" },
          { icon: Award,  label: L ? "أعلى رتبة" : "Top Badge",             value: leaderboard[0]?.badge || "—",                  color: "text-blue-500" },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2.5">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <p className="text-xs text-foreground/40">{s.label}</p>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-foreground/30" /></div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16 text-foreground/40">{L ? "لا يوجد موظفون بعد" : "No employees yet"}</div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length >= 1 && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  {L ? "المتصدرون" : "Top Performers"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-center gap-4 py-4">
                  {/* Reorder for podium: 2nd, 1st, 3rd */}
                  {[top3[1], top3[0], top3[2]].filter(Boolean).map((emp: any, idx: number) => {
                    const podiumRank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
                    const heights = ["h-24", "h-32", "h-20"];
                    const badgeMeta = BADGE_META[emp.badge] || BADGE_META["مبتدئ"];
                    return (
                      <div key={emp.id} className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                        {/* Avatar */}
                        <div className="relative">
                          {emp.avatar ? (
                            <img src={emp.avatar} alt={emp.fullName} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md" />
                          ) : (
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${RANK_STYLES[podiumRank - 1]} flex items-center justify-center text-xl font-bold shadow-md`}>
                              {emp.fullName?.[0]?.toUpperCase()}
                            </div>
                          )}
                          {podiumRank === 1 && <span className="absolute -top-2 -right-2 text-xl">👑</span>}
                        </div>
                        <p className="text-sm font-bold text-foreground text-center leading-tight">{emp.fullName}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeMeta.bg} ${badgeMeta.color}`}>
                          {badgeMeta.emoji} {emp.badge}
                        </span>
                        {/* Podium block */}
                        <div className={`w-full ${heights[podiumRank - 1]} bg-gradient-to-b ${RANK_STYLES[podiumRank - 1]} rounded-t-lg flex flex-col items-center justify-start pt-2 shadow-md`}>
                          <span className="text-white font-black text-lg">#{podiumRank}</span>
                          <span className="text-white/80 text-xs font-semibold">{emp.points} {L ? "نقطة" : "pts"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Leaderboard */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                {L ? "قائمة الترتيب الكاملة" : "Full Leaderboard"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((emp: any) => {
                  const badgeMeta = BADGE_META[emp.badge] || BADGE_META["مبتدئ"];
                  const pct = Math.min(100, Math.round((emp.points / Math.max(leaderboard[0]?.points || 1, 1)) * 100));
                  return (
                    <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors group" data-testid={`row-employee-${emp.id}`}>
                      {/* Rank */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        emp.rank === 1 ? "bg-yellow-500 text-white" :
                        emp.rank === 2 ? "bg-slate-400 text-white" :
                        emp.rank === 3 ? "bg-amber-600 text-white" :
                        "bg-foreground/10 text-foreground/50"
                      }`}>
                        {emp.rank}
                      </div>
                      {/* Avatar */}
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.fullName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold text-foreground/60 shrink-0">
                          {emp.fullName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">{emp.fullName}</p>
                          <span className="text-[10px] text-foreground/40">{ROLE_LABEL[emp.role] || emp.role}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-1 h-1.5 bg-foreground/10 rounded-full overflow-hidden w-full">
                          <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex gap-3 mt-1 text-[10px] text-foreground/40">
                          <span>✅ {emp.completedTasks} {L ? "مهمة" : "tasks"}</span>
                          <span>📁 {emp.activeProjects} {L ? "مشروع" : "projects"}</span>
                        </div>
                      </div>
                      {/* Badge + Points */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeMeta.bg} ${badgeMeta.color} font-medium`}>
                          {badgeMeta.emoji} {emp.badge}
                        </span>
                        <span className="text-sm font-bold text-foreground">{emp.points} <span className="text-xs font-normal text-foreground/40">{L ? "نقطة" : "pts"}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Badge Guide */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground/60">{L ? "دليل الرتب والشارات" : "Badge Guide"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { badge: "مبتدئ",  points: "0–49",   emoji: "🥉", desc: L ? "نقطة البداية" : "Starting level" },
                  { badge: "نشط",    points: "50–99",  emoji: "🥈", desc: L ? "موظف منتج" : "Productive employee" },
                  { badge: "متميز",  points: "100–199",emoji: "🥇", desc: L ? "أداء عالٍ" : "High performer" },
                  { badge: "محترف",  points: "200+",   emoji: "💎", desc: L ? "النخبة" : "Elite level" },
                ].map((b) => {
                  const meta = BADGE_META[b.badge] || BADGE_META["مبتدئ"];
                  return (
                    <div key={b.badge} className={`rounded-xl p-3 border ${meta.bg} text-center`}>
                      <div className="text-2xl mb-1">{b.emoji}</div>
                      <p className={`text-sm font-bold ${meta.color}`}>{b.badge}</p>
                      <p className="text-[10px] text-foreground/40 mt-0.5">{b.points} {L ? "نقطة" : "pts"}</p>
                      <p className="text-[10px] text-foreground/50 mt-1">{b.desc}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
