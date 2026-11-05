import { useState } from "react";
import { useTranslate } from "@/lib/useTranslate";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DeliveryManagement } from "@/components/delivery-management";
import {
  Truck, Package, Users, Clock, TrendingUp,
  MapPin, CheckCircle, XCircle, ArrowLeft,
  RefreshCw, Zap, Globe, BarChart3
} from "lucide-react";
import { useLocation } from "wouter";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'بانتظار', color: 'bg-yellow-500' },
  accepted: { label: 'مقبول', color: 'bg-blue-500' },
  assigned: { label: 'تم التعيين', color: 'bg-indigo-500' },
  picking_up: { label: 'جاري الاستلام', color: 'bg-purple-500' },
  on_the_way: { label: 'في الطريق', color: 'bg-orange-500' },
  arrived: { label: 'وصل', color: 'bg-teal-500' },
  delivered: { label: 'تم التوصيل', color: 'bg-green-500' },
  cancelled: { label: 'ملغي', color: 'bg-red-500' },
  returned: { label: 'مرتجع', color: 'bg-gray-500' },
};

const PROVIDER_LABELS: Record<string, string> = {
  internal: 'توصيل داخلي',
  noon_food: 'نون فود',
  hunger_station: 'هنقرستيشن',
  hungerstation: 'هنقرستيشن',
  keeta: 'كيتا',
  jahez: 'جاهز',
  toyou: 'تو يو',
  mrsool: 'مرسول',
  careem: 'كريم',
};

function formatCurrency(amount: number) {
  return `${amount.toFixed(2)} ر.س`;
}

export default function ManagerDelivery() {
  const tc = useTranslate();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState("today");
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/delivery/stats", period],
    queryFn: async () => {
      const res = await fetch(`/api/delivery/stats?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: ordersData = [] } = useQuery({
    queryKey: ["/api/delivery/orders"],
    queryFn: async () => {
      const res = await fetch("/api/delivery/orders");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.orders || [];
    },
    refetchInterval: 15000,
  });

  const autoAssignMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("POST", `/api/delivery/orders/${orderId}/auto-assign`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/stats"] });
      toast({ title: tc("تم تعيين سائق بنجاح", "Driver assigned successfully"), className: "bg-green-600 text-white" });
    },
    onError: (err: any) => {
      toast({ title: err.message || tc("فشل التعيين", "Assignment failed"), variant: "destructive" });
    },
  });

  const stats = statsData?.stats;
  const activeOrders = ordersData.filter((o: any) =>
    ['pending', 'accepted', 'assigned', 'picking_up', 'on_the_way', 'arrived'].includes(o.status)
  );
  const pendingOrders = ordersData.filter((o: any) => o.status === 'pending');

  return (
    <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employee/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="w-7 h-7 text-[#2D9B6E]" />
              {tc("إدارة التوصيل", "Delivery Management")}
            </h1>
            <p className="text-sm text-muted-foreground">{tc("لوحة تحكم شاملة لإدارة الطلبات والسائقين وتطبيقات التوصيل", "Comprehensive dashboard for orders, drivers, and delivery apps")}</p>
          </div>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{tc("اليوم", "Today")}</SelectItem>
            <SelectItem value="week">{tc("الأسبوع", "Week")}</SelectItem>
            <SelectItem value="month">{tc("الشهر", "Month")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="dashboard">{tc("لوحة التحكم", "Dashboard")}</TabsTrigger>
          <TabsTrigger value="orders">{tc("الطلبات النشطة", "Active Orders")}</TabsTrigger>
          <TabsTrigger value="settings">{tc("الإعدادات", "Settings")}</TabsTrigger>
          <TabsTrigger value="integrations">{tc("الربط", "Integrations")}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-[#2D9B6E]" />
                <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
                <p className="text-xs text-muted-foreground">{tc("إجمالي الطلبات", "Total Orders")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Truck className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">{stats?.activeOrders || 0}</p>
                <p className="text-xs text-muted-foreground">{tc("طلبات نشطة", "Active Orders")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{stats?.completedOrders || 0}</p>
                <p className="text-xs text-muted-foreground">{tc("تم التوصيل", "Delivered")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{stats?.avgDeliveryTime || 0} {tc("د", "min")}</p>
                <p className="text-xs text-muted-foreground">{tc("متوسط وقت التوصيل", "Avg Delivery Time")}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> {tc("الإيرادات", "Revenue")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{tc("إجمالي المبيعات", "Total Sales")}</span>
                  <span className="font-bold">{formatCurrency(stats?.totalRevenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{tc("رسوم التوصيل", "Delivery Fees")}</span>
                  <span className="font-bold">{formatCurrency(stats?.totalDeliveryFees || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{tc("طلبات ملغية", "Cancelled Orders")}</span>
                  <span className="font-bold text-red-500">{stats?.cancelledOrders || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" /> {tc("السائقين", "Drivers")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{tc("إجمالي", "Total")}</span>
                  <span className="font-bold">{stats?.driverStats?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 text-xs">{tc("متاح", "Available")}</Badge>
                  </span>
                  <span className="font-bold text-green-600">{stats?.driverStats?.online || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 text-xs">{tc("مشغول", "Busy")}</Badge>
                  </span>
                  <span className="font-bold text-orange-600">{stats?.driverStats?.busy || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    <Badge variant="outline" className="bg-gray-500/10 text-gray-500 text-xs">{tc("غير متصل", "Offline")}</Badge>
                  </span>
                  <span className="font-bold text-gray-500">{stats?.driverStats?.offline || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats?.providerBreakdown && Object.keys(stats.providerBreakdown).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" /> {tc("حسب مصدر الطلب", "By Order Source")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(stats.providerBreakdown).map(([provider, data]: [string, any]) => (
                    <div key={provider} className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-sm font-bold">{PROVIDER_LABELS[provider] || provider}</p>
                      <p className="text-lg font-bold text-[#2D9B6E]">{data.orders}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(data.revenue)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pendingOrders.length > 0 && (
            <Card className="border-orange-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                  <Zap className="w-4 h-4 animate-pulse" /> {tc("طلبات تحتاج تعيين", "Orders Needing Assignment")} ({pendingOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <div>
                      <p className="font-bold text-sm">{order.customerName || tc('عميل', 'Customer')}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.customerAddress || tc('عنوان غير محدد', 'Address not specified')}
                      </p>
                      {order.externalProvider && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {PROVIDER_LABELS[order.externalProvider] || order.externalProvider}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{formatCurrency(order.totalAmount || 0)}</span>
                      <Button
                        size="sm"
                        onClick={() => autoAssignMutation.mutate(order.id)}
                        disabled={autoAssignMutation.isPending}
                        className="bg-[#2D9B6E] hover:bg-[#258a5e]"
                      >
                        <Zap className="w-3 h-3 ml-1" />
                        {tc("تعيين تلقائي", "Auto Assign")}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <Package className="w-5 h-5" />
              {tc("الطلبات النشطة", "Active Orders")} ({activeOrders.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/delivery/orders"] });
              }}
            >
              <RefreshCw className="w-4 h-4 ml-1" />
              {tc("تحديث", "Refresh")}
            </Button>
          </div>

          {activeOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{tc("لا توجد طلبات نشطة حالياً", "No active orders at the moment")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order: any) => {
                const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-500' };
                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold">{order.customerName || tc('عميل', 'Customer')}</p>
                            <Badge className={`${statusInfo.color} text-white text-xs`}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.customerAddress || tc('عنوان غير محدد', 'Address not specified')}
                          </p>
                          {order.externalProvider && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {PROVIDER_LABELS[order.externalProvider] || order.externalProvider}
                            </Badge>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-bold">{formatCurrency(order.totalAmount || 0)}</p>
                          {order.deliveryFee > 0 && (
                            <p className="text-xs text-muted-foreground">{tc("توصيل:", "Delivery:")} {formatCurrency(order.deliveryFee)}</p>
                          )}
                        </div>
                      </div>

                      {order.driverName && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                          <Users className="w-4 h-4 text-[#2D9B6E]" />
                          <span className="font-medium">{order.driverName}</span>
                          {order.driverPhone && <span className="text-muted-foreground">({order.driverPhone})</span>}
                        </div>
                      )}

                      {order.status === 'pending' && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => autoAssignMutation.mutate(order.id)}
                            disabled={autoAssignMutation.isPending}
                            className="bg-[#2D9B6E] hover:bg-[#258a5e]"
                          >
                            <Zap className="w-3 h-3 ml-1" />
                            {tc("تعيين تلقائي", "Auto Assign")}
                          </Button>
                        </div>
                      )}

                      {order.estimatedDeliveryTime && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tc("التوصيل المتوقع:", "Est. delivery:")} {new Date(order.estimatedDeliveryTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <DeliveryManagement />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#2D9B6E]" />
                {tc("رابط الـ Webhook", "Webhook URL")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {tc("استخدم الروابط أدناه لاستقبال الطلبات تلقائياً من تطبيقات التوصيل. أدخل الرابط المناسب في إعدادات كل تطبيق.", "Use the URLs below to receive orders automatically from delivery apps. Enter the relevant URL in each app's settings.")}
              </p>
              {['hungerstation', 'jahez', 'toyou', 'mrsool', 'noon_food', 'keeta', 'careem'].map(provider => (
                <div key={provider} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-bold min-w-24">{PROVIDER_LABELS[provider] || provider}</span>
                  <code className="text-xs bg-background p-2 rounded flex-1 overflow-x-auto border">
                    {`${window.location.origin}/api/webhooks/delivery/${provider}`}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/delivery/${provider}`);
                      toast({ title: tc("تم النسخ", "Copied!"), className: "bg-green-600 text-white" });
                    }}
                  >
                    {tc("نسخ", "Copy")}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{tc("ملاحظات الربط", "Integration Notes")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• {tc('يجب تفعيل الربط مع كل تطبيق من تبويب "الإعدادات" أولاً', 'Integration must be activated for each app from the "Settings" tab first')}</p>
              <p>• {tc('عند تفعيل "القبول التلقائي"، سيتم تعيين أقرب سائق متاح تلقائياً', 'When "Auto Accept" is enabled, the nearest available driver will be assigned automatically')}</p>
              <p>• {tc('الطلبات الواردة ستظهر في تبويب "الطلبات النشطة" فوراً', 'Incoming orders will appear in the "Active Orders" tab immediately')}</p>
              <p>• {tc('تأكد من إدخال مفتاح الـ API الصحيح لكل تطبيق', 'Make sure to enter the correct API key for each app')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
