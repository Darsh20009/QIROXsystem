import { useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { NATIONAL_DAY_CAMPAIGN } from "@shared/national-day";

const STORAGE_KEY = "qirox-national-day-campaign-collapsed";

function getInitialCollapsed() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function SaudiNationalDayExperience() {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  if (!NATIONAL_DAY_CAMPAIGN.enabled) return null;

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Session storage can be unavailable in private or embedded browsers.
    }
  }

  return (
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
          <span>{NATIONAL_DAY_CAMPAIGN.discountPercent}%</span>
          <Plus aria-hidden="true" />
        </button>
      ) : (
        <div className="national-day-panel" aria-label="عرض اليوم الوطني السعودي">
          <div className="national-day-flag-wrap">
            <img src={NATIONAL_DAY_CAMPAIGN.flagSrc} alt={NATIONAL_DAY_CAMPAIGN.flagAlt} />
          </div>
          <div className="national-day-copy">
            <div className="national-day-heading">
              <p className="national-day-message">{NATIONAL_DAY_CAMPAIGN.message}</p>
              <button
                type="button"
                className="national-day-minimize"
                onClick={toggleCollapsed}
                aria-label="تصغير عرض اليوم الوطني"
                aria-expanded={true}
              >
                <Minus aria-hidden="true" />
              </button>
            </div>
            <p className="national-day-subtitle">{NATIONAL_DAY_CAMPAIGN.subtitle}</p>
            <div className="national-day-offer">
              <div className="national-day-offer-copy">
                <p className="national-day-offer-title">{NATIONAL_DAY_CAMPAIGN.title}</p>
                <p className="national-day-offer-occasion">بمناسبة اليوم الوطني</p>
                <p className="national-day-offer-detail">{NATIONAL_DAY_CAMPAIGN.offer}</p>
              </div>
              <strong>{NATIONAL_DAY_CAMPAIGN.discountPercent}%</strong>
            </div>
            <Link href="/prices" className="national-day-cta">
              {NATIONAL_DAY_CAMPAIGN.cta}
              <ChevronLeft aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}

export default SaudiNationalDayExperience;