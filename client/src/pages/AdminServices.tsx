import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Edit2, Trash2, Briefcase } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Service } from "@shared/schema";

export default function AdminServices() {
  const { toast } = useToast();
  const { data: services, isLoading } = useQuery<Service[]>({ 
    queryKey: ["/api/services"] 
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Briefcase className="w-8 h-8" />
          إدارة الخدمات
        </h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة خدمة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الخدمة</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>السعر (تبدأ من)</TableHead>
                <TableHead>المدة المتوقعة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services?.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-bold">{service.title}</TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell>{service.priceMin} ريال</TableCell>
                  <TableCell>{service.estimatedDuration}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost"><Edit2 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
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