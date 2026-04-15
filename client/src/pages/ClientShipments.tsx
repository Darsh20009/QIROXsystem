
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Package, Truck, CheckCircle, Clock, XCircle, MapPin, Hash, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

interface StatusHistory { status: string; note: string; timestamp: string }
interface Shipment {
  id: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  trackingNumber?: string;
  courierName?: string;
  courierUrl?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  shippingAddress?: { name: string; city: string; district: string; street: string; country: string };
  statusHistory?: StatusHistory[];
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; labelEn: string; color: string; icon: any; step: number }> = {
  pending:          { label: "في الانتظار",       labelEn: "Pending",          color: "bg-yellow-100 text-yellow-700 border-yellow-200",   icon: Clock,       step: 0 },
  processing:       { label: "قيد المعالجة",      labelEn: "Processing",       color: "bg-blue-100 text-blue-700 border-blue-200",          icon: RefreshCw,   step: 1 },
  shipped:          { label: "تم الشحن",          labelEn: "Shipped",          color: "bg-purple-100 text-purple-700 border-purple-200",     icon: Truck,       step: 2 },
  out_for_delivery: { label: "جاري التوصيل",      labelEn: "Out for Delivery", color: "bg-orange-100 text-orange-700 border-orange-200",    icon: MapPin,      step: 3 },
  delivered:        { label: "تم التسليم",        labelEn: "Delivered",        color: "bg-green-100 text-green-700 border-green-200",        icon: CheckCircle, step: 4 },
  cancelled:        { label: "ملغي",              labelEn: "Cancelled",        color: "bg-red-100 text-red-700 border-red-200",              icon: XCircle,     step: -1 },
  returned:         { label: "مُعاد",             labelEn: "Returned",         color: "bg-gray-100 text-gray-600 border-gray-200",           icon: AlertCircle, step: -1 },
};

const PROGRESS_STEPS = ["pending", "processing", "shipped", "out_for_delivery", "delivered"];

export default function ClientShipments() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const { data: shipments = [], isLoading } = useQuery<Shipment[]>({
    queryKey: ["/api/shipments/my"],
  });

  const label = (s: string) => {
    const cfg = STATUS_CONFIG[s];
    if (!cfg) return s;
    return L ? cfg.label : cfg.labelEn;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-24" dir={dir}>
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto animate-pulse">
          <Package className="w-6 h-6 text-blue-400" />
        </div>
        <p className="text-sm text-black/30 dark:text-white/30 font-sans">{L ? "جاري تحميل شحناتك..." : "Loading your shipments..."}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 font-sans max-w-2xl mx-auto" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">{L ? "تتبع الشحنات" : "Track Shipments"}</h1>
        <p className="text-black/50 dark:text-white/40 text-sm">{L ? "تتبع حالة طلباتك وشحناتك" : "Track the status of your orders and deliveries"}</p>
      </div>

      {shipments.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20">
          <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-5">
            <Package className="w-9 h-9 text-black/20 dark:text-white/20" />
          </div>
          <h2 className="text-lg font-bold text-black dark:text-white mb-2">{L ? "لا توجد شحنات" : "No Shipments Yet"}</h2>
          <p className="text-black/40 dark:text-white/30 text-sm max-w-xs">{L ? "ستظهر طلباتك المشحونة هنا بمجرد إنشائها" : "Your shipped orders will appear here once created"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment) => {
            const cfg = STATUS_CONFIG[shipment.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const currentStep = cfg.step;

            return (
              <Card key={shipment.id} className="border-black/10 dark:border-white/10 dark:bg-gray-900 overflow-hidden" data-testid={`card-shipment-${shipment.id}`}>
                {/* Header */}
                <CardHeader className="pb-3 pt-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                        <Package className="w-5 h-5 text-black/40 dark:text-white/40" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-black dark:text-white">{shipment.productName || (L ? "منتج" : "Product")}</CardTitle>
                        <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">
                          {L ? `الكمية: ${shipment.quantity}` : `Qty: ${shipment.quantity}`}
                          {shipment.totalPrice ? ` · ${shipment.totalPrice.toLocaleString()} ${L ? "ريال" : "SAR"}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-xs border ${cfg.color} font-medium`}>
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {label(shipment.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-5 space-y-4">
                  {/* Progress Steps */}
                  {currentStep >= 0 && (
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        {PROGRESS_STEPS.map((step, idx) => {
                          const done = idx <= currentStep;
                          const active = idx === currentStep;
                          const StepIcon = STATUS_CONFIG[step].icon;
                          return (
                            <div key={step} className="flex flex-col items-center gap-1 flex-1">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                done ? "bg-black dark:bg-white" : "bg-black/10 dark:bg-white/10"
                              } ${active ? "ring-2 ring-offset-1 ring-black dark:ring-white" : ""}`}>
                                <StepIcon className={`w-3.5 h-3.5 ${done ? "text-white dark:text-black" : "text-black/30 dark:text-white/30"}`} />
                              </div>
                              <span className={`text-[9px] text-center leading-tight ${done ? "text-black/70 dark:text-white/70 font-medium" : "text-black/25 dark:text-white/25"}`}>
                                {L ? STATUS_CONFIG[step].label : STATUS_CONFIG[step].labelEn}
                              </span>
                              {idx < PROGRESS_STEPS.length - 1 && (
                                <div className={`absolute top-3.5 h-0.5 ${done && idx < currentStep ? "bg-black dark:bg-white" : "bg-black/10 dark:bg-white/10"}`}
                                  style={{ left: `${(idx / (PROGRESS_STEPS.length - 1)) * 100 + 5}%`, width: `${100 / (PROGRESS_STEPS.length - 1) - 10}%`, position: "absolute" }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {shipment.trackingNumber && (
                      <div className="col-span-2 flex items-center gap-2 p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                        <Hash className="w-4 h-4 text-black/40 dark:text-white/40 shrink-0" />
                        <div>
                          <p className="text-xs text-black/40 dark:text-white/40">{L ? "رقم التتبع" : "Tracking Number"}</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-black dark:text-white">{shipment.trackingNumber}</p>
                            {shipment.courierUrl && (
                              <a href={shipment.courierUrl} target="_blank" rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600" data-testid={`link-tracking-${shipment.id}`}>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {shipment.courierName && <p className="text-xs text-black/40 dark:text-white/40">{shipment.courierName}</p>}
                        </div>
                      </div>
                    )}

                    {shipment.estimatedDelivery && shipment.status !== "delivered" && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                        <p className="text-xs text-amber-600 dark:text-amber-400">{L ? "الوصول المتوقع" : "Expected Delivery"}</p>
                        <p className="font-bold text-sm text-amber-700 dark:text-amber-300">
                          {new Date(shipment.estimatedDelivery).toLocaleDateString(L ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    )}

                    {shipment.deliveredAt && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
                        <p className="text-xs text-green-600 dark:text-green-400">{L ? "تاريخ التسليم" : "Delivered On"}</p>
                        <p className="font-bold text-sm text-green-700 dark:text-green-300">
                          {new Date(shipment.deliveredAt).toLocaleDateString(L ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    )}

                    {shipment.shippingAddress && (
                      <div className="col-span-2 flex items-start gap-2 text-xs text-black/50 dark:text-white/40">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-black/30" />
                        <span>
                          {[shipment.shippingAddress.street, shipment.shippingAddress.district, shipment.shippingAddress.city]
                            .filter(Boolean).join("، ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status history */}
                  {shipment.statusHistory && shipment.statusHistory.length > 0 && (
                    <details className="group">
                      <summary className="text-xs text-black/40 dark:text-white/30 cursor-pointer hover:text-black/60 select-none">
                        {L ? "▸ سجل التحديثات" : "▸ Status History"}
                      </summary>
                      <div className="mt-2 space-y-1.5 pr-3 border-r-2 border-black/10 dark:border-white/10">
                        {shipment.statusHistory.map((h, i) => (
                          <div key={i} className="text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-black/70 dark:text-white/60">{label(h.status)}</span>
                              <span className="text-black/30 dark:text-white/20">
                                {new Date(h.timestamp).toLocaleDateString(L ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            {h.note && <p className="text-black/40 dark:text-white/30">{h.note}</p>}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  <p className="text-[11px] text-black/25 dark:text-white/20">
                    {L ? "تاريخ الطلب:" : "Ordered:"} {new Date(shipment.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
