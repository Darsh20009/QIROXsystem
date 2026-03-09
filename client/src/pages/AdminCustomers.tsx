import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Mail, Phone, Calendar, Search, Trash2, AlertTriangle, MessageCircle, X } from "lucide-react";
import { type User } from "@shared/schema";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Customers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: customers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/customers"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: "تم حذف العميل بنجاح" });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast({ title: "فشل الحذف", description: err.message, variant: "destructive" });
    },
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
            <span className="font-semibold">{noPhone.length} عميل</span> ليس لديهم رقم هاتف مسجّل — قد لا يتلقون إشعارات WhatsApp
          </p>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden border-foreground/[0.06] dark:border-white/[0.08] bg-white dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-foreground/[0.06] dark:border-white/[0.06]">
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">العميل</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">الهاتف / واتساب</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider hidden md:table-cell">نوع النشاط</th>
                <th className="text-right p-4 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider hidden lg:table-cell">تاريخ التسجيل</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(customer => {
                const waNumber = (customer as any).whatsappNumber || customer.phone;
                const waLink = waNumber ? `https://wa.me/${waNumber.replace(/\D/g, "")}` : null;
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
                      <div className="flex flex-col gap-1">
                        {customer.phone ? (
                          <a href={`tel:${customer.phone}`} className="text-sm text-foreground/60 flex items-center gap-1.5 hover:text-foreground transition-colors" data-testid={`link-phone-${customer.id}`}>
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {customer.phone}
                          </a>
                        ) : (
                          <span className="text-xs text-amber-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            لا يوجد هاتف
                          </span>
                        )}
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 hover:underline"
                            data-testid={`link-whatsapp-${customer.id}`}
                          >
                            <MessageCircle className="w-3 h-3" />
                            واتساب
                          </a>
                        )}
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

      {/* Delete confirmation dialog */}
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
    </div>
  );
}
