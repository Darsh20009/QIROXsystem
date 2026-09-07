// ── OpportunitiesBoard ────────────────────────────────────────────────────────
// Sprint 008 — CRM V2. Pipeline V2 — Kanban view of opportunities by stage.
// Behind FEATURE_CRM_V2.

import { useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Plus, RefreshCw } from "lucide-react";
import { usePipeline, useUpdateOpportunity, useCreatePipelineStage } from "../hooks/useCrmV2";
import { useQueryClient } from "@tanstack/react-query";

interface OpportunitiesBoardProps {
  lang?: "ar" | "en";
}

function OppCard({ opp, isAr, onMove, stages }: {
  opp: any; isAr: boolean;
  onMove: (oppId: string, stageId: string) => void;
  stages: any[];
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-3 space-y-2"
    >
      <p className="text-xs font-medium text-black dark:text-white leading-tight">
        {opp.title}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-black dark:text-white">
          {Number(opp.value || 0).toLocaleString()} {opp.currency || "SAR"}
        </span>
        <Badge variant="outline" className="text-[9px] h-4 px-1 border-black/10 dark:border-white/10">
          {opp.probability}%
        </Badge>
      </div>
      {opp.subjectName && (
        <p className="text-[10px] text-gray-400">{opp.subjectName}</p>
      )}
      {opp.assignedToName && (
        <p className="text-[10px] text-gray-400">{opp.assignedToName}</p>
      )}
      {opp.expectedCloseAt && (
        <p className="text-[10px] text-gray-400">
          {isAr ? "إغلاق:" : "Close:"} {new Date(opp.expectedCloseAt).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
        </p>
      )}
      {/* Quick move buttons */}
      {stages.length > 1 && (
        <div className="flex gap-1 flex-wrap pt-1">
          {stages
            .filter((s: any) => s.id !== opp.stageId)
            .map((s: any) => (
              <button
                key={s.id}
                onClick={() => onMove(opp.id, s.id)}
                className="text-[9px] px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10 text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
              >
                → {isAr ? (s.nameAr || s.name) : s.name}
              </button>
            ))}
        </div>
      )}
    </motion.div>
  );
}

export function OpportunitiesBoard({ lang = "ar" }: OpportunitiesBoardProps) {
  const isAr = lang === "ar";
  const { data, isLoading } = usePipeline();
  const updateOpp = useUpdateOpportunity();
  const createStage = useCreatePipelineStage();
  const qc = useQueryClient();

  const [showAddStage, setShowAddStage] = useState(false);
  const [stageName, setStageName] = useState("");

  async function handleAddStage() {
    if (!stageName.trim()) return;
    const slug = stageName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    await createStage.mutateAsync({ name: stageName.trim(), slug, color: "#000000", sortOrder: (data?.stages?.length ?? 0) });
    setStageName(""); setShowAddStage(false);
  }

  async function handleMove(oppId: string, stageId: string) {
    await updateOpp.mutateAsync({ id: oppId, stageId });
  }

  const stages = data?.stages ?? [];
  const totalValue = data?.totalValue ?? 0;
  const weightedValue = data?.weightedValue ?? 0;

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: isAr ? "إجمالي الفرص" : "Total Deals",       value: data?.totalOpportunities ?? 0, suffix: "" },
          { label: isAr ? "قيمة الخط" : "Pipeline Value",        value: totalValue.toLocaleString(),   suffix: " SAR" },
          { label: isAr ? "القيمة الموزونة" : "Weighted Value",   value: Math.round(weightedValue).toLocaleString(), suffix: " SAR" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-3 text-center">
            {isLoading ? <Skeleton className="h-6 w-12 mx-auto" /> : (
              <p className="text-base font-bold text-black dark:text-white">{s.value}<span className="text-[10px] font-normal text-gray-400">{s.suffix}</span></p>
            )}
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-semibold text-black dark:text-white">
            {isAr ? "خط المبيعات V2" : "Sales Pipeline V2"}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAddStage(v => !v)}
          >
            <Plus className="w-3 h-3" />
            {isAr ? "مرحلة" : "Stage"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={() => qc.invalidateQueries({ queryKey: ["/api/v2/crm", "pipeline"] })}
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Add Stage form */}
      {showAddStage && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={stageName}
            onChange={e => setStageName(e.target.value)}
            placeholder={isAr ? "اسم المرحلة..." : "Stage name..."}
            className="flex-1 h-8 px-3 text-xs rounded-md border border-input bg-background"
            onKeyDown={e => e.key === "Enter" && handleAddStage()}
          />
          <Button size="sm" className="h-8 text-xs" onClick={handleAddStage} disabled={createStage.isPending || !stageName.trim()}>
            {isAr ? "إضافة" : "Add"}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowAddStage(false)}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      )}

      {/* Kanban Columns */}
      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-56">
              <Skeleton className="h-8 w-full rounded-lg mb-2" />
              <Skeleton className="h-20 w-full rounded-lg mb-2" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : stages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/[0.1] dark:border-white/[0.1] p-8 flex flex-col items-center gap-3 text-center">
          <Target className="w-8 h-8 text-gray-200 dark:text-gray-700" />
          <p className="text-sm font-medium text-gray-400">
            {isAr ? "لا توجد مراحل بعد — أضف أول مرحلة للخط" : "No stages yet — add the first pipeline stage"}
          </p>
          <Button
            size="sm"
            className="text-xs gap-1"
            onClick={() => setShowAddStage(true)}
          >
            <Plus className="w-3 h-3" />
            {isAr ? "أضف مرحلة" : "Add Stage"}
          </Button>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage: any) => {
            const stageOpps = stage.opportunities ?? [];
            const stageValue = stageOpps.reduce((s: number, o: any) => s + (o.value || 0), 0);
            return (
              <div key={stage.id} className="flex-shrink-0 w-56">
                {/* Stage header */}
                <div
                  className="rounded-t-xl border border-b-0 border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 px-3 py-2"
                  style={{ borderTopColor: stage.color }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-black dark:text-white truncate">
                      {isAr ? (stage.nameAr || stage.name) : stage.name}
                    </p>
                    <span className="text-[10px] text-gray-400 bg-black/[0.04] dark:bg-white/[0.06] rounded-full px-1.5">
                      {stageOpps.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {stageValue.toLocaleString()} SAR
                  </p>
                </div>

                {/* Cards */}
                <div className="border border-t-0 border-black/[0.06] dark:border-white/[0.06] rounded-b-xl bg-gray-50 dark:bg-gray-950 p-2 space-y-2 min-h-[120px]">
                  {stageOpps.map((opp: any) => (
                    <OppCard
                      key={opp.id}
                      opp={opp}
                      isAr={isAr}
                      onMove={handleMove}
                      stages={stages}
                    />
                  ))}
                  {stageOpps.length === 0 && (
                    <p className="text-[10px] text-gray-300 dark:text-gray-700 text-center py-4">
                      {isAr ? "لا توجد فرص" : "No deals"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
