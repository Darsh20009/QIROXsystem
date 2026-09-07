/**
 * SendWhatsAppButton — reusable WA send button
 * Calls POST /api/admin/whatsapp/send-to-phone
 * Renders next to email buttons; hidden when no phone available
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Simple WhatsApp icon (SVG inline)
function WAIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

interface Props {
  phone: string | null | undefined;
  message: string;
  label?: string;
  size?: "sm" | "default";
  className?: string;
  "data-testid"?: string;
}

export function SendWhatsAppButton({
  phone,
  message,
  label = "واتساب",
  size = "sm",
  className = "",
  "data-testid": testId,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Hide button when no phone is available
  if (!phone) return null;

  const handleSend = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/whatsapp/send-to-phone", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, text: message }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "فشل الإرسال");
      toast({ title: "✅ تم إرسال الرسالة عبر واتساب" });
    } catch (e: any) {
      toast({ title: "فشل إرسال الواتساب", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size={size}
      className={`h-8 text-xs gap-1.5 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366] ${className}`}
      onClick={handleSend}
      disabled={loading}
      data-testid={testId}
      title={`إرسال عبر واتساب إلى ${phone}`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <WAIcon className="w-3 h-3" />}
      {label}
    </Button>
  );
}
