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
        <div className="national-day-splash" role="dialog" aria-modal="true" aria-label="احتفال اليوم الوطني السعودي" dir="rtl">
          <div className="national-day-splash-backdrop" onClick={dismissSplash} />
          <div className="national-day-splash-card">
            <button type="button" className="national-day-splash-close" onClick={dismissSplash} aria-label="إغلاق">
              <X aria-hidden="true" />
            </button>
            <div className="national-day-splash-visual">
              <span className="national-day-splash-stamp">السعودية<br />في القلب</span>
              <div className="national-day-splash-flag">
                <img src={NATIONAL_DAY_CAMPAIGN.flagSrc} alt={NATIONAL_DAY_CAMPAIGN.flagAlt} />
              </div>
              <span className="national-day-splash-year">احتفال وطني</span>
            </div>
            <div className="national-day-splash-content">
              <span className="national-day-splash-kicker">احتفالًا باليوم الوطني السعودي</span>
              <h2>دام عزك<br /><em>يا وطن</em></h2>
              <p>نحتفل معك بعز الوطن بعرض خاص على جميع الباقات.</p>
              <div className="national-day-splash-offer">
                <div><small>خصم اليوم الوطني</small><strong>{NATIONAL_DAY_CAMPAIGN.discountPercent}%</strong></div>
                <span>على جميع<br />الباقات</span>
              </div>
              <div className="national-day-splash-actions">
                <Link href="/prices" className="national-day-splash-cta" onClick={dismissSplash}>
                  اكتشف الباقات <ChevronLeft aria-hidden="true" />
                </Link>
                <button type="button" className="national-day-splash-skip" onClick={dismissSplash}>متابعة للموقع</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <aside className={`national-day-experience ${collapsed ? "is-collapsed" : ""}`} dir="rtl">
      {collapsed ? (
        <button
          type="button"
          className="national-day-collapsed"
          onClick={toggleCollapsed}
          aria-label="إظهار عرض اليوم الوطني"
          aria-expanded={false}
        >
          <img src={NATIONAL_DAY_CAMPAIGN.compactFlagSrc} alt={NATIONAL_DAY_CAMPAIGN.flagAlt} />
          <span>اليوم الوطني · {NATIONAL_DAY_CAMPAIGN.discountPercent}%</span>
          <Plus aria-hidden="true" />
        </button>
      ) : (
        <div className="national-day-badge" aria-label="شارة اليوم الوطني السعودي">
          <div className="national-day-badge-copy">
            <span className="national-day-badge-kicker">احتفالًا باليوم الوطني</span>
            <strong>دام عزك يا وطن</strong>
            <Link href="/prices" className="national-day-badge-link">
              اكتشف الباقات <ChevronLeft aria-hidden="true" />
            </Link>
          </div>
          <div className="national-day-badge-discount">
            <span>خصم</span>
            <strong>{NATIONAL_DAY_CAMPAIGN.discountPercent}%</strong>
          </div>
          <div className="national-day-badge-flag">
            <img src={NATIONAL_DAY_CAMPAIGN.compactFlagSrc} alt={NATIONAL_DAY_CAMPAIGN.flagAlt} />
          </div>
          <button
            type="button"
            className="national-day-minimize"
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