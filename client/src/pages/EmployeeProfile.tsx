import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Save, Briefcase, CreditCard, Umbrella, X, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  vacationDays?: number;
  vacationUsed?: number;
  bankName?: string;
  bankAccount?: string;
  bankIBAN?: string;
  nationalId?: string;
  hireDate?: string;
  jobTitle?: string;
}

export default function EmployeeProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<Profile>>({});
  const [newSkill, setNewSkill] = useState("");

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["/api/employee/profile"],
    queryFn: async () => {
      const r = await fetch("/api/employee/profile");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { data: payroll } = useQuery({
    queryKey: ["/api/employee/payroll"],
    queryFn: async () => {
      const r = await fetch("/api/employee/payroll");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/employee/profile", form).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      toast({ title: "تم حفظ الملف الشخصي" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setForm(p => ({ ...p, skills: [...(p.skills || []), newSkill.trim()] }));
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setForm(p => ({ ...p, skills: (p.skills || []).filter(s => s !== skill) }));
  };

  const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">ملفي الشخصي</h1>
            <p className="text-xs text-black/35 dark:text-white/35">معلوماتي المهنية والبنكية</p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="bg-black dark:bg-white text-white dark:text-black gap-2" data-testid="button-save-profile">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </Button>
      </div>

      {/* Vacation Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي أيام الإجازة", value: profile?.vacationDays || 21, color: "text-blue-500", icon: Umbrella },
          { label: "إجازات مستخدمة", value: profile?.vacationUsed || 0, color: "text-yellow-500", icon: Umbrella },
          { label: "إجازات متبقية", value: (profile?.vacationDays || 21) - (profile?.vacationUsed || 0), color: "text-green-500", icon: Umbrella },
        ].map((s, i) => (
          <Card key={i} className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-black text-black dark:text-white">{s.value}</p>
              <p className="text-[11px] text-black/40 dark:text-white/40 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Professional Info */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> المعلومات المهنية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">المسمى الوظيفي</label>
              <Input value={form.jobTitle || ""} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
                placeholder="e.g. Senior Developer" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                data-testid="input-job-title" />
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">تاريخ التعيين</label>
              <Input type="date" value={form.hireDate ? new Date(form.hireDate).toISOString().split("T")[0] : ""}
                onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))}
                className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">نبذة شخصية</label>
            <Textarea value={form.bio || ""} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="اكتب نبذة مختصرة عن نفسك..." rows={3}
              className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
              data-testid="input-bio" />
          </div>
          <div>
            <label className="text-xs text-black/40 dark:text-white/40 mb-2 block">المهارات</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.skills || []).map(skill => (
                <Badge key={skill} className="bg-black/[0.06] dark:bg-white/[0.06] text-black dark:text-white gap-1.5 pr-1.5">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSkill()}
                placeholder="أضف مهارة..." className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                data-testid="input-skill" />
              <Button size="sm" variant="outline" onClick={addSkill} className="dark:border-white/10 dark:text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Info */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> معلومات بنكية (سرية)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">اسم البنك</label>
              <Input value={form.bankName || ""} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))}
                placeholder="البنك الأهلي" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">رقم الحساب</label>
              <Input value={form.bankAccount || ""} onChange={e => setForm(p => ({ ...p, bankAccount: e.target.value }))}
                placeholder="XXXX-XXXX" dir="ltr" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">رقم IBAN</label>
              <Input value={form.bankIBAN || ""} onChange={e => setForm(p => ({ ...p, bankIBAN: e.target.value }))}
                placeholder="SA..." dir="ltr" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">رقم الهوية</label>
              <Input value={form.nationalId || ""} onChange={e => setForm(p => ({ ...p, nationalId: e.target.value }))}
                placeholder="1xxxxxxxxx" dir="ltr" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Payroll */}
      {(payroll || []).length > 0 && (
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">كشف رواتبي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(payroll || []).slice(0, 6).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-sm border-b border-black/[0.04] dark:border-white/[0.04] pb-2 last:border-0">
                  <span className="text-black/50 dark:text-white/50">{MONTHS_AR[(r.month || 1) - 1]} {r.year}</span>
                  <span className="font-bold text-black dark:text-white">{r.netSalary.toLocaleString()} ر.س</span>
                  <Badge className={r.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                    {r.status === "paid" ? "مدفوع" : "معلق"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
