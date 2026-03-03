import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui/button';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
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

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-primary text-white p-4 rounded-xl shadow-2xl max-w-sm flex items-center gap-4 border border-white/10">
        <div className="bg-white/10 p-2 rounded-lg">
           <Download className="w-6 h-6 text-secondary" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm">تثبيت التطبيق</h4>
          <p className="text-xs text-slate-300 mt-1">احصل على تجربة أفضل بتثبيت التطبيق على جهازك.</p>
        </div>
        <div className="flex gap-2">
           <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10 hover:text-white" onClick={() => setShowPrompt(false)}>
             <X className="w-4 h-4" />
           </Button>
           <Button size="sm" onClick={handleInstall} className="bg-secondary hover:bg-secondary/90 text-primary font-bold h-8 px-3">
             تثبيت
           </Button>
        </div>
      </div>
    </div>
  );
}
