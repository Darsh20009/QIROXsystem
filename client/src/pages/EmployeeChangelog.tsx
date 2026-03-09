import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Clock, ChevronDown, ChevronUp, BookOpen,
  Zap, Wrench, Shield, TrendingUp, CheckCircle2, Tag,
  Loader2, RefreshCw, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-auth";

interface VersionFeature {
  title: string;
  description: string;
  type: "new" | "improvement" | "fix" | "security";
}

interface VersionEntry {
  version: string;
  date: string;
  label: string;
  summary: string;
  features: VersionFeature[];
}

interface SystemGuideSection {
  title: string;
  icon: string;
  description: string;
  steps: string[];
}

interface ChangelogData {
  version: string;
  changelog: VersionEntry[];
  guide: SystemGuideSection[];
}

const FEATURE_TYPE_CONFIG = {
  new: {
    label: "جديد",
    icon: Sparkles,
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800/50",
    badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
    icon_color: "text-emerald-600 dark:text-emerald-400",
  },
  improvement: {
    label: "تحسين",
    icon: TrendingUp,
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800/50",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
    icon_color: "text-blue-600 dark:text-blue-400",
  },
  fix: {
    label: "إصلاح",
    icon: Wrench,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800/50",
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
    icon_color: "text-amber-600 dark:text-amber-400",
  },
  security: {
    label: "أمان",
    icon: Shield,
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800/50",
    badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400",
    icon_color: "text-purple-600 dark:text-purple-400",
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

function FeatureCard({ feature, index }: { feature: VersionFeature; index: number }) {
  const cfg = FEATURE_TYPE_CONFIG[feature.type];
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${cfg.icon_color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-sm text-black dark:text-white">{feature.title}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          </div>
          <p className="text-xs text-black/60 dark:text-white/55 leading-relaxed">{feature.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function VersionCard({ entry, isLatest, index }: { entry: VersionEntry; isLatest: boolean; index: number }) {
  const [expanded, setExpanded] = useState(isLatest);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`rounded-2xl border overflow-hidden ${isLatest
        ? "border-black/15 dark:border-white/15 bg-white dark:bg-gray-900 shadow-sm"
        : "border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]"
      }`}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-right p-5 flex items-start gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
        data-testid={`version-card-${entry.version}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider ${isLatest
              ? "bg-black dark:bg-white text-white dark:text-black"
              : "bg-black/[0.06] dark:bg-white/[0.06] text-black/50 dark:text-white/50"
            }`}>v{entry.version}</span>
            {isLatest && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                الإصدار الحالي
              </span>
            )}
            <span className="text-[11px] text-black/40 dark:text-white/40 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(entry.date)}
            </span>
          </div>
          <p className="font-bold text-sm text-black dark:text-white">{entry.label}</p>
          <p className="text-xs text-black/55 dark:text-white/50 mt-0.5 leading-relaxed">{entry.summary}</p>
        </div>
        <div className="shrink-0 mt-1 text-black/30 dark:text-white/30">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 grid gap-2.5">
              {entry.features.map((f, i) => (
                <FeatureCard key={i} feature={f} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function GuideSection({ section, index }: { section: SystemGuideSection; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-right p-4 flex items-center gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
        data-testid={`guide-section-${index}`}
      >
        <span className="text-2xl shrink-0">{section.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-black dark:text-white">{section.title}</p>
          <p className="text-xs text-black/50 dark:text-white/45 mt-0.5 line-clamp-1">{section.description}</p>
        </div>
        <div className="shrink-0 text-black/30 dark:text-white/30">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <p className="text-xs text-black/55 dark:text-white/50 mb-3 leading-relaxed border-t border-black/[0.05] dark:border-white/[0.05] pt-3">
                {section.description}
              </p>
              <ol className="space-y-2.5">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] flex items-center justify-center text-[10px] font-black text-black/50 dark:text-white/50">
                      {i + 1}
                    </span>
                    <span className="text-xs text-black/65 dark:text-white/55 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function EmployeeChangelog() {
  const [activeTab, setActiveTab] = useState<"changelog" | "guide">("changelog");
  const { data: user } = useUser();

  const { data, isLoading, error, refetch } = useQuery<ChangelogData>({
    queryKey: ["/api/system/changelog"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-black/40 dark:text-white/40">
        <Package className="w-10 h-10" />
        <p className="text-sm">تعذّر تحميل بيانات الإصدار</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5 me-2" /> إعادة المحاولة
        </Button>
      </div>
    );
  }

  const latest = data.changelog[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-black dark:text-white tracking-tight">
              إصدارات النظام
            </h1>
            <p className="text-sm text-black/50 dark:text-white/45 mt-1">
              سجل التحديثات ودليل الموظفين
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
            data-testid="button-refresh-changelog"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Version badge */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-black dark:bg-white/[0.06] border border-black/10 dark:border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-white/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white dark:text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/60 dark:text-white/50 uppercase tracking-widest">الإصدار الحالي</p>
            <p className="text-lg font-black text-white dark:text-white leading-tight">v{data.version}</p>
            <p className="text-[11px] text-white/60 dark:text-white/50">
              آخر تحديث: {latest ? formatDate(latest.date) : "—"}
            </p>
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs text-white/70 dark:text-white/60 font-medium">{latest?.label}</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.04]">
        <button
          onClick={() => setActiveTab("changelog")}
          data-testid="tab-changelog"
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === "changelog"
              ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm"
              : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          سجل الإصدارات
        </button>
        <button
          onClick={() => setActiveTab("guide")}
          data-testid="tab-guide"
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === "guide"
              ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm"
              : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          دليل الموظفين
        </button>
      </div>

      {/* Changelog Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "changelog" && (
          <motion.div
            key="changelog"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3"
          >
            {/* Latest version features highlight */}
            {latest && (
              <div className="flex items-center gap-2 px-1 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {latest.features.filter(f => f.type === "new").length} ميزة جديدة في آخر إصدار
                </span>
                <span className="text-xs text-black/30 dark:text-white/30">·</span>
                <span className="text-xs text-black/40 dark:text-white/40">
                  {latest.features.filter(f => f.type === "fix").length} إصلاح
                </span>
              </div>
            )}

            {data.changelog.map((entry, i) => (
              <VersionCard key={entry.version} entry={entry} isLatest={i === 0} index={i} />
            ))}
          </motion.div>
        )}

        {/* Guide Tab */}
        {activeTab === "guide" && (
          <motion.div
            key="guide"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3"
          >
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">مرحباً يا {user?.fullName || "زميل"}!</p>
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/70 leading-relaxed">
                هذا الدليل مصمم خصيصاً لمساعدتك على الانطلاق بسرعة. اقرأه بالترتيب إذا كنت جديداً.
              </p>
            </div>

            {data.guide.map((section, i) => (
              <GuideSection key={i} section={section} index={i} />
            ))}

            <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-center">
              <p className="text-xs text-black/40 dark:text-white/40">
                هل لديك سؤال لا تجد إجابته هنا؟ تواصل مع فريق الدعم الداخلي عبر الرسائل
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
