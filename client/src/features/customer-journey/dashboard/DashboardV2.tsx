// ── DashboardV2 ───────────────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. Fully implemented.
// Gated behind FEATURE_DASHBOARD_V2. The existing /dashboard is untouched.
// Route: /dashboard-v2 (registered in App.tsx, guards applied there)
//
// Sections:
//   1. Welcome Center          — greeting + live KPI pills
//   2. Quick Actions           — 8-tile action grid
//   3. Recommended Next Action — CTA Engine
//   4. Customer KPIs           — 4 metric cards
//   5. Account Health          — health score bar
//   6. Journey Progress        — 11-step timeline
//   7. Active Projects         — live projects with progress bars
//   8. Timeline                — project phase timeline
//   9. Tasks                   — project issues/tasks
//  10. Files                   — project deliverable files
//  11. Quotations              — price quotes from team
//  12. Invoices                — billing invoices
//  13. Payments                — wallet balance + transactions
//  14. Meetings                — scheduled QMeet sessions
//  15. Recent Activity         — notification activity feed
//  16. Notifications           — full notification list
//  17. Support                 — support channels panel

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

export default function DashboardV2() {
  const { lang } = useI18n();
  const l = (lang as string) === "en" ? "en" : "ar";

  return (
    <JourneyProvider>
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
              V2 · BETA
            </span>
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">

          {/* 1. Welcome Center */}
          <WelcomeSection lang={l} />

          {/* 2. Quick Actions grid */}
          <QuickActionsSection lang={l} />

          {/* 3. Recommended Next Action (CTA Engine) */}
          <NextActionSection lang={l} />

          {/* 4. Customer KPIs */}
          <CustomerKPIsSection lang={l} />

          {/* 5. Account Health */}
          <AccountHealthSection lang={l} />

          {/* 6. Journey Progress */}
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
    </JourneyProvider>
  );
}
