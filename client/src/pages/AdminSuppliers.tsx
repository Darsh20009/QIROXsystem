// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Truck, Plus, Search, CheckCircle, XCircle, Clock, Eye, UserPlus, Package, Key } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

function getOfferStatus(L: boolean): Record<string, { label: string; color: string }> { return {
  pending: { label: L ? "قيد المراجعة" : "Under Review", color: "bg-amber-100 text-amber-700 border-amber-200" },
  reviewing: { label: L ? "تحت الدراسة" : "Reviewing", color: "bg-blue-100 text-blue-700 border-blue-200" },
  accepted: { label: L ? "مقبول" : "Accepted", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: L ? "مرفوض" : "Rejected", color: "bg-red-100 text-red-700 border-red-200" },
};
}

export default function AdminSuppliers() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const OFFER_STATUS = getOfferStatus(L);
  const [activeTab, setActiveTab] = useState<"suppliers" | "offers">("suppliers");
  const [search, setSearch] = useState("");
  const [inviteDialog, setInviteDialog] = useState(false);
  const [viewOffer, setViewOffer] = useState<any>(null);
  const [inviteForm, setInviteForm] = useState({ fullName: "", email: "", username: "", phone: "" });
  const [createdSupplier, setCreatedSupplier] = useState<any>(null);

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<any[]>({ queryKey: ["/api/admin/suppliers"] });
  const { data: offers = [], isLoading: offersLoading } = useQuery<any[]>({ queryKey: ["/api/admin/supplier-offers"] });

  const inviteMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/suppliers/invite", data),
    onSuccess: (res: any) => { queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] }); setInviteDialog(false); setCreatedSupplier(res); setInviteForm({ fullName: "", email: "", username: "", phone: "" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: any) => apiRequest("PATCH", `/api/admin/supplier-offers/${id}`, { status, adminNote }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/supplier-offers"] }); setViewOffer(null); toast({ title: L ? "تم تحديث حالة العرض" : "Offer status updated" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const filteredSuppliers = suppliers.filter(s => !search || s.fullName?.includes(search) || s.email?.includes(search));
  const filteredOffers = offers.filter(o => !search || o.title?.includes(search) || o.supplier?.fullName?.includes(search));

  return (
    <div className="p-6 space-y-6 font-sans" dir={dir}>
      <PageGraphics />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">{L ? "بوابة الموردين والشركاء" : "Suppliers & Partners Portal"}</h1>
          <p className="text-black/50 text-sm">{L ? "إدارة موردي الخدمات وعروضهم" : "Manage service suppliers and their offers"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "suppliers" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("suppliers")} className={activeTab === "suppliers" ? "bg-black text-white" : "border-black/20"} data-testid="button-tab-suppliers">
            {L ? "الموردون" : "Suppliers"} ({suppliers.length})
          </Button>
          <Button variant={activeTab === "offers" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("offers")} className={activeTab === "offers" ? "bg-black text-white" : "border-black/20"} data-testid="button-tab-offers">
            العروض ({offers.length})
          </Button>
          <Button onClick={() => setInviteDialog(true)} className="bg-black text-white hover:bg-black/80 gap-2" size="sm" data-testid="button-invite-supplier">
            <UserPlus className="w-4 h-4" /> دعوة مورد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="border-black/10"><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{suppliers.length}</div><div className="text-xs text-black/50">إجمالي الموردين</div></CardContent></Card>
        <Card className="border-black/10"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-amber-600">{offers.filter(o => o.status === "pending").length}</div><div className="text-xs text-black/50">عروض بانتظار المراجعة</div></CardContent></Card>
        <Card className="border-black/10"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{offers.filter(o => o.status === "accepted").length}</div><div className="text-xs text-black/50">عروض مقبولة</div></CardContent></Card>
        <Card className="border-black/10"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{offers.length}</div><div className="text-xs text-black/50">إجمالي العروض</div></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="pr-9 border-black/20" data-testid="input-search" />
      </div>

      {activeTab === "suppliers" && (
        suppliersLoading ? <div className="text-center py-12 text-black/30">جاري التحميل...</div> :
        filteredSuppliers.length === 0 ? (
          <div className="text-center py-16 text-black/30"><Truck className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>لا يوجد موردون بعد</p><Button onClick={() => setInviteDialog(true)} size="sm" className="mt-3 bg-black text-white" data-testid="button-invite-first">دعوة أول مورد</Button></div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredSuppliers.map(s => (
              <Card key={s.id || s._id} className="border-black/10 hover:border-black/20 transition-all" data-testid={`card-supplier-${s.id || s._id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-black/40 font-bold">{s.fullName?.[0] || "م"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{s.fullName}</div>
                      <div className="text-xs text-black/40 truncate">{s.email}</div>
                      {s.phone && <div className="text-xs text-black/30">{s.phone}</div>}
                      <div className="text-xs text-black/30 mt-1">{new Date(s.createdAt).toLocaleDateString("ar-SA")}</div>
                    </div>
                    <Badge className="bg-black/5 text-black/60 text-xs border-0">مورد</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {activeTab === "offers" && (
        offersLoading ? <div className="text-center py-12 text-black/30">جاري التحميل...</div> :
        filteredOffers.length === 0 ? (
          <div className="text-center py-16 text-black/30"><Package className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>لا توجد عروض بعد</p></div>
        ) : (
          <div className="space-y-3">
            {filteredOffers.map(offer => {
              const st = OFFER_STATUS[offer.status] || OFFER_STATUS.pending;
              return (
                <Card key={offer.id} className="border-black/10 hover:border-black/20 transition-all" data-testid={`card-offer-${offer.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-sm">{offer.title}</div>
                          <Badge className={`${st.color} border text-xs`}>{st.label}</Badge>
                        </div>
                        <div className="text-xs text-black/40 mt-0.5">المورد: {offer.supplier?.fullName} · {offer.category}</div>
                        <div className="text-sm font-bold mt-1">{offer.price?.toLocaleString()} {offer.currency || "SAR"}</div>
                      </div>
                      <div className="flex gap-2">
                        {offer.status === "pending" && <>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => respondMutation.mutate({ id: offer.id, status: "accepted", adminNote: "" })} data-testid={`button-accept-offer-${offer.id}`}><CheckCircle className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="outline" className="border-red-200 text-red-500" onClick={() => respondMutation.mutate({ id: offer.id, status: "rejected", adminNote: "" })} data-testid={`button-reject-offer-${offer.id}`}><XCircle className="w-3.5 h-3.5" /></Button>
                        </>}
                        <Button size="sm" variant="outline" className="border-black/20" onClick={() => setViewOffer(offer)} data-testid={`button-view-offer-${offer.id}`}><Eye className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="sm:max-w-md font-sans" dir="rtl">
          <DialogHeader><DialogTitle>دعوة مورد جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">الاسم الكامل *</label>
                <Input value={inviteForm.fullName} onChange={e => setInviteForm(f => ({ ...f, fullName: e.target.value }))} placeholder="اسم المورد" className="border-black/20" data-testid="input-supplier-name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">اسم المستخدم *</label>
                <Input value={inviteForm.username} onChange={e => setInviteForm(f => ({ ...f, username: e.target.value }))} placeholder="username" className="border-black/20" dir="ltr" data-testid="input-supplier-username" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">البريد الإلكتروني *</label>
              <Input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="border-black/20" dir="ltr" data-testid="input-supplier-email" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الجوال</label>
              <Input value={inviteForm.phone} onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))} placeholder="+966..." className="border-black/20" data-testid="input-supplier-phone" />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              سيُنشأ حساب للمورد بكلمة مرور مؤقتة يجب مشاركتها معه لتسجيل الدخول.
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setInviteDialog(false)}>إلغاء</Button>
              <Button onClick={() => inviteMutation.mutate(inviteForm)} disabled={inviteMutation.isPending || !inviteForm.fullName || !inviteForm.email || !inviteForm.username} className="bg-black text-white hover:bg-black/80" data-testid="button-submit-invite">
                {inviteMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createdSupplier} onOpenChange={() => setCreatedSupplier(null)}>
        <DialogContent className="sm:max-w-sm font-sans" dir="rtl">
          <DialogHeader><DialogTitle>{L ? "تم إنشاء حساب المورد" : "Supplier Account Created"}</DialogTitle></DialogHeader>
          {createdSupplier && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-center text-sm text-green-700">{L ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!"}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-black/40">{L ? "اسم المستخدم" : "Username"}</span><span className="font-mono font-bold">{createdSupplier.username}</span></div>
                <div className="flex justify-between text-sm"><span className="text-black/40">{L ? "كلمة المرور المؤقتة" : "Temporary Password"}</span>
                  <span className="font-mono font-bold bg-amber-100 px-2 py-0.5 rounded" data-testid="text-temp-password">{createdSupplier.tempPassword}</span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <Key className="w-3.5 h-3.5 inline ml-1" /> {L ? "احفظ كلمة المرور المؤقتة وأرسلها للمورد. لن تتمكن من رؤيتها مرة أخرى." : "Save the temporary password and send it to the supplier. You won't be able to see it again."}
              </div>
              <Button onClick={() => setCreatedSupplier(null)} className="w-full bg-black text-white">{L ? "تم الاطلاع" : "Acknowledged"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewOffer} onOpenChange={() => setViewOffer(null)}>
        <DialogContent className="sm:max-w-lg font-sans" dir="rtl">
          <DialogHeader><DialogTitle>{L ? "تفاصيل العرض" : "Offer Details"}</DialogTitle></DialogHeader>
          {viewOffer && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={`${(OFFER_STATUS[viewOffer.status] || OFFER_STATUS.pending).color} border`}>{(OFFER_STATUS[viewOffer.status] || OFFER_STATUS.pending).label}</Badge>
                <span className="text-sm text-black/40">{new Date(viewOffer.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</span>
              </div>
              <div><div className="font-bold">{viewOffer.title}</div><div className="text-xs text-black/40">{L ? "المورد:" : "Supplier:"} {viewOffer.supplier?.fullName}</div></div>
              {viewOffer.description && <p className="text-sm text-black/70 bg-black/5 p-3 rounded-xl">{viewOffer.description}</p>}
              <div className="flex justify-between"><span className="text-black/50">{L ? "السعر" : "Price"}</span><span className="font-bold text-lg">{viewOffer.price?.toLocaleString()} {viewOffer.currency}</span></div>
              {viewOffer.category && <div className="flex justify-between text-sm"><span className="text-black/50">{L ? "الفئة" : "Category"}</span><span>{viewOffer.category}</span></div>}
              {viewOffer.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={() => respondMutation.mutate({ id: viewOffer.id, status: "accepted", adminNote: "" })} data-testid="button-dialog-accept">{L ? "قبول العرض" : "Accept Offer"}</Button>
                  <Button variant="outline" className="flex-1 border-red-200 text-red-500" onClick={() => respondMutation.mutate({ id: viewOffer.id, status: "rejected", adminNote: "" })} data-testid="button-dialog-reject">{L ? "رفض العرض" : "Reject Offer"}</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
