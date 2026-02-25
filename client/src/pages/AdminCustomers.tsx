import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, Mail, Phone, Calendar } from "lucide-react";
import { type User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function Customers() {
  const { data: customers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/customers"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-black/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black flex items-center gap-3">
          <Users className="w-7 h-7 text-black/40" />
          قائمة العملاء
        </h1>
        <div className="text-sm text-black/40">
          {customers?.length || 0} عميل مسجل
        </div>
      </div>

      <div className="border border-black/[0.06] bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">العميل</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الهاتف</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">نوع النشاط</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {customers?.map((customer, i) => (
                <tr key={customer.id} className="border-b border-black/[0.03] hover:bg-black/[0.02] transition-colors" data-testid={`row-customer-${customer.id}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold bg-black text-white shrink-0">
                        {customer.fullName?.[0] || "؟"}
                      </div>
                      <div>
                        <p className="font-semibold text-black text-sm">{customer.fullName}</p>
                        <p className="text-xs text-black/40">@{customer.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <a href={`mailto:${customer.email}`} className="text-sm text-black/60 flex items-center gap-1.5 hover:text-black transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                      {customer.email}
                    </a>
                  </td>
                  <td className="p-4">
                    {customer.phone ? (
                      <a href={`tel:${customer.phone}`} className="text-sm text-black/60 flex items-center gap-1.5 hover:text-black transition-colors">
                        <Phone className="w-3.5 h-3.5" />
                        {customer.phone}
                      </a>
                    ) : (
                      <span className="text-sm text-black/20">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    {customer.businessType ? (
                      <Badge className="bg-black/[0.04] text-black/50 border-0 text-[10px]">
                        {customer.businessType}
                      </Badge>
                    ) : (
                      <span className="text-sm text-black/20">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-black/40 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {(!customers || customers.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-black/30">
                    <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>لا يوجد عملاء مسجلون بعد</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
