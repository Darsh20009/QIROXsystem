import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ALL_TOOLS, CATEGORIES } from "@/pages/ToolPage";
import { Zap, Search, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function MyTools() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let tools = ALL_TOOLS;
    if (activeCategory) tools = tools.filter(t => t.cat === activeCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      tools = tools.filter(t =>
        t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      );
    }
    return tools;
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    if (activeCategory || search.trim()) return null;
    return CATEGORIES.map(cat => ({
      ...cat,
      tools: ALL_TOOLS.filter(t => t.cat === cat.id),
    })).filter(g => g.tools.length > 0);
  }, [activeCategory, search]);

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950" dir={dir}>
      <PageGraphics variant="dashboard" />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 dark:from-cyan-500/5 dark:to-blue-600/5 rounded-3xl blur-2xl -z-10" />
          <div className="bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-900/80 dark:to-gray-900/60 backdrop-blur-sm border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-black dark:text-white tracking-tight">{L ? "أدواتي ومميزاتي" : "My Tools & Features"}</h1>
                <p className="text-black/40 dark:text-white/40 text-sm mt-1">{L ? "مجموعة أدوات تقنية احترافية في مكان واحد" : "A suite of professional tech tools in one place"}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: L ? "إجمالي الأدوات" : "Total Tools", value: ALL_TOOLS.length, color: "text-cyan-500" },
                { label: L ? "الفئات" : "Categories", value: CATEGORIES.length, color: "text-blue-500" },
                { label: L ? "أدوات PDF" : "PDF Tools", value: ALL_TOOLS.filter(t=>t.cat==="pdf").length, color: "text-purple-500" },
                { label: L ? "مجاناً 100%" : "100% Free", value: "✓", color: "text-green-500" },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02]">
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className={`absolute ${L ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30`} />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={L ? "ابحث عن أداة..." : "Search for a tool..."}
                className={`${L ? "pr-10" : "pl-10"} bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.07] dark:border-white/[0.07]`}
                data-testid="input-tools-search"
              />
            </div>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              !activeCategory
                ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/30 dark:hover:border-white/30"
            }`}
            data-testid="btn-cat-all"
          >
            {L ? `الكل (${ALL_TOOLS.length})` : `All (${ALL_TOOLS.length})`}
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeCategory === cat.id
                  ? "bg-gradient-to-l " + cat.color + " text-white border-transparent shadow-sm"
                  : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/30 dark:hover:border-white/30"
              }`}
              data-testid={`btn-cat-${cat.id}`}
            >
              {cat.label.split(" ").slice(0,2).join(" ")} ({ALL_TOOLS.filter(t=>t.cat===cat.id).length})
            </button>
          ))}
        </motion.div>

        {/* Grid (Filtered) */}
        {(activeCategory || search.trim()) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-black/30 dark:text-white/30">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-semibold">{L ? "لم يتم إيجاد أدوات" : "No tools found"}</p>
                <p className="text-sm mt-1">{L ? "جرّب كلمة بحث مختلفة" : "Try a different search term"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((tool, i) => (
                  <ToolCard key={tool.id} tool={tool} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Grouped by Category */}
        {grouped && grouped.map((group, gi) => (
          <motion.div key={group.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * gi }} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`h-0.5 w-6 rounded-full bg-gradient-to-r ${group.color}`} />
              <h2 className="text-lg font-black text-black dark:text-white">{group.label}</h2>
              <span className="text-xs text-black/30 dark:text-white/30">({group.tools.length} {L ? "أدوات" : "tools"})</span>
              <div className={`flex-1 h-px bg-gradient-to-l from-transparent ${group.color} opacity-10`} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.tools.map((tool, i) => (
                <ToolCard key={tool.id} tool={tool} index={i} />
              ))}
            </div>
          </motion.div>
        ))}

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-black/25 dark:text-white/25 pb-4">
          <Star className="w-3 h-3" />
          <span>{L ? "جميع أدوات PDF تعمل محلياً على جهازك دون رفع ملفاتك للسيرفر" : "All PDF tools run locally on your device — your files never leave your browser"}</span>
          <Star className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

function ToolCard({ tool, index }: { tool: typeof ALL_TOOLS[0]; index: number }) {
  const ToolIcon = tool.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * (index % 12) }}>
      <Link href={`/my-tools/${tool.id}`} data-testid={`tool-card-${tool.id}`}>
        <div className="group relative p-5 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-950 hover:border-black/15 dark:hover:border-white/15 hover:shadow-md transition-all cursor-pointer overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity rounded-2xl`} />
          <div className="relative flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
              <ToolIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-black dark:text-white text-sm leading-tight">{tool.label}</span>
                {tool.badge && (
                  <Badge className={`text-[10px] px-1.5 py-0 bg-gradient-to-l ${tool.color} text-white border-0`}>{tool.badge}</Badge>
                )}
              </div>
              <p className="text-xs text-black/40 dark:text-white/40 mt-1 leading-relaxed line-clamp-2">{tool.desc}</p>
            </div>
          </div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
