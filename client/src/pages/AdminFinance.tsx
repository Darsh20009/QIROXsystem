import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wallet, TrendingUp, Users, CreditCard } from "lucide-react";
import { type Order } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminFinance() {
  const { data: orders, isLoading } = useQuery<Order[]>({ 
    queryKey: ["/api/orders"] 
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  const totalRevenue = orders?.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0) || 0;
  const pendingPayments = orders?.filter(o => !o.isDepositPaid).reduce((acc, curr) => acc + (curr.totalAmount || 0), 0) || 0;

  const chartData = [
    { name: 'يناير', value: 4000 },
    { name: 'فبراير', value: 3000 },
    { name: 'مارس', value: 2000 },
    { name: 'أبريل', value: 2780 },
    { name: 'مايو', value: 1890 },
  ];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
        <Wallet className="w-8 h-8" />
        الإدارة المالية
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرباح</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue} ريال</div>
            <p className="text-xs text-muted-foreground">+20.1% من الشهر الماضي</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرواتب المستحقة</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,500 ريال</div>
            <p className="text-xs text-muted-foreground">لعدد 5 موظفين</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">دفعات قيد الانتظار</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments} ريال</div>
            <p className="text-xs text-muted-foreground">من {orders?.filter(o => !o.isDepositPaid).length} طلبات</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>تحليل الأرباح الشهرية</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}