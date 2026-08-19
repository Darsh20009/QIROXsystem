// ── DashboardV2 ───────────────────────────────────────────────────────────────
// Customer Dashboard V2. Fully implemented with live server-backed data.
// Gated behind FEATURE_DASHBOARD_V2. The existing /dashboard is untouched.
// Route: /dashboard-v2 (registered in App.tsx)
//
// Architecture:
//   JourneyV2Provider fetches /api/v2/customer/journey on mount, adapts the
//   server-computed CustomerJourneyState to the client JourneyState shape, and
//   passes it as `initialState` to JourneyProvider so every section in the
//   tree reads real database-backed journey progress instead of sessionStorage.

import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { JourneyProvider }           from "../context/journey-context";
import { WelcomeSection }            from "./sections/WelcomeSection";
import { ProgressSection }           from "./sections/ProgressSection";
import { NextActionSection }         from "./sections/NextActionSection";
import { ActiveProjectsSection }     from "./sections/ActiveProjectsSection";
import { TimelineSection }           from "./sections/TimelineSection";
import { TasksSection }              from "./sections/TasksSection";
import { FilesSection }              from "./sections/FilesSection";
import { QuotationsSection }         from "./sections/QuotationsSection";
import { InvoicesSection }           from "./sections/InvoicesSection";
import { PaymentsSection }           from "./sections/PaymentsSection";
import { MeetingsSection }           from "./sections/MeetingsSection";
import { NotificationsSection }      from "./sections/NotificationsSection";
import { SupportSection }            from "./sections/SupportSection";
import { CustomerKPIsSection }       from "./sections/CustomerKPIsSection";
import { AccountHealthSection }      from "./sections/AccountHealthSection";
import { RecentActivitySection }     from "./sections/RecentActivitySection";
import { QuickActionsSection }       from "./sections/QuickActionsSection";
import type { JourneyState }         from "../types";

// ── Server → Client state adapter ─────────────────────────────────────────────
// The server's CustomerJourneyState is a superset of the client JourneyState.
// We strip server-only fields (userId, source, step.order) to avoid type drift.

function adaptServerJourney(raw: any): JourneyState {
  const steps: JourneyState["steps"] = {};
  for (const [id, s] of Object.entries(raw.steps ?? {})) {
    const step = s as any;
    steps[id as keyof typeof steps] = {
      id:          step.id,
      status:      step.status,
      startedAt:   step.startedAt   ? new Date(step.startedAt)   : undefined,
      completedAt: step.completedAt ? new Date(step.completedAt) : undefined,
      meta:        step.meta ?? {},
    };
  }
  return {
    version:         1,
    activeStepId:    raw.activeStepId,
    steps,
    progressPercent: raw.progressPercent,
    isComplete:      raw.isComplete,
    updatedAt:       new Date(raw.updatedAt),
  };
}

// ── Journey V2 Provider — hydrates context from real API ──────────────────────

function JourneyV2Provider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery<JourneyState | null>({
    queryKey: ["/api/v2/customer/journey"],
    queryFn: async () => {
      const r = await fetch("/api/v2/customer/journey");
      if (!r.ok) return null; // flag off or not a client → fall back to local state
      const body = await r.json();
      return body.ok && body.journey ? adaptServerJourney(body.journey) : null;
    },
    staleTime: 30_000,
    retry: 1,
  });

  // While loading, render with no initial state (JourneyProvider creates fresh state)
  // Once loaded, pass server state as initialState so the context is hydrated once.
  // Key on the data ref so the provider re-mounts when server data arrives.
  return (
    <JourneyProvider key={isLoading ? "loading" : "ready"} initialState={data ?? undefined}>
      {children}
    </JourneyProvider>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardV2() {
  const { lang } = useI18n();
  const l = (lang as string) === "en" ? "en" : "ar";

  return (
    <JourneyV2Provider>
      <div
        className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24"
        dir={l === "ar" ? "rtl" : "ltr"}
      >
        {/* ── Sticky header ─────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-black/[0.04] dark:border-white/[0.04] px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-base font-bold text-black dark:text-white">
              {l === "ar" ? "لوحتي" : "My Dashboard"}
            </h1>
            <span className="text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.06] text-gray-400 px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/[0.06]">
              V2
            </span>
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">

          {/* 1. Welcome Center */}
          <WelcomeSection lang={l} />

          {/* 2. Quick Actions grid */}
          <QuickActionsSection lang={l} />

          {/* 3. Recommended Next Action — wired to /api/v2/customer/next-action */}
          <NextActionSection lang={l} />

          {/* 4. Customer KPIs */}
          <CustomerKPIsSection lang={l} />

          {/* 5. Account Health */}
          <AccountHealthSection lang={l} />

          {/* 6. Journey Progress — reads from JourneyV2Provider (server-backed) */}
          <section>
            <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
              {l === "ar" ? "رحلتك مع QIROX" : "Your QIROX Journey"}
            </h3>
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden bg-white dark:bg-gray-900">
              <ProgressSection lang={l} />
            </div>
          </section>

          {/* 7. Active Projects */}
          <ActiveProjectsSection lang={l} />

          {/* 8. Project Timeline */}
          <TimelineSection lang={l} />

          {/* 9. Tasks */}
          <TasksSection lang={l} />

          {/* 10. Files */}
          <FilesSection lang={l} />

          {/* 11. Quotations */}
          <QuotationsSection lang={l} />

          {/* 12. Invoices */}
          <InvoicesSection lang={l} />

          {/* 13. Payments & Wallet */}
          <PaymentsSection lang={l} />

          {/* 14. Meetings */}
          <MeetingsSection lang={l} />

          {/* 15. Recent Activity */}
          <RecentActivitySection lang={l} />

          {/* 16. Notifications */}
          <NotificationsSection lang={l} />

          {/* 17. Support */}
          <SupportSection lang={l} />

        </div>
      </div>
    </JourneyV2Provider>
  );
}
