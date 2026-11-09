import { useState, useMemo } from 'react';
import { useTranslate } from "@/lib/useTranslate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUp, Download, Filter, Printer } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import SarIcon from "@/components/sar-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ['#f97316', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

export default function AdminReports() {
  const tc = useTranslate();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [timePeriod, setTimePeriod] = useState('month');
  const [reportType, setReportType] = useState('revenue');

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    },
  });

  const { data: coffeeItems = [] } = useQuery({
    queryKey: ['/api/coffee-items'],
    queryFn: async () => {
      const res = await fetch('/api/coffee-items');
      if (!res.ok) throw new Error('Failed to fetch items');
      return res.json();
    },
  });

  // Generate date-based data
  const getDateRange = (period: string) => {
    const today = new Date();
    const data: any[] = [];

    if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
          fullDate: date.toISOString().split('T')[0],
          revenue: 0,
          orders: 0,
        });
      }
    } else if (period === 'month') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const day = date.getDate();
        if (day <= 7 || day % 7 === 0) {
          data.push({
            date: `${day}`,
            fullDate: date.toISOString().split('T')[0],
            revenue: 0,
            orders: 0,
          });
        }
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        data.push({
          date: date.toLocaleDateString('ar-SA', { month: 'short' }),
          fullDate: date.toISOString().split('T')[0],
          revenue: 0,
          orders: 0,
        });
      }
    }

    return data;
  };

  const revenueData = useMemo(() => {
    const dateData = getDateRange(timePeriod);
    orders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      const entry = dateData.find((d: any) => d.fullDate === orderDate || d.fullDate.startsWith(orderDate.substring(0, 7)));
      if (entry) {
        entry.revenue = (entry.revenue || 0) + (order.totalAmount || 0);
        entry.orders = (entry.orders || 0) + 1;
      }
    });
    return dateData.slice(-10);
  }, [orders, timePeriod]);

  const topProducts = useMemo(() => {
    const productMap: any = {};
    orders.forEach((order: any) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const itemId = item.coffeeItemId || item.id;
        const product = coffeeItems.find((c: any) => c.id === itemId);
        if (product) {
          productMap[itemId] = {
            name: product.nameAr,
            sold: (productMap[itemId]?.sold || 0) + (item.quantity || 1),
            revenue: (productMap[itemId]?.revenue || 0) + ((item.totalPrice || item.quantity * product.price) || 0),
          };
        }
      });
    });
    return Object.values(productMap).sort((a: any, b: any) => b.sold - a.sold).slice(0, 6);
  }, [orders, coffeeItems]);

  const employeePerformance = useMemo(() => {
    const empMap: any = {};
    orders.forEach((order: any) => {
      const empId = order.employeeId || 'unknown';
      const employee = employees.find((e: any) => e.id === empId);
      if (empId !== 'unknown' && employee) {
        empMap[empId] = {
          name: employee.fullName,
          orders: (empMap[empId]?.orders || 0) + 1,
          revenue: (empMap[empId]?.revenue || 0) + (order.totalAmount || 0),
        };
      }
    });
    return Object.values(empMap).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 8);
  }, [orders, employees]);

  const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const StatBox = ({ label, value, trend, icon: Icon }: any) => (
    <Card className="border-0 bg-gradient-to-br from-card to-background">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-emerald-600 dark:text-emerald-400 text-sm">
            <ArrowUp className="w-4 h-4" />
            <span>{trend}% {tc("من الشهر الماضي", "vs last month")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const { data: businessConfig, refetch: refetchConfig } = useQuery({
    queryKey: ['/api/business-config'],
    queryFn: async () => {
      const res = await fetch('/api/business-config');
      return res.json();
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiRequest('PATCH', '/api/business-config', updates);
      return res.json();
    },
    onSuccess: () => {
      refetchConfig();
      toast({ title: tc("تم تحديث الإعدادات", "Settings updated") });
    }
  });

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const handleBulkPrint = async () => {
    if (selectedOrders.length === 0) return;
    const res = await apiRequest('POST', '/api/orders/bulk-print-employee', { orderIds: selectedOrders });
    const orders = await res.json();
    const { printBulkEmployeeInvoices } = await import('@/lib/print-utils');
    printBulkEmployeeInvoices(orders);
  };

  return (
    <div className="p-6 space-y-8 bg-white dark:bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">{tc("التقارير والتحليلات", "Reports & Analytics")}</h1>
          <p className="text-muted-foreground mt-1">{tc("تحليل شامل لأداء المبيعات والعمليات", "Comprehensive analysis of sales performance and operations")}</p>
        </div>
        <div className="flex gap-3">
          <Card className="flex items-center gap-4 px-4 py-2">
            <span className="text-sm font-medium">{tc("فاتورة الموظف (ملخص)", "Employee Invoice (Summary)")}</span>
            <input 
              type="checkbox" 
              checked={businessConfig?.employeeInvoiceEnabled || false} 
              onChange={(e) => updateConfigMutation.mutate({ employeeInvoiceEnabled: e.target.checked })}
              className="w-4 h-4 cursor-pointer"
            />
          </Card>
          <Button variant="outline" data-testid="button-export-report">
            <Download className="w-4 h-4 ml-2" />
            {tc("تصدير", "Export")}
          </Button>
        </div>
      </div>

      {/* Bulk Print Actions */}
      {selectedOrders.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20 flex justify-between items-center">
          <span className="font-medium">{selectedOrders.length} {tc("طلبات مختارة", "orders selected")}</span>
          <Button onClick={handleBulkPrint} size="sm">
            <Printer className="w-4 h-4 ml-2" />
            {tc("طباعة فواتير الموظفين", "Print Employee Invoices")}
          </Button>
        </Card>
      )}


      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-40" data-testid="select-time-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{tc("هذا الأسبوع", "This Week")}</SelectItem>
            <SelectItem value="month">{tc("هذا الشهر", "This Month")}</SelectItem>
            <SelectItem value="year">{tc("هذا العام", "This Year")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox label={tc("إجمالي الإيرادات", "Total Revenue")} value={`${totalRevenue.toFixed(0)} ${tc("ر.س","SAR")}`} trend="12" />
        <StatBox label={tc("عدد الطلبات", "Total Orders")} value={totalOrders} trend="8" />
        <StatBox label={tc("متوسط الطلب", "Avg Order Value")} value={`${averageOrderValue.toFixed(2)} ${tc("ر.س","SAR")}`} trend="5" />
        <StatBox label={tc("عدد الموظفين النشطين", "Active Employees")} value={employees.filter((e: any) => e.isActivated === 1).length} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="border-0 bg-white dark:bg-card">
          <CardHeader className="pb-4">
            <CardTitle>{tc("اتجاه الإيرادات", "Revenue Trend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 4 }}
                  name={tc("الإيرادات (ر.س)", "Revenue (SAR)")}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Count */}
        <Card className="border-0 bg-white dark:bg-card">
          <CardHeader className="pb-4">
            <CardTitle>{tc("عدد الطلبات اليومية", "Daily Orders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="orders" fill="#f97316" name={tc("الطلبات", "Orders")} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Employee Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="border-0 bg-white dark:bg-card">
          <CardHeader className="pb-4">
            <CardTitle>{tc("أفضل المنتجات مبيعاً", "Top Selling Products")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" width={80} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="sold" fill="#f97316" name={tc("المبيعات", "Sales")} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card className="border-0 bg-white dark:bg-card">
          <CardHeader className="pb-4">
            <CardTitle>{tc("أداء الموظفين", "Employee Performance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employeePerformance.map((emp: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-sm text-muted-foreground">{emp.orders} {tc("طلب", "orders")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-accent dark:text-accent">{emp.revenue.toFixed(0)} <SarIcon /></p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Distribution */}
      <Card className="border-0 bg-white dark:bg-card">
        <CardHeader className="pb-4">
          <CardTitle>{tc("توزيع المبيعات حسب الفئة", "Sales Distribution by Category")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={topProducts}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, sold }) => `${name}: ${sold}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="sold"
              >
                {topProducts.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card className="border-0 bg-white dark:bg-card">
        <CardHeader className="pb-4">
          <CardTitle>تفاصيل الطلبات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-accent dark:border-accent/30">
                  <th className="p-4 w-10"></th>
                  <th className="text-right p-4 font-semibold">{tc("رقم الطلب", "Order #")}</th>
                  <th className="text-right p-4 font-semibold">{tc("العميل", "Customer")}</th>
                  <th className="text-right p-4 font-semibold">{tc("الموظف", "Employee")}</th>
                  <th className="text-right p-4 font-semibold">{tc("المبلغ", "Amount")}</th>
                  <th className="text-right p-4 font-semibold">{tc("التاريخ", "Date")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(-10).reverse().map((order: any) => {
                  const emp = employees.find((e: any) => e.id === order.employeeId);
                  return (
                    <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedOrders([...selectedOrders, order.id]);
                            else setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                          }}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-4">{order.orderNumber}</td>
                      <td className="p-4 text-muted-foreground">{order.customerInfo?.name || tc('زائر', 'Guest')}</td>
                      <td className="p-4">{emp?.fullName || '-'}</td>
                      <td className="p-4 font-bold text-accent dark:text-accent">{order.totalAmount?.toFixed(2)} <SarIcon /></td>
                      <td className="p-4 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
