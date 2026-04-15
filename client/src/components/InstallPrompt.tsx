import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { Button } from './ui/button';
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
  return (nav.standalone === true)
    || window.matchMedia('(display-mode: standalone)').matches;
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
    const daysSince = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return daysSince < IOS_DISMISS_DAYS;
  } catch {
    return false;
  }
}

function IOSInstallBanner() {
  const { lang } = useI18n();
  const ar = lang === 'ar';

  const dismiss = () => {
    try { localStorage.setItem(IOS_DISMISS_KEY, String(Date.now())); } catch {}
  };

  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500"
      dir={ar ? 'rtl' : 'ltr'}
      data-testid="ios-install-banner"
    >
      <div className="bg-[#1c1c1e] text-white p-5 rounded-2xl shadow-2xl max-w-sm mx-auto border border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-white/10 p-2 rounded-xl">
                <Download className="w-5 h-5 text-[#FFD700]" />
              </div>
              <span className="absolute -top-1 -end-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1c1c1e] animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm" data-testid="ios-install-title">
                {ar ? 'ثبّت التطبيق لتصلك الإشعارات' : 'Install App to Get Notifications'}
              </h4>
              <p className="text-[11px] text-white/50 mt-0.5">
                {ar ? 'عقود • فواتير • تحديثات المشروع' : 'Contracts • Invoices • Project updates'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-white/10 hover:text-white -mt-1 -me-1"
            onClick={() => { dismiss(); setVisible(false); }}
            data-testid="ios-install-close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-white/[0.06] rounded-xl px-3 py-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 shrink-0">
              <Share className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <span className="text-xs text-white/90 leading-tight">
                {ar
                  ? <>اضغط على زر <strong className="text-blue-400">المشاركة</strong> <span className="inline-block rotate-180">⬆</span> في الأسفل</>
                  : <>Tap the <strong className="text-blue-400">Share</strong> button <span className="inline-block">⬆</span> below</>}
              </span>
            </div>
            <span className="text-white/30 font-bold text-xs">1</span>
          </div>

          <div className="flex items-center gap-3 bg-white/[0.06] rounded-xl px-3 py-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/20 shrink-0">
              <PlusSquare className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1">
              <span className="text-xs text-white/90 leading-tight">
                {ar
                  ? <>اختر <strong className="text-green-400">إضافة إلى الشاشة الرئيسية</strong></>
                  : <>Select <strong className="text-green-400">Add to Home Screen</strong></>}
              </span>
            </div>
            <span className="text-white/30 font-bold text-xs">2</span>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="w-full mt-3 text-white/40 hover:text-white/60 hover:bg-white/5 text-xs h-8"
          onClick={() => { dismiss(); setVisible(false); }}
          data-testid="ios-install-later"
        >
          {ar ? 'لاحقاً' : 'Maybe later'}
        </Button>
      </div>
    </div>
  );
}

export default function InstallPrompt() {
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    if (isIOS() && isIOSSafari() && !isInStandaloneMode() && !wasIOSDismissedRecently()) {
      const timer = setTimeout(() => setShowIOSPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (showIOSPrompt) return <IOSInstallBanner />;

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500" dir={ar ? 'rtl' : 'ltr'}>
      <div className="bg-primary text-white p-4 rounded-xl shadow-2xl max-w-sm flex items-center gap-4 border border-white/10">
        <div className="bg-white/10 p-2 rounded-lg">
           <Download className="w-6 h-6 text-secondary" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm">{ar ? 'تثبيت التطبيق' : 'Install App'}</h4>
          <p className="text-xs text-slate-300 mt-1">{ar ? 'احصل على تجربة أفضل بتثبيت التطبيق على جهازك.' : 'Get a better experience by installing the app on your device.'}</p>
        </div>
        <div className="flex gap-2">
           <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10 hover:text-white" onClick={() => setShowPrompt(false)}>
             <X className="w-4 h-4" />
           </Button>
           <Button size="sm" onClick={handleInstall} className="bg-secondary hover:bg-secondary/90 text-primary font-bold h-8 px-3" data-testid="android-install-button">
             {ar ? 'تثبيت' : 'Install'}
           </Button>
        </div>
      </div>
    </div>
  );
}
