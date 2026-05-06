import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
  const [step, setStep] = useState(0);

  const dismiss = () => {
    try { localStorage.setItem(IOS_DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  const steps = ar ? [
    { title: 'اضغط زر المشاركة ⬆', sub: 'في شريط Safari السفلي', color: '#007AFF' },
    { title: 'مرّر للأسفل في القائمة', sub: 'ابحث عن خيار الإضافة', color: '#34C759' },
    { title: 'اضغط «إضافة إلى الشاشة الرئيسية»', sub: 'ثم اضغط «إضافة» للتأكيد', color: '#c9a84c' },
  ] : [
    { title: 'Tap the Share button ⬆', sub: 'In the Safari bottom toolbar', color: '#007AFF' },
    { title: 'Scroll Down in the menu', sub: 'Look for the Add option', color: '#34C759' },
    { title: 'Tap "Add to Home Screen"', sub: 'Then tap "Add" to confirm', color: '#c9a84c' },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      dir={dir}
      style={{ animation: 'slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}
      data-testid="ios-install-banner">
      <style>{`@keyframes slideUpFade{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      {/* Backdrop */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

      <div className="bg-[#1c1c1e] rounded-t-[28px] shadow-2xl border-t border-white/[0.08] overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="px-5 pb-6 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center border border-white/10 shadow-lg">
                <span className="text-[#c9a84c] font-black text-lg">Q</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm" data-testid="ios-install-title">
                  {ar ? 'أضف كيروكس لشاشتك الرئيسية' : 'Add Qirox to your Home Screen'}
                </p>
                <p className="text-white/40 text-[11px] mt-0.5">
                  {ar ? 'لتجربة أفضل وإشعارات فورية' : 'For a better experience & instant notifications'}
                </p>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center hover:bg-white/[0.14] transition-colors"
              data-testid="ios-install-close">
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {/* Steps */}
          <div className="space-y-2 mb-4">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-all ${step === i ? 'bg-white/[0.1] border border-white/[0.12]' : 'bg-white/[0.04] border border-transparent'}`}>
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-xs shadow-md"
                  style={{ backgroundColor: s.color }}>
                  {i + 1}
                </div>
                <div className="text-right flex-1">
                  <p className="text-white text-xs font-semibold">{s.title}</p>
                  <p className="text-white/40 text-[10px]">{s.sub}</p>
                </div>
                {step === i && (
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                )}
              </button>
            ))}
          </div>

          {/* Step visual */}
          {step === 0 && (
            <div className="bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06] flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#007AFF]/20 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="text-white/70 text-xs">
                {ar ? 'زر المشاركة يبدو هكذا — موجود في شريط أدوات Safari السفلي' : 'This is the Share button — find it in the Safari bottom toolbar'}
              </p>
            </div>
          )}
          {step === 1 && (
            <div className="bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06] flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#34C759]/20 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <p className="text-white/70 text-xs">
                {ar ? 'مرر قائمة الخيارات لأسفل حتى تجد خيار الإضافة للشاشة' : 'Scroll the share sheet down until you see the Add to Home Screen option'}
              </p>
            </div>
          )}
          {step === 2 && (
            <div className="bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06] flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#c9a84c]/20 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.2">
                  <rect x="3" y="3" width="18" height="18" rx="4"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <p className="text-white/70 text-xs">
                {ar ? 'اضغط على «إضافة إلى الشاشة الرئيسية» ثم «إضافة» في الزاوية العلوية' : 'Tap "Add to Home Screen" then tap "Add" in the top corner'}
              </p>
            </div>
          )}

          {/* Dismiss link */}
          <button
            className="w-full text-white/25 text-xs py-1 hover:text-white/40 transition-colors"
            onClick={dismiss}
            data-testid="ios-install-later">
            {ar ? 'لاحقاً' : 'Maybe later'}
          </button>
        </div>
      </div>
    </div>
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
    <div
      className="fixed inset-0 z-50 flex items-end"
      dir={dir}
      data-testid="pwa-install-sheet">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full rounded-t-[32px] bg-white overflow-hidden shadow-2xl"
        style={{ animation: 'slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}>
        <style>{`@keyframes slideUpFade{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-black/10 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* App identity */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-3xl bg-black flex items-center justify-center shadow-xl">
              <span className="text-[#c9a84c] font-black text-3xl">Q</span>
            </div>
            <div className="flex-1">
              <p className="font-black text-black text-lg leading-tight">
                {ar ? 'تثبيت نظام كيروكس' : 'Install Qirox'}
              </p>
              <p className="text-black/40 text-xs mt-0.5">
                {ar ? 'على جهازك — بدون متجر التطبيقات' : 'On your device — no app store needed'}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="#c9a84c"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                ))}
                <span className="text-black/30 text-[9px] font-medium">5.0</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/[0.06] flex items-center justify-center"
              data-testid="pwa-install-close">
              <X className="w-4 h-4 text-black/40" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-black/[0.06] mb-4" />

          {/* Features */}
          <div className="space-y-2.5 mb-5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg w-7 text-center">{f.icon}</span>
                <p className="text-sm text-black/70 font-medium">{f.text}</p>
              </div>
            ))}
          </div>

          {/* Size info */}
          <p className="text-black/30 text-[11px] mb-4 text-center">
            {ar ? '٢.١ ميغابايت فقط — لا يشغل مساحة كبيرة' : '2.1 MB only — takes minimal space'}
          </p>

          {/* Install button */}
          <button
            onClick={onInstall}
            className="w-full bg-black text-white font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2.5 shadow-xl active:scale-[0.98] transition-transform"
            data-testid="android-install-button">
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
            data-testid="pwa-install-later">
            {ar ? 'لاحقاً' : 'Maybe later'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

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
    if (outcome === 'accepted') {
      setInstalled(true);
      setTimeout(() => setShowPrompt(false), 2000);
    }
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
