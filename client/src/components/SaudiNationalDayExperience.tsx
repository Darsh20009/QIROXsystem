import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft, Minus, Plus, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { NATIONAL_DAY_CAMPAIGN } from "@shared/national-day";

const STORAGE_KEY = "qirox-national-day-campaign-collapsed";
const SPLASH_STORAGE_KEY = "qirox-national-day-splash-seen";

function getInitialCollapsed() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function isInternalPath(path: string) {
  return path.startsWith("/admin") || path.startsWith("/employee") || path.startsWith("/login") || path.startsWith("/auth");
}

export function SaudiNationalDayExperience() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [splashOpen, setSplashOpen] = useState(false);
  const { data: settings } = useQuery<any>({ queryKey: ["/api/public/settings"], staleTime: 30_000 });
  const campaignEnabled = settings?.nationalDayEnabled ?? NATIONAL_DAY_CAMPAIGN.enabled;
  const splashEnabled = settings?.nationalDaySplashEnabled ?? NATIONAL_DAY_CAMPAIGN.enabled;

  useEffect(() => {
    if (!campaignEnabled || !splashEnabled || isInternalPath(location)) {
      setSplashOpen(false);
      return;
    }
    try {
      if (window.sessionStorage.getItem(SPLASH_STORAGE_KEY) !== "1") setSplashOpen(true);
    } catch {
      setSplashOpen(true);
    }
  }, [campaignEnabled, splashEnabled, location]);

  function dismissSplash() {
    setSplashOpen(false);
    try { window.sessionStorage.setItem(SPLASH_STORAGE_KEY, "1"); } catch { /* embedded browsers may block storage */ }
  }

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Session storage can be unavailable in private or embedded browsers.
    }
  }

  if (!campaignEnabled) return null;

  return (
    <>
      {splashOpen && (
        <div className="qdx-overlay" role="dialog" aria-modal="true" aria-label="احتفال اليوم الوطني السعودي" dir="rtl">
          <div className="qdx-backdrop" onClick={dismissSplash} />
          <div className="qdx-modal">
            <button type="button" className="qdx-close" onClick={dismissSplash} aria-label="إغلاق">
              <X aria-hidden="true" />
            </button>
            <div className="qdx-media">
              <div className="qdx-media-image">
                <img src={NATIONAL_DAY_CAMPAIGN.flagSrc} alt={NATIONAL_DAY_CAMPAIGN.flagAlt} />
              </div>
              <span className="qdx-media-label">اليوم الوطني السعودي</span>
            </div>
            <div className="qdx-modal-body">
              <div className="qdx-eyebrow"><span /> عرض خاص بمناسبة اليوم الوطني</div>
              <h2>دام عزك<br /><em>يا وطن</em></h2>
              <p>{NATIONAL_DAY_CAMPAIGN.subtitle}</p>
              <div className="qdx-offer">
                <strong>{NATIONAL_DAY_CAMPAIGN.discountPercent}%</strong>
                <span>خصم على<br />جميع الباقات</span>
              </div>
              <Link href="/prices" className="qdx-primary" onClick={dismissSplash}>
                اكتشف الباقات <ChevronLeft aria-hidden="true" />
              </Link>
              <button type="button" className="qdx-secondary" onClick={dismissSplash}>متابعة للموقع</button>
            </div>
          </div>
        </div>
      )}
      <aside className={`qdx-root ${collapsed ? "is-collapsed" : ""}`} dir="rtl">
      {collapsed ? (
        <button
          type="button"
          className="qdx-collapsed"
          onClick={toggleCollapsed}
          aria-label="إظهار عرض اليوم الوطني"
          aria-expanded={false}
        >
          <img src={NATIONAL_DAY_CAMPAIGN.compactFlagSrc} alt={NATIONAL_DAY_CAMPAIGN.flagAlt} />
          <span>اليوم الوطني · خصم {NATIONAL_DAY_CAMPAIGN.discountPercent}%</span>
          <Plus aria-hidden="true" />
        </button>
      ) : (
        <div className="qdx-ribbon" aria-label="شارة اليوم الوطني السعودي">
          <div className="qdx-ribbon-mark">
            <img src={NATIONAL_DAY_CAMPAIGN.compactFlagSrc} alt={NATIONAL_DAY_CAMPAIGN.flagAlt} />
          </div>
          <div className="qdx-ribbon-copy">
            <span>اليوم الوطني السعودي</span>
            <strong>خصم {NATIONAL_DAY_CAMPAIGN.discountPercent}% على الباقات</strong>
          </div>
          <Link href="/prices" className="qdx-ribbon-link">
            اكتشف <ChevronLeft aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="qdx-ribbon-close"
            onClick={toggleCollapsed}
            aria-label="تصغير شارة اليوم الوطني"
            aria-expanded={true}
          >
            <Minus aria-hidden="true" />
          </button>
        </div>
      )}
      </aside>
    </>
  );
}

export default SaudiNationalDayExperience;