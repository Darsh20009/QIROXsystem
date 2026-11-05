import { useState, useEffect, useRef } from 'react';
import { X, Share, Plus, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

const IOS_DISMISS_KEY = 'qirox_ios_install_dismissed';
const IOS_DISMISS_DAYS = 7;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  return false;
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as NavigatorStandalone;
  return (nav.standalone === true) || window.matchMedia('(display-mode: standalone)').matches;
}

function isIOSSafari(): boolean {
  if (!isIOS()) return false;
  const ua = navigator.userAgent;
  if (!/Safari/i.test(ua)) return false;
  if (/CriOS|FxiOS|EdgiOS|OPiOS|OPRiOS|DuckDuckGo|GSA|FBAN|FBAV|Instagram|Twitter|LinkedIn/i.test(ua)) return false;
  return true;
}

function wasIOSDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(IOS_DISMISS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (isNaN(ts)) return false;
    return (Date.now() - ts) / (1000 * 60 * 60 * 24) < IOS_DISMISS_DAYS;
  } catch {
    return false;
  }
}

// ─── iOS Install Guide ────────────────────────────────────────────────────────
function IOSInstallBanner() {
  const { lang, dir } = useI18n();
  const ar = lang === 'ar';
  const [visible, setVisible] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveStep(s => (s + 1) % 3);
    }, 2200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(IOS_DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  const steps = ar ? [
    {
      num: '1',
      title: 'اضغط زر المشاركة',
      sub: 'في شريط Safari السفلي',
      color: '#007AFF',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      ),
    },
    {
      num: '2',
      title: 'مرّر للأسفل في القائمة',
      sub: 'ابحث عن خيار الإضافة',
      color: '#34C759',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      ),
    },
    {
      num: '3',
      title: '«إضافة إلى الشاشة الرئيسية»',
      sub: 'ثم اضغط «إضافة» للتأكيد',
      color: '#c9a84c',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
    },
  ] : [
    {
      num: '1',
      title: 'Tap the Share button',
      sub: 'In the Safari bottom toolbar',
      color: '#007AFF',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      ),
    },
    {
      num: '2',
      title: 'Scroll down in the menu',
      sub: 'Look for the Add option',
      color: '#34C759',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      ),
    },
    {
      num: '3',
      title: '"Add to Home Screen"',
      sub: 'Then tap "Add" to confirm',
      color: '#c9a84c',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
    },
  ];

  const active = steps[activeStep];

  return (
    <>
      <style>{`
        @keyframes iosSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes iosPulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.12); opacity: 0.8; }
        }
        @keyframes iosShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes iosBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        .ios-shimmer {
          background: linear-gradient(90deg, #c9a84c 0%, #f5d07a 40%, #c9a84c 60%, #a07830 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: iosShimmer 3s linear infinite;
        }
        .ios-step-active { animation: iosPulse 2.2s ease-in-out infinite; }
        .ios-arrow-bounce { animation: iosBounce 1.2s ease-in-out infinite; }
      `}</style>

      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        dir={dir}
        style={{ animation: 'iosSlideUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards' }}
        data-testid="ios-install-banner"
      >
        {/* soft shadow veil above sheet */}
        <div className="absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

        <div className="relative bg-[#111113] rounded-t-[32px] shadow-[0_-8px_48px_rgba(0,0,0,0.7)] border-t border-white/[0.07] overflow-hidden">

          {/* decorative ambient glow behind icon */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-[#c9a84c]/10 blur-3xl pointer-events-none" />

          {/* handle */}
          <div className="flex justify-center pt-3 pb-0">
            <div className="w-9 h-[3px] bg-white/15 rounded-full" />
          </div>

          <div className="px-5 pt-4 pb-6">

            {/* ── Header ── */}
            <div className="flex items-center gap-3.5 mb-5">
              {/* App icon — real logo */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-[18px] overflow-hidden shadow-[0_4px_20px_rgba(201,168,76,0.35)] ring-1 ring-white/10">
                  <img src="/qirox-icon.png" alt="كيروكس" className="w-full h-full object-cover" />
                </div>
                {/* gold dot badge */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#c9a84c] border-2 border-[#111113] flex items-center justify-center">
                  <Plus className="w-2.5 h-2.5 text-black" strokeWidth={3} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-[15px] leading-snug" data-testid="ios-install-title">
                  <span className="ios-shimmer">{ar ? 'كيروكس' : 'Qirox'}</span>
                  &nbsp;
                  <span className="text-white">{ar ? '— أضفه لشاشتك' : '— Add to Home Screen'}</span>
                </p>
                <p className="text-white/40 text-[11px] mt-0.5 leading-relaxed">
                  {ar ? 'تجربة تطبيق حقيقي بدون متجر التطبيقات' : 'Real app experience — no App Store needed'}
                </p>
              </div>

              <button
                onClick={dismiss}
                className="shrink-0 w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center"
                data-testid="ios-install-close"
              >
                <X className="w-3.5 h-3.5 text-white/40" />
              </button>
            </div>

            {/* ── Visual step indicator (animated) ── */}
            <div
              className="relative rounded-2xl mb-4 overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#1a1a1c 0%,#1e1e22 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* glow accent matching active step */}
              <div
                className="absolute inset-0 opacity-20 transition-all duration-700"
                style={{ background: `radial-gradient(ellipse at 50% 120%, ${active.color}55 0%, transparent 70%)` }}
              />

              <div className="relative flex items-center gap-3.5 px-4 py-3.5">
                {/* animated step icon */}
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ios-step-active transition-all duration-500"
                  style={{ background: `${active.color}22`, color: active.color, border: `1.5px solid ${active.color}44` }}
                >
                  {active.icon}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center"
                      style={{ background: active.color, color: '#000' }}
                    >
                      {active.num}
                    </span>
                    <p className="text-white font-bold text-xs">{active.title}</p>
                  </div>
                  <p className="text-white/40 text-[10px]">{active.sub}</p>
                </div>

                {/* progress dots */}
                <div className="flex flex-col gap-1 shrink-0">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === activeStep ? 6 : 4,
                        height: i === activeStep ? 6 : 4,
                        background: i === activeStep ? active.color : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Steps list ── */}
            <div className="flex gap-2 mb-5">
              {steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveStep(i);
                    if (intervalRef.current) clearInterval(intervalRef.current);
                  }}
                  className="flex-1 flex flex-col items-center gap-1.5 rounded-xl py-2.5 px-1 transition-all duration-300"
                  style={{
                    background: activeStep === i ? `${s.color}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${activeStep === i ? s.color + '44' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black transition-all duration-300"
                    style={{
                      background: activeStep === i ? s.color : 'rgba(255,255,255,0.08)',
                      color: activeStep === i ? '#000' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div
                    className="text-[9px] font-semibold text-center leading-tight transition-colors duration-300"
                    style={{ color: activeStep === i ? s.color : 'rgba(255,255,255,0.3)' }}
                  >
                    {ar
                      ? ['مشاركة ⬆', 'مرر لأسفل', 'إضافة ➕'][i]
                      : ['Share ⬆', 'Scroll', 'Add ➕'][i]}
                  </div>
                </button>
              ))}
            </div>

            {/* ── Safari toolbar hint ── */}
            <div
              className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="ios-arrow-bounce shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="text-white/50 text-[11px] leading-relaxed flex-1">
                {ar
                  ? 'زر المشاركة موجود في شريط أدوات Safari أسفل الشاشة'
                  : 'The Share button is in the Safari toolbar at the bottom of the screen'}
              </p>
            </div>

            {/* ── Dismiss ── */}
            <button
              className="w-full text-white/20 text-xs py-1 hover:text-white/40 transition-colors"
              onClick={dismiss}
              data-testid="ios-install-later"
            >
              {ar ? 'لاحقاً' : 'Maybe later'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── PWA Install Prompt ───────────────────────────────────────────────────────
function PWAInstallSheet({ onInstall, onClose }: { onInstall: () => void; onClose: () => void }) {
  const { lang, dir } = useI18n();
  const ar = lang === 'ar';

  const features = ar ? [
    { icon: '📲', text: 'وصول سريع من الشاشة الرئيسية — بدون متصفح' },
    { icon: '🔔', text: 'إشعارات فورية لمشروعك وعقودك' },
    { icon: '🌐', text: 'يعمل جزئياً بدون إنترنت' },
    { icon: '⚡', text: 'تحديثات تلقائية دائماً' },
  ] : [
    { icon: '📲', text: 'Quick home screen access — no browser needed' },
    { icon: '🔔', text: 'Instant notifications for your project & contracts' },
    { icon: '🌐', text: 'Works partially offline' },
    { icon: '⚡', text: 'Always auto-updated' },
  ];

  return (
    <>
      <style>{`
        @keyframes pwaSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes pwaShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .pwa-shimmer {
          background: linear-gradient(90deg,#000 0%,#444 40%,#000 60%,#222 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: pwaShimmer 3s linear infinite;
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-end"
        dir={dir}
        data-testid="pwa-install-sheet"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div
          className="relative w-full rounded-t-[32px] bg-white overflow-hidden shadow-2xl"
          style={{ animation: 'pwaSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-[3px] bg-black/10 rounded-full" />
          </div>

          <div className="px-5 pb-8 pt-3">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/10">
                  <img src="/qirox-icon.png" alt="كيروكس" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#c9a84c] border-2 border-white flex items-center justify-center">
                  <Plus className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-black text-black text-lg leading-tight">
                  {ar ? 'تثبيت نظام كيروكس' : 'Install Qirox'}
                </p>
                <p className="text-black/40 text-xs mt-0.5">
                  {ar ? 'على جهازك — بدون متجر التطبيقات' : 'On your device — no app store needed'}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="#c9a84c"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ))}
                  <span className="text-black/30 text-[9px] font-medium ms-0.5">5.0</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-black/[0.06] flex items-center justify-center shrink-0"
                data-testid="pwa-install-close"
              >
                <X className="w-4 h-4 text-black/40" />
              </button>
            </div>

            <div className="h-px bg-black/[0.06] mb-4" />

            <div className="space-y-2.5 mb-5">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{f.icon}</span>
                  <p className="text-sm text-black/70 font-medium">{f.text}</p>
                </div>
              ))}
            </div>

            <p className="text-black/30 text-[11px] mb-4 text-center">
              {ar ? '٢.١ ميغابايت فقط — لا يشغل مساحة كبيرة' : '2.1 MB only — takes minimal space'}
            </p>

            <button
              onClick={onInstall}
              className="w-full bg-black text-white font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2.5 shadow-xl active:scale-[0.98] transition-transform"
              data-testid="android-install-button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {ar ? 'تثبيت الآن' : 'Install Now'}
            </button>

            <button
              onClick={onClose}
              className="w-full text-black/30 font-medium py-3 text-sm mt-1 hover:text-black/50 transition-colors"
              data-testid="pwa-install-later"
            >
              {ar ? 'لاحقاً' : 'Maybe later'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    if (isIOS() && isIOSSafari() && !isInStandaloneMode() && !wasIOSDismissedRecently()) {
      const timer = setTimeout(() => setShowIOSPrompt(true), 2500);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const timer = setTimeout(() => setShowPrompt(true), 2500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setTimeout(() => setShowPrompt(false), 2000);
    setDeferredPrompt(null);
  };

  if (showIOSPrompt) return <IOSInstallBanner />;
  if (!showPrompt) return null;

  return (
    <PWAInstallSheet
      onInstall={handleInstall}
      onClose={() => setShowPrompt(false)}
    />
  );
}
