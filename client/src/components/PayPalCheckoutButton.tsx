import { useState } from "react";
import { Loader2 } from "lucide-react";

const SAR_TO_USD = 3.75;

interface PayPalCheckoutButtonProps {
  amount: number;
  currency?: string;
  onRedirecting?: () => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
  pendingData?: Record<string, any>;
}

export default function PayPalCheckoutButton({
  amount,
  currency = "SAR",
  onRedirecting,
  onError,
  disabled = false,
  pendingData,
}: PayPalCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const usdAmount = currency === "SAR" ? (amount / SAR_TO_USD).toFixed(2) : amount.toFixed(2);

  const handleClick = async () => {
    if (disabled || loading) return;
    setLoading(true);

    try {
      const returnUrl = `${window.location.origin}/cart?paypal_return=1`;
      const cancelUrl = `${window.location.origin}/cart?paypal_cancel=1`;

      if (pendingData) {
        sessionStorage.setItem("paypal_pending_checkout", JSON.stringify(pendingData));
      }

      const res = await fetch("/paypal/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: usdAmount,
          currency: "USD",
          intent: "CAPTURE",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "فشل إنشاء طلب الدفع");
      }

      const order = await res.json();
      const approveUrl = order.approveUrl || order.links?.find((l: any) => l.rel === "approve" || l.rel === "payer-action")?.href;

      if (!approveUrl) {
        throw new Error("لم يتم الحصول على رابط PayPal");
      }

      onRedirecting?.();
      window.location.href = approveUrl;
    } catch (e: any) {
      setLoading(false);
      onError?.(e.message || "خطأ في PayPal");
    }
  };

  return (
    <div className="space-y-2" data-testid="paypal-checkout-button">
      <div className="flex items-center gap-2 rounded-xl bg-[#003087]/5 border border-[#003087]/10 px-3 py-2">
        <img
          src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg"
          alt="PayPal"
          className="h-4 rounded"
        />
        <p className="text-[11px] text-[#003087] leading-snug">
          سيتم خصم <span className="font-black">${usdAmount}</span>{" "}
          (يعادل {amount.toLocaleString()} ر.س — سعر صرف ثابت)
        </p>
      </div>

      <button
        onClick={handleClick}
        disabled={disabled || loading}
        data-testid="button-paypal-redirect"
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-[15px] transition-all
          bg-[#FFC439] hover:bg-[#f0b429] active:bg-[#e0a61e] text-[#003087]
          disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري التحويل...</span>
          </>
        ) : (
          <>
            <img
              src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png"
              alt="PayPal"
              className="h-5"
            />
            <span>ادفع عبر PayPal</span>
          </>
        )}
      </button>

      <p className="text-center text-[10px] text-black/40">
        سيتم تحويلك إلى صفحة PayPal الآمنة لإتمام الدفع، ثم العودة هنا تلقائياً
      </p>
    </div>
  );
}
