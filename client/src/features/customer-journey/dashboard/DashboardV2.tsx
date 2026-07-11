// ── DashboardV2 ───────────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// New dashboard shell for Customer Journey V2.
// Gated behind FEATURE_DASHBOARD_V2. The existing /dashboard is untouched.
// Route: /dashboard-v2 (registered in App.tsx, guards applied there)

import { useI18n } from "@/lib/i18n";
import { JourneyProvider } from "../context/journey-context";
import { WelcomeSection }          from "./sections/WelcomeSection";
import { ProgressSection }         from "./sections/ProgressSection";
import { NextActionSection }       from "./sections/NextActionSection";
import { ActiveProjectsSection }   from "./sections/ActiveProjectsSection";
import { TasksSection }            from "./sections/TasksSection";
import { FilesSection }            from "./sections/FilesSection";
import { QuotationsSection }       from "./sections/QuotationsSection";
import { InvoicesSection }         from "./sections/InvoicesSection";
import { MeetingsSection }         from "./sections/MeetingsSection";
import { NotificationsSection }    from "./sections/NotificationsSection";
import { SupportSection }          from "./sections/SupportSection";

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardV2() {
  const { lang } = useI18n();
  const l = (lang as string) === "en" ? "en" : "ar";

  return (
    // JourneyProvider supplies journey state to all child sections
    <JourneyProvider>
      <div
        className="min-h-screen bg-white dark:bg-gray-950 pb-20"
        dir={l === "ar" ? "rtl" : "ltr"}
      >
        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-black/[0.04] dark:border-white/[0.04] px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-base font-bold text-black dark:text-white">
              {l === "ar" ? "لوحتي — V2" : "My Dashboard — V2"}
            </h1>
            <span className="text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.06] text-gray-400 px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/[0.06]">
              BETA
            </span>
          </div>
        </div>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

          {/* 1. Welcome greeting */}
          <WelcomeSection lang={l} />

          {/* 2. Next recommended action (CTA Engine) */}
          <NextActionSection lang={l} />

          {/* 3. Journey progress timeline */}
          <section>
            <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
              {l === "ar" ? "رحلتك مع QIROX" : "Your QIROX Journey"}
            </h3>
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden bg-white dark:bg-gray-900">
              <ProgressSection lang={l} />
            </div>
          </section>

          {/* 4. Active projects */}
          <ActiveProjectsSection lang={l} />

          {/* 5. Tasks */}
          <TasksSection lang={l} />

          {/* 6. Files */}
          <FilesSection lang={l} />

          {/* 7. Quotations */}
          <QuotationsSection lang={l} />

          {/* 8. Invoices */}
          <InvoicesSection lang={l} />

          {/* 9. Meetings */}
          <MeetingsSection lang={l} />

          {/* 10. Notifications */}
          <NotificationsSection lang={l} />

          {/* 11. Support */}
          <SupportSection lang={l} />

        </div>
      </div>
    </JourneyProvider>
  );
}
