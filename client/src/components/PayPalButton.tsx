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
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current) return;

    const initPayPal = async () => {
      try {
        const idRes = await fetch("/paypal/client-id");
        if (!idRes.ok) {
          setStatus("error");
          setErrorMsg("PayPal غير مفعّل");
          return;
        }
        const { clientId } = await idRes.json();

        const isLive = import.meta.env.PROD || import.meta.env.VITE_PAYPAL_ENV === "live";
        const scriptId = "paypal-sdk-v2";

        const loadScript = (): Promise<void> =>
          new Promise((resolve, reject) => {
            if (document.getElementById(scriptId)) {
              resolve();
              return;
            }
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=${intent.toLowerCase()}&disable-funding=credit,card`;
            if (!isLive) {
              script.setAttribute("data-namespace", "paypal");
            }
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
            document.body.appendChild(script);
          });

        await loadScript();

        const paypal = (window as any).paypal;
        if (!paypal || !paypal.Buttons) {
          setStatus("error");
          setErrorMsg("تعذّر تحميل PayPal");
          return;
        }

        if (!containerRef.current) return;

        rendered.current = true;

        paypal.Buttons({
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
              const err = await res.json();
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
              setStatus("success");
              onPaymentSuccess?.(captured);
            } catch (e) {
              console.error("Capture error:", e);
              setStatus("error");
              setErrorMsg("فشل تأكيد الدفع");
              onPaymentError?.(e);
            }
          },
          onCancel: () => {
            setStatus("ready");
          },
          onError: (err: any) => {
            console.error("PayPal error:", err);
            setStatus("error");
            setErrorMsg("حدث خطأ في الدفع");
            onPaymentError?.(err);
          },
        }).render(containerRef.current);

        setStatus("ready");
      } catch (e: any) {
        console.error("PayPal init error:", e?.message || e);
        setStatus("error");
        setErrorMsg(e?.message || "تعذّر تهيئة PayPal");
      }
    };

    initPayPal();
  }, []);

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
      <div className="flex flex-col items-center gap-2 py-4" data-testid="paypal-error">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{errorMsg}</span>
        </div>
        <button
          onClick={() => { rendered.current = false; setStatus("loading"); }}
          className="text-xs text-black/40 hover:underline mt-1"
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
