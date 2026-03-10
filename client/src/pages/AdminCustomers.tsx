import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Users, Mail, Phone, Calendar, Search, Trash2,
  AlertTriangle, MessageCircle, X, PhoneOff, CheckCircle2,
  Clock, ChevronDown, ChevronUp, Send,
} from "lucide-react";
import { SiTelegram, SiWhatsapp } from "react-icons/si";
import { type User } from "@shared/schema";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-auth";

type PhoneRequest = {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  requestedByName: string;
  notes: string;
  status: "pending" | "resolved" | "cancelled";
  newPhone?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt: string;
};

export default function Customers() {
  const { toast } = useToast();
  const { data: user } = useUser();
  const isAdmin = user && ["admin", "manager"].includes((user as any).role);

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const [phoneReqTarget, setPhoneReqTarget] = useState<User | null>(null);
  const [phoneReqNotes, setPhoneReqNotes] = useState("");

  const [resolveTarget, setResolveTarget] = useState<PhoneRequest | null>(null);
  const [resolveNewPhone, setResolveNewPhone] = useState("");

  const [showRequests, setShowRequests] = useState(false);

  const { data: customers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: phoneRequests, isLoading: loadingRequests } = useQuery<PhoneRequest[]>({
    queryKey: ["/api/admin/phone-requests"],
    enabled: isAdmin === true,
  });

  const pendingCount = phoneRequests?.filter(r => r.status === "pending").length ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: "تم حذف العميل بنجاح" });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast({ title: "فشل الحذف", description: err.message, variant: "destructive" }),
  });

  const phoneReqMutation = useMutation({
    mutationFn: (data: { clientId: string; notes: string }) =>
      apiRequest("POST", "/api/phone-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-requests"] });
      toast({ title: "تم رفع طلب تصحيح الرقم", description: "سيتم مراجعته من المسؤول قريباً" });
      setPhoneReqTarget(null);
      setPhoneReqNotes("");
    },
    onError: (err: any) => toast({ title: "فشل رفع الطلب", description: err.message, variant: "destructive" }),
  });

  const resolveMutation = useMutation({
    mutationFn: (data: { id: string; newPhone: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/phone-requests/${data.id}`, { newPhone: data.newPhone, status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: "تم تحديث الطلب وتعيين الرقم الجديد" });
      setResolveTarget(null);
      setResolveNewPhone("");
    },
    onError: (err: any) => toast({ title: "فشل", description: err.message, variant: "destructive" }),
  });

  const filtered = (customers || []).filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.fullName || "").toLowerCase().includes(q) ||
      (c.username || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q)
    );
  });

  const noPhone = filtered.filter(c => !c.phone);

  const buildWaLink  = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;
  const buildTgLink  = (phone: string) => `https://t.me/${phone.replace(/\D/g, "")}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-foreground/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative overflow-hidden" dir="rtl">
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-foreground/[0.06] dark:bg-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-foreground/60" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">قائمة العملاء</h1>
            <p className="text-sm text-foreground/40">{customers?.length || 0} عميل مسجل</p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو البريد أو الهاتف..."
            className="pr-9 bg-background border-foreground/10"
            data-testid="input-customer-search"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* No phone warning */}
      {noPhone.length > 0 && !search && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <span className="font-semibold">{noPhone.length} عميل</span> ليس لديهم رقم هاتف مسجّل — قد لا يتلقون إشعارات واتساب
          </p>
        </div>
      )}

      {/* Phone correction requests panel (admin only) */}
      {isAdmin && (
        <Card className="border-foreground/[0.06] dark:border-white/[0.08] bg-white dark:bg-white/[0.03] overflow-hidden">
          <button
            onClick={() => setShowRequests(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-foreground/[0.02] dark:hover:bg-white/[0.03] transition-colors"
            data-testid="button-toggle-phone-requests"
          >
            <div className="flex items-center gap-2.5">
              <PhoneOff className="w-4 h-4 text-foreground/50" />
              <span className="text-sm font-semibold text-foreground">طلبات تصحيح الرقم</span>
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
            {showRequests ? <ChevronUp className="w-4 h-4 text-foreground/40" /> : <ChevronDown className="w-4 h-4 text-foreground/40" />}
          </button>

          {showRequests && (
            <div className="border-t border-foreground/[0.06] dark:border-white/[0.06]">
              {loadingRequests ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-foreground/30" />
                </div>
              ) : !phoneRequests?.length ? (
                <p className="text-center text-sm text-foreground/30 py-8">لا توجد طلبات</p>
              ) : (
                <div className="divide-y divide-foreground/[0.04] dark:divide-white/[0.04]">
                  {phoneRequests.map(req => (
                    <div key={req.id} className="px-5 py-4 flex items-start gap-4 hover:bg-foreground/[0.01] dark:hover:bg-white/[0.02]" data-testid={`row-phone-request-${req.id}`}>
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${req.status === "pending" ? "bg-amber-400" : req.status === "resolved" ? "bg-emerald-400" : "bg-slate-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{req.clientName}</span>
                          {req.clientPhone && (
                            <span className="text-xs text-foreground/40 font-mono">{req.clientPhone}</span>
                          )}
                          <Badge className={`text-[9px] px-2 py-0.5 border-0 ${req.status === "pending" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" : req.status === "resolved" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-foreground/[0.06] text-foreground/50"}`}>
                            {req.status === "pending" ? "قيد الانتظار" : req.status === "resolved" ? "تم الحل" : "ملغى"}
                          </Badge>
                        </div>
                        {req.notes && <p className="text-xs text-foreground/50 mt-1 leading-relaxed">{req.notes}</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-foreground/30">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(req.createdAt).toLocaleDateString("ar-SA")}</span>
                          <span>بواسطة: {req.requestedByName}</span>
                          {req.status === "resolved" && req.newPhone && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">→ {req.newPhone}</span>
                          )}
                        </div>
                      </div>
                      {req.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs shrink-0 h-8"
                          onClick={() => { setResolveTarget(req); setResolveNewPhone(req.clientPhone || ""); }}
                          data-testid={`button-resolve-phone-request-${req.id}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                          حل الطلب
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Customers Table */}
      <Card className="overflow-hidden border-foreground/[0.06] dark:border-white/[0.08] bg-white dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-foreground/[0.06] dark:border-white/[0.06]">
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">العميل</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">الهاتف / تواصل</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider hidden md:table-cell">نوع النشاط</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider hidden lg:table-cell">تاريخ التسجيل</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(customer => {
                const rawPhone = (customer as any).whatsappNumber || customer.phone || "";
                const cleanPhone = rawPhone.replace(/\D/g, "");
                return (
                  <tr
                    key={customer.id}
                    className="border-b border-foreground/[0.03] dark:border-white/[0.04] hover:bg-foreground/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                    data-testid={`row-customer-${customer.id}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold bg-foreground dark:bg-white text-background shrink-0">
                          {customer.fullName?.[0] || "؟"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{customer.fullName}</p>
                          <p className="text-xs text-foreground/40">@{customer.username}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <a href={`mailto:${customer.email}`} className="text-sm text-foreground/60 flex items-center gap-1.5 hover:text-foreground transition-colors">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[180px]">{customer.email}</span>
                      </a>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        {customer.phone ? (
                          <a href={`tel:${customer.phone}`} className="text-sm text-foreground/70 flex items-center gap-1.5 hover:text-foreground transition-colors font-mono" data-testid={`link-phone-${customer.id}`}>
                            <Phone className="w-3.5 h-3.5 shrink-0 text-foreground/40" />
                            {customer.phone}
                          </a>
                        ) : (
                          <span className="text-xs text-amber-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            لا يوجد هاتف
                          </span>
                        )}

                        {/* Contact buttons */}
                        {cleanPhone && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <a
                              href={buildWaLink(cleanPhone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              title="فتح واتساب"
                              data-testid={`link-whatsapp-${customer.id}`}
                            >
                              <SiWhatsapp className="w-3 h-3" />
                              واتساب
                            </a>
                            <a
                              href={buildTgLink(cleanPhone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                              title="فتح تيليغرام"
                              data-testid={`link-telegram-${customer.id}`}
                            >
                              <SiTelegram className="w-3 h-3" />
                              تيليغرام
                            </a>
                          </div>
                        )}

                        {/* Wrong phone button */}
                        <button
                          onClick={() => { setPhoneReqTarget(customer); setPhoneReqNotes(""); }}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                          title="الرقم خطأ — رفع طلب تصحيح"
                          data-testid={`button-wrong-phone-${customer.id}`}
                        >
                          <PhoneOff className="w-3 h-3" />
                          الرقم خطأ؟
                        </button>
                      </div>
                    </td>

                    <td className="p-4 hidden md:table-cell">
                      {(customer as any).businessType ? (
                        <Badge className="bg-foreground/[0.05] dark:bg-white/[0.08] text-foreground/60 dark:text-white/50 border-0 text-[10px]">
                          {(customer as any).businessType}
                        </Badge>
                      ) : (
                        <span className="text-sm text-foreground/20">—</span>
                      )}
                    </td>

                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-xs text-foreground/40 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => setDeleteTarget(customer)}
                        className="p-2 rounded-lg text-foreground/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="حذف العميل"
                        data-testid={`button-delete-customer-${customer.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-foreground/30">
                    <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>{search ? "لا توجد نتائج للبحث" : "لا يوجد عملاء مسجلون بعد"}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Delete confirmation dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف حساب العميل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف حساب <span className="font-semibold text-foreground">{deleteTarget?.fullName}</span>؟
              <br />
              <span className="text-red-500 text-xs mt-1 inline-block">هذا الإجراء لا يمكن التراجع عنه.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(String(deleteTarget.id))}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف نهائياً"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Report wrong phone dialog ── */}
      <Dialog open={!!phoneReqTarget} onOpenChange={open => !open && setPhoneReqTarget(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneOff className="w-4 h-4 text-rose-500" />
              رفع طلب تصحيح الرقم
            </DialogTitle>
            <DialogDescription>
              العميل: <span className="font-semibold text-foreground">{phoneReqTarget?.fullName}</span>
              {phoneReqTarget?.phone && (
                <span className="mr-2 text-foreground/50 font-mono text-xs">{phoneReqTarget.phone}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground/60 mb-1.5 block">سبب الطلب أو الملاحظات</label>
              <Textarea
                value={phoneReqNotes}
                onChange={e => setPhoneReqNotes(e.target.value)}
                placeholder="مثال: العميل أفاد أن الرقم لا يعمل، أو تم تغيير الرقم..."
                className="resize-none text-sm"
                rows={3}
                data-testid="textarea-phone-request-notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPhoneReqTarget(null)}>إلغاء</Button>
              <Button
                className="bg-rose-500 hover:bg-rose-600 text-white gap-2"
                onClick={() => phoneReqTarget && phoneReqMutation.mutate({ clientId: String(phoneReqTarget.id), notes: phoneReqNotes })}
                disabled={phoneReqMutation.isPending}
                data-testid="button-submit-phone-request"
              >
                {phoneReqMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                رفع الطلب
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Resolve phone request dialog (admin) ── */}
      <Dialog open={!!resolveTarget} onOpenChange={open => !open && setResolveTarget(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              حل طلب تصحيح الرقم
            </DialogTitle>
            <DialogDescription>
              العميل: <span className="font-semibold text-foreground">{resolveTarget?.clientName}</span>
              {resolveTarget?.clientPhone && (
                <span className="mr-2 text-foreground/40 font-mono text-xs line-through">{resolveTarget.clientPhone}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground/60 mb-1.5 block">الرقم الجديد الصحيح</label>
              <Input
                value={resolveNewPhone}
                onChange={e => setResolveNewPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                className="font-mono"
                data-testid="input-resolve-new-phone"
              />
              <p className="text-[11px] text-foreground/40 mt-1">سيتم تحديث رقم العميل في النظام تلقائياً</p>
            </div>
            {resolveTarget?.notes && (
              <div className="bg-foreground/[0.03] dark:bg-white/[0.03] rounded-xl p-3 text-xs text-foreground/60">
                <span className="font-semibold text-foreground/40 block mb-1">ملاحظة الموظف:</span>
                {resolveTarget.notes}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResolveTarget(null)}>إلغاء</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={() => resolveTarget && resolveMutation.mutate({ id: resolveTarget.id, newPhone: resolveNewPhone, status: "resolved" })}
                disabled={resolveMutation.isPending || !resolveNewPhone.trim()}
                data-testid="button-confirm-resolve"
              >
                {resolveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                تأكيد وتحديث الرقم
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
