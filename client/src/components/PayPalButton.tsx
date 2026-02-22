import { useEffect, useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
  onPaymentSuccess,
  onPaymentError,
}: PayPalButtonProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
    };
    const response = await fetch("/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to create PayPal order");
    }
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  };

  const onApprove = async (data: any) => {
    try {
      const orderData = await captureOrder(data.orderId);
      setStatus("success");
      onPaymentSuccess?.(orderData);
    } catch (e) {
      console.error("Capture error:", e);
      setStatus("error");
      setErrorMsg("Payment capture failed");
      onPaymentError?.(e);
    }
  };

  const onCancel = async (_data: any) => {
    setStatus("ready");
  };

  const onError = async (data: any) => {
    console.error("PayPal error:", data);
    setStatus("error");
    setErrorMsg("Payment failed");
    onPaymentError?.(data);
  };

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = async () => {
            cleanupFn = await initPayPal();
          };
          script.onerror = () => {
            setStatus("error");
            setErrorMsg("Failed to load PayPal");
          };
          document.body.appendChild(script);
        } else {
          cleanupFn = await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
        setStatus("error");
        setErrorMsg("Failed to load PayPal");
      }
    };

    const initPayPal = async (): Promise<(() => void) | undefined> => {
      try {
        const res = await fetch("/paypal/setup");
        if (!res.ok) {
          setStatus("error");
          setErrorMsg("PayPal not configured");
          return;
        }
        const data = await res.json();
        const clientToken = data.clientToken;

        if (!clientToken) {
          setStatus("error");
          setErrorMsg("PayPal not available");
          return;
        }

        const sdkInstance = await (window as any).paypal.createInstance({
          clientToken,
          components: ["paypal-payments"],
        });

        const paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove,
          onCancel,
          onError,
        });

        setStatus("ready");

        const onClick = async () => {
          try {
            setStatus("loading");
            const checkoutOptionsPromise = createOrder();
            await paypalCheckout.start(
              { paymentFlow: "auto" },
              checkoutOptionsPromise,
            );
          } catch (e) {
            console.error(e);
            setStatus("ready");
          }
        };

        const paypalButton = document.getElementById("paypal-button");
        if (paypalButton) {
          paypalButton.addEventListener("click", onClick);
        }

        return () => {
          if (paypalButton) {
            paypalButton.removeEventListener("click", onClick);
          }
        };
      } catch (e) {
        console.error("PayPal init error:", e);
        setStatus("error");
        setErrorMsg("Failed to initialize PayPal");
        return undefined;
      }
    };

    loadPayPalSDK();

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, []);

  if (status === "success") {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-green-400">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium text-sm">Payment completed successfully</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{errorMsg}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-[#00D4FF] hover:underline mt-1"
          data-testid="button-retry-paypal"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {status === "loading" && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#00D4FF]" />
          <span className="text-xs text-white/40">Loading PayPal...</span>
        </div>
      )}
      <paypal-button
        id="paypal-button"
        data-testid="paypal-button"
        style={{
          display: status === "ready" ? "block" : "none",
          cursor: "pointer",
          width: "100%",
          padding: "12px 24px",
          background: "linear-gradient(135deg, #0070ba, #003087)",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "bold",
          textAlign: "center" as const,
        }}
      >
        Pay with PayPal
      </paypal-button>
    </div>
  );
}
