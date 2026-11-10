import { useState } from "react";
import type { BuilderConfig } from "@shared/saas-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
type Splash = Pick<BuilderConfig, "splashEnabled" | "splashImageUrl" | "splashBackgroundColor" | "splashImageFit" | "splashDurationMs" | "splashTitle" | "splashSubtitle">;
export function SaasSplashSettings({ orderId, config, onChange }: { orderId: string; config: Splash; onChange: (change: Splash) => void }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const tx = (a: string, en: string) => ar ? a : en;
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      toast({ title: tx("اختر PNG أو JPG أو WebP أو GIF حتى 8MB", "Choose PNG, JPG, WebP or GIF up to 8MB"), variant: "destructive" }); return;
    }
    setBusy(true);
    try {
      const body = new FormData(); body.append("splash", file);
      const response = await fetch(`/api/admin/orders/${orderId}/saas-builder/splash`, { method: "POST", credentials: "include", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || tx("تعذر رفع الصورة", "Upload failed"));
      onChange({ splashImageUrl: result.splashImageUrl, splashEnabled: true });
      toast({ title: tx("تم رفع الصورة؛ احفظ التخصيص لتطبيقها", "Image uploaded; save customization to apply") });
    } catch (error: any) { toast({ title: error.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };
  return <section className="mt-4 space-y-3 rounded-xl border border-black/10 p-3" data-testid="splash-customization">
    <label className="flex items-center justify-between gap-2 text-xs font-semibold">{tx("شاشة البداية · Splash Screen", "Splash Screen")}<input type="checkbox" checked={!!config.splashEnabled} onChange={event => onChange({ splashEnabled: event.target.checked })} aria-label={tx("تفعيل شاشة البداية", "Enable splash screen")} /></label>
    <p className="text-[10px] leading-5 text-black/50">{tx("تظهر عند فتح النظام على الجوال والكمبيوتر، وهي مستقلة عن الشعار وصورة الواجهة.", "Shown when opening the web app on mobile and desktop, independently of the logo and hero image.")}</p>
    <div className="relative aspect-video overflow-hidden rounded-lg border border-black/10" style={{ backgroundColor: config.splashBackgroundColor || "#ffffff" }}>
      {config.splashImageUrl && <img src={config.splashImageUrl} alt={tx("معاينة شاشة البداية", "Splash preview")} className="absolute inset-0 h-full w-full" style={{ objectFit: config.splashImageFit || "contain" }} />}
      {(config.splashTitle || config.splashSubtitle) && <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/90 p-2 text-center text-black"><strong className="text-xs">{config.splashTitle}</strong><p className="text-[10px]">{config.splashSubtitle}</p></div>}
      {!config.splashImageUrl && !config.splashTitle && <span className="absolute inset-0 flex items-center justify-center text-xs text-black/40">{tx("معاينة شاشة البداية", "Splash preview")}</span>}
    </div>
    <div className="flex flex-wrap gap-2">
      <label className={`cursor-pointer rounded-lg border border-black/10 px-3 py-2 text-xs ${busy ? "pointer-events-none opacity-50" : ""}`}>{busy ? tx("جارٍ رفع الصورة…", "Uploading…") : tx("رفع صورة شاشة البداية", "Upload splash image")}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" disabled={busy} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} /></label>
      {config.splashImageUrl && <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ splashImageUrl: "" })}>{tx("إزالة الصورة", "Remove image")}</Button>}
    </div>
    <label className="block space-y-1 text-xs">{tx("العنوان (اختياري)", "Title (optional)")}<Input maxLength={180} value={config.splashTitle || ""} onChange={event => onChange({ splashTitle: event.target.value })} /></label>
    <label className="block space-y-1 text-xs">{tx("عبارة ترحيبية (اختياري)", "Welcome message (optional)")}<Input maxLength={300} value={config.splashSubtitle || ""} onChange={event => onChange({ splashSubtitle: event.target.value })} /></label>
    <label className="flex items-center justify-between text-xs">{tx("لون الخلفية", "Background color")}<input type="color" value={config.splashBackgroundColor || "#ffffff"} onChange={event => onChange({ splashBackgroundColor: event.target.value })} /></label>
    <label className="block space-y-1 text-xs">{tx("عرض الصورة", "Image sizing")}<select className="h-9 w-full rounded-lg border border-black/10 bg-white px-2" value={config.splashImageFit || "contain"} onChange={event => onChange({ splashImageFit: event.target.value as "contain" | "cover" })}><option value="contain">{tx("الصورة كاملة دون قص", "Fit entire image")}</option><option value="cover">{tx("ملء الشاشة مع قص الأطراف", "Fill screen, crop edges")}</option></select></label>
    <label className="block space-y-1 text-xs">{tx("الحد الأدنى للعرض (ثانية)", "Minimum display time (seconds)")}<input type="number" min={0} max={6} step={0.5} value={(config.splashDurationMs ?? 1500) / 1000} onChange={event => onChange({ splashDurationMs: Math.max(0, Math.min(6000, Number(event.target.value) * 1000)) })} className="h-9 w-full rounded-lg border border-black/10 px-2" /></label>
  </section>;
}