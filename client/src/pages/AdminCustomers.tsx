import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Loader2, Users, Mail, Phone, Calendar, Search, Trash2,
  AlertTriangle, MessageCircle, X, PhoneOff, CheckCircle2,
  Clock, ChevronDown, ChevronUp, Send, Download, Building2, MapPin, Hash, Edit2, UserCheck,
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
import { useI18n } from "@/lib/i18n";

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
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const { data: user } = useUser();
  const isAdmin = user && ["admin", "manager"].includes((user as any).role);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [salesFilter, setSalesFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ address: "", city: "", taxNumber: "", organizationName: "", commercialRegistration: "" });
  const [assignTarget, setAssignTarget] = useState<User | null>(null);
  const [assignSalesRepId, setAssignSalesRepId] = useState("");

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
      toast({ title: L ? "تم حذف العميل بنجاح" : "Customer deleted successfully" });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast({ title: L ? "فشل الحذف" : "Delete failed", description: err.message, variant: "destructive" }),
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      const r = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: L ? "تم تحديث بيانات العميل" : "Customer data updated" });
      setEditTarget(null);
    },
    onError: (err: any) => toast({ title: L ? "فشل التحديث" : "Update failed", description: err.message, variant: "destructive" }),
  });

  const phoneReqMutation = useMutation({
    mutationFn: (data: { clientId: string; notes: string }) =>
      apiRequest("POST", "/api/phone-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-requests"] });
      toast({ title: L ? "تم رفع طلب تصحيح الرقم" : "Phone correction request submitted", description: L ? "سيتم مراجعته من المسؤول قريباً" : "It will be reviewed by the admin soon" });
      setPhoneReqTarget(null);
      setPhoneReqNotes("");
    },
    onError: (err: any) => toast({ title: L ? "فشل رفع الطلب" : "Failed to submit request", description: err.message, variant: "destructive" }),
  });

  const resolveMutation = useMutation({
    mutationFn: (data: { id: string; newPhone: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/phone-requests/${data.id}`, { newPhone: data.newPhone, status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: L ? "تم تحديث الطلب وتعيين الرقم الجديد" : "Request resolved and phone updated" });
      setResolveTarget(null);
      setResolveNewPhone("");
    },
    onError: (err: any) => toast({ title: L ? "فشل" : "Failed", description: err.message, variant: "destructive" }),
  });

  const assignSalesMutation = useMutation({
    mutationFn: ({ id, salesRepId }: { id: string; salesRepId: string }) =>
      apiRequest("PATCH", `/api/admin/customers/${id}/assign-sales`, { salesRepId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: L ? "تم تعيين المندوب بنجاح" : "Sales rep assigned successfully" });
      setAssignTarget(null);
      setAssignSalesRepId("");
    },
    onError: (err: any) => toast({ title: L ? "فشل التعيين" : "Assignment failed", description: err.message, variant: "destructive" }),
  });

  // Fetch sales reps for assign dropdown (admin/manager only)
  const { data: salesRepsList } = useQuery<{ id: string; fullName: string; username: string; role: string }[]>({
    queryKey: ["/api/admin/employees", "sales"],
    queryFn: async () => {
      const r = await fetch("/api/admin/employees?roles=sales,sales_manager", { credentials: "include" });
      return r.json();
    },
    enabled: !!isAdmin,
  });

  // Extract unique sales reps from customers (for filter dropdown)
  const salesReps = Array.from(
    new Map(
      (customers || [])
        .filter((c: any) => c.assignedSalesName || c.assignedSalesUsername)
        .map((c: any) => [c.assignedSalesId || c.assignedSalesUsername, { id: c.assignedSalesId || c.assignedSalesUsername, name: c.assignedSalesName || c.assignedSalesUsername }])
    ).values()
  );

  const filtered = (customers || []).filter(c => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || (
      (c.fullName || "").toLowerCase().includes(q) ||
      (c.username || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q)
    );
    const matchesSales = salesFilter === "all" ? true
      : salesFilter === "unassigned" ? !(c as any).assignedSalesId
      : ((c as any).assignedSalesId === salesFilter || (c as any).assignedSalesUsername === salesFilter);
    return matchesSearch && matchesSales;
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
    <div className="space-y-6 relative overflow-hidden" dir={dir}>
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-foreground/[0.06] dark:bg-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-foreground/60" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{L ? "قائمة العملاء" : "Customers List"}</h1>
            <p className="text-sm text-foreground/40">{customers?.length || 0} {L ? "عميل مسجل" : "registered customers"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={L ? "ابحث بالاسم أو البريد أو الهاتف..." : "Search by name, email, or phone..."}
              className="pr-9 bg-background border-foreground/10"
              data-testid="input-customer-search"
            />
          </div>
          {/* Sales rep filter */}
          <select
            value={salesFilter}
            onChange={e => setSalesFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-foreground/10 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
            data-testid="select-sales-filter"
          >
            <option value="all">{L ? "كل المندوبين" : "All Reps"}</option>
            <option value="unassigned">{L ? "غير مُسند" : "Unassigned"}</option>
            {salesReps.map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/api/admin/customers/export", "_blank")}
            className="gap-1.5 shrink-0"
            data-testid="button-export-customers"
          >
            <Download className="w-3.5 h-3.5" />
            {L ? "تصدير CSV" : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* No phone warning */}
      {noPhone.length > 0 && !search && (
        <div className="flex items-start gap-3 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl p-3.5">
          <AlertTriangle className="w-4 h-4 text-black dark:text-white mt-0.5 shrink-0" />
          <p className="text-sm text-black dark:text-white dark:text-black/70 dark:text-white/70">
            <span className="font-semibold">{noPhone.length} {L ? "عميل" : "customers"}</span> {L ? "ليس لديهم رقم هاتف مسجّل — قد لا يتلقون إشعارات واتساب" : "don't have a registered phone number — they may not receive WhatsApp notifications"}
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
              <span className="text-sm font-semibold text-foreground">{L ? "طلبات تصحيح الرقم" : "Phone Correction Requests"}</span>
              {pendingCount > 0 && (
                <span className="bg-black dark:bg-white text-white text-[10px] font-black px-2 py-0.5 rounded-full">
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
                <p className="text-center text-sm text-foreground/30 py-8">{L ? "لا توجد طلبات" : "No requests"}</p>
              ) : (
                <div className="divide-y divide-foreground/[0.04] dark:divide-white/[0.04]">
                  {phoneRequests.map(req => (
                    <div key={req.id} className="px-5 py-4 flex items-start gap-4 hover:bg-foreground/[0.01] dark:hover:bg-white/[0.02]" data-testid={`row-phone-request-${req.id}`}>
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${req.status === "pending" ? "bg-black/[0.08] dark:bg-white/[0.1]" : req.status === "resolved" ? "bg-black/[0.08] dark:bg-white/[0.1]" : "bg-slate-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{req.clientName}</span>
                          {req.clientPhone && (
                            <span className="text-xs text-foreground/40 font-mono">{req.clientPhone}</span>
                          )}
                          <Badge className={`text-[9px] px-2 py-0.5 border-0 ${req.status === "pending" ? "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70" : req.status === "resolved" ? "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70" : "bg-foreground/[0.06] text-foreground/50"}`}>
                            {req.status === "pending" ? (L ? "قيد الانتظار" : "Pending") : req.status === "resolved" ? (L ? "تم الحل" : "Resolved") : (L ? "ملغى" : "Cancelled")}
                          </Badge>
                        </div>
                        {req.notes && <p className="text-xs text-foreground/50 mt-1 leading-relaxed">{req.notes}</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-foreground/30">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(req.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</span>
                          <span>{L ? "بواسطة:" : "By:"} {req.requestedByName}</span>
                          {req.status === "resolved" && req.newPhone && (
                            <span className="text-black dark:text-white dark:text-black/70 dark:text-white/70 font-semibold">→ {req.newPhone}</span>
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
                          {L ? "حل الطلب" : "Resolve"}
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
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">{L ? "العميل" : "Customer"}</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">{L ? "البريد الإلكتروني" : "Email"}</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">{L ? "الهاتف / تواصل" : "Phone / Contact"}</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider hidden md:table-cell">{L ? "نوع النشاط" : "Business Type"}</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider hidden lg:table-cell">{L ? "تاريخ التسجيل" : "Registration Date"}</th>
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
                          <span className="text-xs text-black dark:text-white flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {L ? "لا يوجد هاتف" : "No phone"}
                          </span>
                        )}

                        {/* Contact buttons */}
                        {cleanPhone && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <a
                              href={buildWaLink(cleanPhone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:bg-white/[0.06] dark:hover:bg-black dark:bg-white transition-colors"
                              title={L ? "فتح واتساب" : "Open WhatsApp"}
                              data-testid={`link-whatsapp-${customer.id}`}
                            >
                              <SiWhatsapp className="w-3 h-3" />
                              {L ? "واتساب" : "WhatsApp"}
                            </a>
                            <a
                              href={buildTgLink(cleanPhone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:bg-white/[0.06] dark:hover:bg-black dark:bg-white transition-colors"
                              title={L ? "فتح تيليغرام" : "Open Telegram"}
                              data-testid={`link-telegram-${customer.id}`}
                            >
                              <SiTelegram className="w-3 h-3" />
                              {L ? "تيليغرام" : "Telegram"}
                            </a>
                          </div>
                        )}

                        {/* Wrong phone button */}
                        <button
                          onClick={() => { setPhoneReqTarget(customer); setPhoneReqNotes(""); }}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md text-black dark:text-white dark:text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:bg-white/[0.06] dark:hover:bg-black dark:bg-white transition-colors"
                          title={L ? "الرقم خطأ — رفع طلب تصحيح" : "Wrong number — submit correction request"}
                          data-testid={`button-wrong-phone-${customer.id}`}
                        >
                          <PhoneOff className="w-3 h-3" />
                          {L ? "الرقم خطأ؟" : "Wrong number?"}
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
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setAssignTarget(customer);
                              setAssignSalesRepId((customer as any).assignedSalesId || "");
                            }}
                            className="p-2 rounded-lg transition-colors text-foreground/20 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            title={L ? "تعيين مندوب مبيعات" : "Assign sales rep"}
                            data-testid={`button-assign-sales-${customer.id}`}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditTarget(customer);
                            setEditForm({
                              address: (customer as any).address || "",
                              city: (customer as any).city || "",
                              taxNumber: (customer as any).taxNumber || "",
                              organizationName: (customer as any).organizationName || "",
                              commercialRegistration: (customer as any).commercialRegistration || "",
                            });
                          }}
                          className="p-2 rounded-lg text-foreground/20 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                          title={L ? "تعديل بيانات العميل" : "Edit customer data"}
                          data-testid={`button-edit-customer-${customer.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(customer)}
                          className="p-2 rounded-lg text-foreground/20 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title={L ? "حذف العميل" : "Delete customer"}
                          data-testid={`button-delete-customer-${customer.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Show assigned sales rep badge */}
                      {(customer as any).assignedSalesName && (
                        <div className="mt-1">
                          <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-700/40 rounded-md px-1.5 py-0.5 font-semibold">
                            {(customer as any).assignedSalesName}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-foreground/30">
                    <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>{search ? (L ? "لا توجد نتائج للبحث" : "No search results") : (L ? "لا يوجد عملاء مسجلون بعد" : "No customers registered yet")}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Edit client data dialog ── */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent dir={dir} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {L ? "بيانات الفوترة والمؤسسة" : "Billing & Organization Data"}
            </DialogTitle>
            <DialogDescription>
              {editTarget?.fullName} — {L ? "هذه البيانات تُستخدم في الفواتير وعروض الأسعار" : "Used in invoices & quotations"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/60 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {L ? "اسم المؤسسة" : "Organization"}
                </Label>
                <Input value={editForm.organizationName} onChange={e => setEditForm(p => ({ ...p, organizationName: e.target.value }))}
                  placeholder={L ? "اسم الشركة أو المنشأة" : "Company name"}
                  className="h-9 text-sm border-foreground/10" data-testid="input-org-name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/60 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {L ? "الرقم الضريبي" : "Tax Number"}
                </Label>
                <Input value={editForm.taxNumber} onChange={e => setEditForm(p => ({ ...p, taxNumber: e.target.value }))}
                  placeholder="3XXXXXXXXXX3" dir="ltr"
                  className="h-9 text-sm border-foreground/10 font-mono" data-testid="input-tax-number" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/60 flex items-center gap-1">
                <Hash className="w-3 h-3" /> {L ? "السجل التجاري" : "Commercial Registration"}
              </Label>
              <Input value={editForm.commercialRegistration} onChange={e => setEditForm(p => ({ ...p, commercialRegistration: e.target.value }))}
                placeholder="1XXXXXXXXX" dir="ltr"
                className="h-9 text-sm border-foreground/10 font-mono" data-testid="input-commercial-reg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/60 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {L ? "العنوان" : "Address"}
                </Label>
                <Input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                  placeholder={L ? "الشارع والحي" : "Street & district"}
                  className="h-9 text-sm border-foreground/10" data-testid="input-address" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/60 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {L ? "المدينة" : "City"}
                </Label>
                <Input value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                  placeholder={L ? "الرياض، جدة..." : "Riyadh, Jeddah..."}
                  className="h-9 text-sm border-foreground/10" data-testid="input-city" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditTarget(null)} className="h-9">{L ? "إلغاء" : "Cancel"}</Button>
              <Button
                className="bg-black dark:bg-white text-white dark:text-black h-9 gap-2"
                onClick={() => editTarget && updateClientMutation.mutate({ id: String(editTarget.id), data: editForm })}
                disabled={updateClientMutation.isPending}
                data-testid="button-save-client-data"
              >
                {updateClientMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {L ? "حفظ البيانات" : "Save Data"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Assign Sales Rep dialog (B4) ── */}
      <Dialog open={!!assignTarget} onOpenChange={open => !open && setAssignTarget(null)}>
        <DialogContent dir={dir} className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              {L ? "تعيين مندوب مبيعات" : "Assign Sales Rep"}
            </DialogTitle>
            <DialogDescription>
              {assignTarget?.fullName} — {L ? "اختر المندوب المسؤول عن هذا العميل" : "Choose the rep responsible for this client"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground/60 mb-1.5 block">
                {L ? "المندوب" : "Sales Rep"}
              </label>
              <select
                value={assignSalesRepId}
                onChange={e => setAssignSalesRepId(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-md border border-foreground/10 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                data-testid="select-assign-sales-rep"
              >
                <option value="unassigned">{L ? "بدون مندوب" : "No rep assigned"}</option>
                {(salesRepsList || []).map((r: any) => (
                  <option key={r.id} value={r.id}>{r.fullName || r.username}</option>
                ))}
              </select>
            </div>
            {assignTarget && (assignTarget as any).assignedSalesName && (
              <p className="text-xs text-foreground/40 bg-foreground/[0.03] rounded-lg px-3 py-2">
                {L ? "المندوب الحالي:" : "Current rep:"} <span className="font-semibold text-foreground/60">{(assignTarget as any).assignedSalesName}</span>
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignTarget(null)} className="h-9">{L ? "إلغاء" : "Cancel"}</Button>
              <Button
                className="bg-black dark:bg-white text-white dark:text-black h-9 gap-2"
                onClick={() => assignTarget && assignSalesMutation.mutate({ id: String(assignTarget.id), salesRepId: assignSalesRepId })}
                disabled={assignSalesMutation.isPending}
                data-testid="button-confirm-assign-sales"
              >
                {assignSalesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                {L ? "حفظ التعيين" : "Save Assignment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{L ? "حذف حساب العميل" : "Delete Customer Account"}</AlertDialogTitle>
            <AlertDialogDescription>
              {L ? "هل أنت متأكد من حذف حساب" : "Are you sure you want to delete"} <span className="font-semibold text-foreground">{deleteTarget?.fullName}</span>{L ? "؟" : "?"}
              <br />
              <span className="text-black dark:text-white text-xs mt-1 inline-block">{L ? "هذا الإجراء لا يمكن التراجع عنه." : "This action cannot be undone."}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete">{L ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(String(deleteTarget.id))}
              className="bg-black dark:bg-white hover:bg-black dark:bg-white text-white"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (L ? "حذف نهائياً" : "Delete Permanently")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Report wrong phone dialog ── */}
      <Dialog open={!!phoneReqTarget} onOpenChange={open => !open && setPhoneReqTarget(null)}>
        <DialogContent dir={dir} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneOff className="w-4 h-4 text-black dark:text-white" />
              {L ? "رفع طلب تصحيح الرقم" : "Submit Phone Correction Request"}
            </DialogTitle>
            <DialogDescription>
              {L ? "العميل:" : "Customer:"} <span className="font-semibold text-foreground">{phoneReqTarget?.fullName}</span>
              {phoneReqTarget?.phone && (
                <span className="mr-2 text-foreground/50 font-mono text-xs">{phoneReqTarget.phone}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground/60 mb-1.5 block">{L ? "سبب الطلب أو الملاحظات" : "Reason or notes"}</label>
              <Textarea
                value={phoneReqNotes}
                onChange={e => setPhoneReqNotes(e.target.value)}
                placeholder={L ? "مثال: العميل أفاد أن الرقم لا يعمل، أو تم تغيير الرقم..." : "e.g. Client reported the number doesn't work, or the number has changed..."}
                className="resize-none text-sm"
                rows={3}
                data-testid="textarea-phone-request-notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPhoneReqTarget(null)}>{L ? "إلغاء" : "Cancel"}</Button>
              <Button
                className="bg-black dark:bg-white hover:bg-black dark:bg-white text-white gap-2"
                onClick={() => phoneReqTarget && phoneReqMutation.mutate({ clientId: String(phoneReqTarget.id), notes: phoneReqNotes })}
                disabled={phoneReqMutation.isPending}
                data-testid="button-submit-phone-request"
              >
                {phoneReqMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {L ? "رفع الطلب" : "Submit Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Resolve phone request dialog (admin) ── */}
      <Dialog open={!!resolveTarget} onOpenChange={open => !open && setResolveTarget(null)}>
        <DialogContent dir={dir} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
              {L ? "حل طلب تصحيح الرقم" : "Resolve Phone Correction Request"}
            </DialogTitle>
            <DialogDescription>
              {L ? "العميل:" : "Customer:"} <span className="font-semibold text-foreground">{resolveTarget?.clientName}</span>
              {resolveTarget?.clientPhone && (
                <span className="mr-2 text-foreground/40 font-mono text-xs line-through">{resolveTarget.clientPhone}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground/60 mb-1.5 block">{L ? "الرقم الجديد الصحيح" : "Correct new number"}</label>
              <Input
                value={resolveNewPhone}
                onChange={e => setResolveNewPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                className="font-mono"
                data-testid="input-resolve-new-phone"
              />
              <p className="text-[11px] text-foreground/40 mt-1">{L ? "سيتم تحديث رقم العميل في النظام تلقائياً" : "The client's phone number will be automatically updated in the system"}</p>
            </div>
            {resolveTarget?.notes && (
              <div className="bg-foreground/[0.03] dark:bg-white/[0.03] rounded-xl p-3 text-xs text-foreground/60">
                <span className="font-semibold text-foreground/40 block mb-1">{L ? "ملاحظة الموظف:" : "Staff note:"}</span>
                {resolveTarget.notes}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResolveTarget(null)}>{L ? "إلغاء" : "Cancel"}</Button>
              <Button
                className="bg-black dark:bg-white hover:bg-black dark:bg-white text-white gap-2"
                onClick={() => resolveTarget && resolveMutation.mutate({ id: resolveTarget.id, newPhone: resolveNewPhone, status: "resolved" })}
                disabled={resolveMutation.isPending || !resolveNewPhone.trim()}
                data-testid="button-confirm-resolve"
              >
                {resolveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {L ? "تأكيد وتحديث الرقم" : "Confirm & Update Phone"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
