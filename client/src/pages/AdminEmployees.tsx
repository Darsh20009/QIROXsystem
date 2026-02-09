import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, UserPlus, Edit2, UserX } from "lucide-react";
import { type User } from "@shared/schema";

export default function AdminEmployees() {
  const { data: users, isLoading } = useQuery<User[]>({ 
    queryKey: ["/api/admin/users"] 
  });

  const employees = users?.filter(u => u.role !== 'client');

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Users className="w-8 h-8" />
          إدارة الموظفين
        </h1>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          إضافة موظف
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-bold">{emp.fullName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{emp.role}</Badge>
                  </TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700">نشط</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost"><Edit2 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive"><UserX className="w-4 h-4" /></Button>
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