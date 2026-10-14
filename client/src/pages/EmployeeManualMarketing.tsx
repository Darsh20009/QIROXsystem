import { PageGraphics } from "@/components/AnimatedPageGraphics";
import ManualMarketingPanel from "@/components/ManualMarketingPanel";

export default function EmployeeManualMarketing() {
  return (
    <div className="relative mx-auto max-w-[1400px] space-y-5 p-4 md:p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <ManualMarketingPanel />
    </div>
  );
}
