import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Eye, Truck, Package, CheckCircle, Clock, XCircle, MapPin, ArrowLeft, ExternalLink, Search } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion } from "framer-motion";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending:          { label: "قيد الانتظار", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  processing:       { label: "قيد التجهيز",  color: "bg-blue-50 text-blue-700 border-blue-200",      icon: Package },
  shipped:          { label: "تم الشحن",     color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Truck },
  out_for_delivery: { label: "في الطريق",   color: "bg-orange-50 text-orange-700 border-orange-200", icon: MapPin },
  delivered:        { label: "تم التوصيل",  color: "bg-green-50 text-green-700 border-green-200",    icon: CheckCircle },
  cancelled:        { label: "ملغي",         color: "bg-red-50 text-red-700 border-red-200",          icon: XCircle },
  returned:         { label: "مُرتجع",       color: "bg-gray-50 text-gray-600 border-gray-200",       icon: ArrowLeft },
};

const emptyForm = {
  clientName: "", clientEmail: "", clientPhone: "",
  productId: "", productName: "", quantity: "1", totalPrice: "",
  shippingAddress: { name: "", phone: "", city: "", district: "", street: "", postalCode: "" },
  status: "pending", trackingNumber: "", courierName: "", courierUrl: "",
  estimatedDelivery: "", adminNotes: "",
};

export default function AdminShipments() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateNote, setUpdateNote] = useState("");

  const { data: shipments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/shipments"],
  });

  const { data: products } = useQuery<any[]>({
    queryKey: ["/api/admin/products"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/shipments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipments"] });
      setDialogOpen(false);
      setForm({ ...emptyForm });
      toast({ title: "تم إنشاء الشحنة" });
    },
    onError: (e: any) => toast({ title: e.message || "فشل", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/shipments/${id}`, data);
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipments"] });
      setViewItem(updated);
      setUpdateNote("");
      toast({ title: "تم تحديث حالة الشحنة" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/shipments/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipments"] });
      toast({ title: "تم الحذف" });
    },
  });

  const filtered = (shipments || []).filter((s: any) => {
    const matchSearch = !search || s.clientName?.includes(search) || s.clientEmail?.includes(search) || s.trackingNumber?.includes(search) || s.productName?.includes(search);
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleCreate = () => {
    if (!form.productName || !form.clientName || !form.clientEmail) {
      return toast({ title: "اسم المنتج والعميل مطلوبان", variant: "destructive" });
    }
    createMutation.mutate({
      ...form,
      quantity: Number(form.quantity) || 1,
      totalPrice: Number(form.totalPrice) || 0,
    });
  };

  const handleUpdateStatus = () => {
    if (!viewItem || !updateStatus) return;
    updateMutation.mutate({
      id: viewItem.id || viewItem._id,
      data: {
        status: updateStatus,
        statusNote: updateNote,
        trackingNumber: viewItem.trackingNumber,
        courierName: viewItem.courierName,
        courierUrl: viewItem.courierUrl,
        estimatedDelivery: viewItem.estimatedDelivery,
        adminNotes: viewItem.adminNotes,
      },
    });
  };

  const stats = {
    total: shipments?.length || 0,
    pending: shipments?.filter((s: any) => s.status === "pending").length || 0,
    shipped: shipments?.filter((s: any) => ["shipped","out_for_delivery"].includes(s.status)).length || 0,
    delivered: shipments?.filter((s: any) => s.status === "delivered").length || 0,
  };

  return (
    <div dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-black dark:text-white">شحنات الأجهزة</h1>
          <p className="text-sm text-black/40 dark:text-white/40 mt-1">تتبع وإدارة شحنات المنتجات والأجهزة</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setDialogOpen(true); }}
          className="bg-black dark:bg-white text-white dark:text-black rounded-xl h-9 text-sm gap-2" data-testid="button-add-shipment">
          <Plus className="w-4 h-4" />شحنة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "إجمالي الشحنات", value: stats.total, color: "text-black dark:text-white" },
          { label: "قيد الانتظار", value: stats.pending, color: "text-yellow-600" },
          { label: "في الشحن", value: stats.shipped, color: "text-indigo-600" },
          { label: "تم التوصيل", value: stats.delivered, color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-black/40 dark:text-white/40 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الكود..." className="pr-9 max-w-xs" data-testid="input-search-shipments" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-black/20" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-black/30 dark:text-white/30">
          <Truck className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>لا توجد شحنات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s: any) => {
            const sc = statusConfig[s.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            return (
              <motion.div key={s.id || s._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-black dark:text-white">{s.productName}</span>
                    <Badge className={`text-xs border flex items-center gap-1 ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" />{sc.label}
                    </Badge>
                    {s.trackingNumber && (
                      <span className="text-xs font-mono bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded-lg text-black/60 dark:text-white/60">
                        {s.trackingNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-black/40 dark:text-white/40">العميل: {s.clientName} — {s.clientEmail}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-black/40 dark:text-white/40 flex-wrap">
                    {s.courierName && <span>شركة الشحن: {s.courierName}</span>}
                    {s.shippingAddress?.city && <span><MapPin className="w-3 h-3 inline ml-1" />{s.shippingAddress.city}</span>}
                    {s.totalPrice > 0 && <span>{s.totalPrice} SAR</span>}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setViewItem(s); setUpdateStatus(s.status); }}
                  className="rounded-xl text-xs h-8 gap-1 shrink-0" data-testid={`button-view-shipment-${s.id || s._id}`}>
                  <Eye className="w-3 h-3" />عرض
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">شحنة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">اسم المنتج *</label>
              <Input value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="اسم المنتج" data-testid="input-product-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">الكمية</label>
                <Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">السعر الإجمالي</label>
                <Input type="number" min="0" value={form.totalPrice} onChange={e => setForm(f => ({ ...f, totalPrice: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-3">
              <p className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2">بيانات العميل</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">الاسم *</label>
                  <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} data-testid="input-shipment-client-name" />
                </div>
                <div>
                  <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">البريد *</label>
                  <Input value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} type="email" data-testid="input-shipment-client-email" />
                </div>
                <div>
                  <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">الهاتف</label>
                  <Input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-3">
              <p className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2">عنوان الشحن</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "name", label: "الاسم الكامل" },
                  { key: "phone", label: "الهاتف" },
                  { key: "city", label: "المدينة" },
                  { key: "district", label: "الحي" },
                  { key: "street", label: "الشارع" },
                  { key: "postalCode", label: "الرمز البريدي" },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">{field.label}</label>
                    <Input value={(form.shippingAddress as any)[field.key]} onChange={e => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, [field.key]: e.target.value } }))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">شركة الشحن</label>
                <Input value={form.courierName} onChange={e => setForm(f => ({ ...f, courierName: e.target.value }))} placeholder="أرامكس، DHL..." />
              </div>
              <div>
                <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">رقم التتبع</label>
                <Input value={form.trackingNumber} onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 rounded-xl">إلغاء</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl" data-testid="button-create-shipment">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء الشحنة"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={v => !v && setViewItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تفاصيل الشحنة</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-black dark:text-white">{viewItem.productName}</span>
                  <Badge className={`text-xs border ${statusConfig[viewItem.status]?.color || ""}`}>
                    {statusConfig[viewItem.status]?.label || viewItem.status}
                  </Badge>
                </div>
                <p className="text-xs text-black/50 dark:text-white/50">العميل: {viewItem.clientName} — {viewItem.clientEmail}</p>
                {viewItem.shippingAddress?.city && (
                  <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                    <MapPin className="w-3 h-3 inline ml-1" />
                    {viewItem.shippingAddress.city} {viewItem.shippingAddress.district ? `، ${viewItem.shippingAddress.district}` : ""}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">شركة الشحن</label>
                  <Input value={viewItem.courierName || ""} onChange={e => setViewItem((s: any) => ({ ...s, courierName: e.target.value }))} placeholder="أرامكس، DHL..." />
                </div>
                <div>
                  <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">رقم التتبع</label>
                  <Input value={viewItem.trackingNumber || ""} onChange={e => setViewItem((s: any) => ({ ...s, trackingNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">رابط التتبع</label>
                  <Input value={viewItem.courierUrl || ""} onChange={e => setViewItem((s: any) => ({ ...s, courierUrl: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">الوصول المتوقع</label>
                  <Input type="date" value={viewItem.estimatedDelivery ? new Date(viewItem.estimatedDelivery).toISOString().split("T")[0] : ""} onChange={e => setViewItem((s: any) => ({ ...s, estimatedDelivery: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">تحديث الحالة</label>
                <div className="flex gap-2">
                  <Select value={updateStatus} onValueChange={setUpdateStatus}>
                    <SelectTrigger className="flex-1" data-testid="select-update-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Input value={updateNote} onChange={e => setUpdateNote(e.target.value)} placeholder="ملاحظة (اختياري)..." className="mt-2" data-testid="input-status-note" />
              </div>

              {viewItem.statusHistory?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">سجل التحديثات</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {[...viewItem.statusHistory].reverse().map((h: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${statusConfig[h.status]?.color?.includes("green") ? "bg-green-500" : statusConfig[h.status]?.color?.includes("red") ? "bg-red-500" : "bg-black/30"}`} />
                        <div>
                          <span className="font-medium text-black/70 dark:text-white/70">{statusConfig[h.status]?.label || h.status}</span>
                          {h.note && <span className="text-black/40 dark:text-white/40 ml-2">— {h.note}</span>}
                          <p className="text-black/30 dark:text-white/30">{new Date(h.timestamp).toLocaleString('ar-SA')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">ملاحظات داخلية</label>
                <Textarea value={viewItem.adminNotes || ""} onChange={e => setViewItem((s: any) => ({ ...s, adminNotes: e.target.value }))} rows={2} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewItem(null)} className="flex-1 rounded-xl">إغلاق</Button>
                <Button onClick={handleUpdateStatus} disabled={updateMutation.isPending} className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl" data-testid="button-update-shipment">
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "تحديث"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
