import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, CheckCircle, XCircle } from "lucide-react";
import { type Order } from "@shared/schema";

export default function AdminOrders() {
  const { data: orders, isLoading } = useQuery<Order[]>({ 
    queryKey: ["/api/orders"] 
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
        <FileText className="w-8 h-8" />
        إدارة الطلبات
      </h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>الخدمة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>{order.userId}</TableCell>
                  <TableCell>{order.serviceId}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                      {order.status === 'pending' ? 'قيد المراجعة' : 'مكتمل'}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.totalAmount} ريال</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                        <CheckCircle className="w-4 h-4 ml-1" /> قبول
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-red-200 hover:bg-red-50">
                        <XCircle className="w-4 h-4 ml-1" /> رفض
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}