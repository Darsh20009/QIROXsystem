import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface PayPalButtonProps {
  amount: string;
  currency?: string;
  intent?: string;
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
}

export default function PayPalButton({
  amount,
  currency = "USD",
  intent = "CAPTURE",
  onPaymentSuccess,
  onPaymentError,
}: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const buttonsRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const initPayPal = async () => {
      setStatus("loading");

      try {
        const idRes = await fetch("/paypal/client-id");
        if (!idRes.ok) {
          if (!cancelled) {
            setStatus("error");
            setErrorMsg("PayPal غير مفعّل — تحقق من الإعدادات");
          }
          return;
        }
        const { clientId } = await idRes.json();

        if (!clientId) {
          if (!cancelled) {
            setStatus("error");
            setErrorMsg("Client ID غير موجود");
          }
          return;
        }

        const scriptId = "paypal-sdk-v2";

        const loadScript = (): Promise<void> =>
          new Promise((resolve, reject) => {
            const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
            if (existing) {
              resolve();
              return;
            }
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=${intent.toLowerCase()}&disable-funding=credit,card`;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("تعذّر تحميل مكتبة PayPal"));
            document.body.appendChild(script);
          });

        await loadScript();

        if (cancelled) return;

        const paypal = (window as any).paypal;
        if (!paypal?.Buttons) {
          if (!cancelled) {
            setStatus("error");
            setErrorMsg("تعذّر تحميل PayPal — حاول مجدداً");
          }
          return;
        }

        if (!containerRef.current || cancelled) return;

        if (containerRef.current.childNodes.length > 0) {
          containerRef.current.innerHTML = "";
        }

        const buttons = paypal.Buttons({
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "pay",
            height: 44,
          },
          createOrder: async () => {
            const res = await fetch("/paypal/order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount, currency, intent }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || "فشل إنشاء الطلب");
            }
            const order = await res.json();
            return order.id;
          },
          onApprove: async (data: any) => {
            try {
              const res = await fetch(`/paypal/order/${data.orderID}/capture`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });
              const captured = await res.json();
              if (!cancelled) {
                setStatus("success");
                onPaymentSuccess?.(captured);
              }
            } catch (e) {
              if (!cancelled) {
                setStatus("error");
                setErrorMsg("فشل تأكيد الدفع — تواصل معنا");
                onPaymentError?.(e);
              }
            }
          },
          onCancel: () => {
            if (!cancelled) setStatus("ready");
          },
          onError: (err: any) => {
            if (!cancelled) {
              setStatus("error");
              setErrorMsg("حدث خطأ في الدفع — حاول مجدداً");
              onPaymentError?.(err);
            }
          },
        });

        buttonsRef.current = buttons;

        if (buttons.isEligible()) {
          await buttons.render(containerRef.current);
          if (!cancelled) setStatus("ready");
        } else {
          if (!cancelled) {
            setStatus("error");
            setErrorMsg("PayPal غير متاح في منطقتك حالياً");
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(e?.message || "تعذّر تهيئة PayPal");
        }
      }
    };

    initPayPal();

    return () => {
      cancelled = true;
      try {
        buttonsRef.current?.close?.();
      } catch {}
      buttonsRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [retryCount, amount, currency, intent]);

  if (status === "success") {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-green-600" data-testid="paypal-success">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium text-sm">تمّت عملية الدفع بنجاح</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-4" data-testid="paypal-error">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{errorMsg}</span>
        </div>
        <button
          onClick={() => setRetryCount(c => c + 1)}
          className="text-xs text-black/40 hover:text-black/70 underline transition-colors"
          data-testid="button-retry-paypal"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="paypal-button-wrapper">
      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-black/40" />
          <span className="text-xs text-black/40">جاري تحميل PayPal...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full" data-testid="paypal-button-container" />
    </div>
  );
}
