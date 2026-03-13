// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bell, Send, Users, CheckCircle, Zap, Globe, BellRing } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const TEMPLATES = [
  { title: "ترحيب بعميل جديد", body: "مرحباً بك في قيروكس ستوديو! نحن سعداء بانضمامك إلينا." },
  { title: "تحديث النظام", body: "تم تحديث المنصة بمميزات جديدة. اكتشفها الآن!" },
  { title: "عرض خاص", body: "لا تفوت عرضنا الحصري! تواصل معنا الآن للحصول على التفاصيل." },
  { title: "تذكير بالمشروع", body: "لديك مشروع قيد التنفيذ. يمكنك متابعة حالته من لوحة التحكم." },
];

export default function AdminPushNotifications() {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", body: "", url: "/" });
  const [result, setResult] = useState<any>(null);

  const { data: subData } = useQuery<any>({ queryKey: ["/api/admin/push/subscribers"], refetchInterval: 30000 });

  const broadcastMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/push/broadcast", data),
    onSuccess: (res: any) => {
      setResult(res);
      toast({ title: `تم الإرسال: ${res.sent} نجح، ${res.failed} فشل` });
    },
    onError: (e: any) => toast({ title: "خطأ في الإرسال", description: e.message, variant: "destructive" }),
  });

  const handleTemplate = (t: { title: string; body: string }) => {
    setForm(f => ({ ...f, title: t.title, body: t.body }));
  };

  const subscriberCount = subData?.count || 0;

  return (
    <div className="p-6 space-y-6 font-sans" dir="rtl">
      <PageGraphics />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">إشعارات Push</h1>
          <p className="text-black/50 text-sm">إرسال إشعارات فورية لجميع المستخدمين المشتركين</p>
        </div>
        <div className="flex items-center gap-3 bg-black/5 rounded-xl px-4 py-2">
          <Users className="w-4 h-4 text-black/40" />
          <div>
            <div className="text-lg font-bold">{subscriberCount}</div>
            <div className="text-xs text-black/40">مشترك في الإشعارات</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-black/10 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <BellRing className="w-6 h-6 text-blue-500 mb-2" />
            <div className="text-lg font-bold text-blue-700">{subscriberCount}</div>
            <div className="text-xs text-blue-500">مشتركون نشطون</div>
          </CardContent>
        </Card>
        <Card className="border-black/10 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
            <div className="text-lg font-bold text-green-700">{result?.sent || 0}</div>
            <div className="text-xs text-green-500">آخر إرسال ناجح</div>
          </CardContent>
        </Card>
        <Card className="border-black/10 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="p-4">
            <Globe className="w-6 h-6 text-purple-500 mb-2" />
            <div className="text-lg font-bold text-purple-700">{result?.total || 0}</div>
            <div className="text-xs text-purple-500">إجمالي آخر بث</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-4">
          <Card className="border-black/10">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> إنشاء إشعار</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">عنوان الإشعار *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="عنوان واضح وجذاب..." className="border-black/20" data-testid="input-notification-title" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">نص الإشعار *</label>
                <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="محتوى الإشعار الذي سيظهر للمستخدم..." className="border-black/20 min-h-24" data-testid="textarea-notification-body" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">رابط الضغط (اختياري)</label>
                <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="/dashboard أو أي رابط" className="border-black/20" dir="ltr" data-testid="input-notification-url" />
              </div>

              {result && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-1"><CheckCircle className="w-4 h-4" /> تم الإرسال</div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div><span className="text-green-600 font-bold">{result.sent}</span><br /><span className="text-black/40">نجح</span></div>
                    <div><span className="text-red-500 font-bold">{result.failed}</span><br /><span className="text-black/40">فشل</span></div>
                    <div><span className="font-bold">{result.total}</span><br /><span className="text-black/40">إجمالي</span></div>
                  </div>
                </div>
              )}

              {subscriberCount === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  لا يوجد مشتركون في الإشعارات حتى الآن. يمكن للمستخدمين الاشتراك من متصفحاتهم.
                </div>
              )}

              <Button onClick={() => broadcastMutation.mutate(form)} disabled={broadcastMutation.isPending || !form.title || !form.body || subscriberCount === 0} className="w-full bg-black text-white hover:bg-black/80 gap-2" data-testid="button-send-broadcast">
                {broadcastMutation.isPending ? (
                  <span className="flex items-center gap-2"><Zap className="w-4 h-4 animate-pulse" /> جاري الإرسال...</span>
                ) : (
                  <span className="flex items-center gap-2"><Send className="w-4 h-4" /> إرسال لـ {subscriberCount} مشترك</span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2 space-y-4">
          <Card className="border-black/10">
            <CardHeader><CardTitle className="text-sm">قوالب جاهزة</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => handleTemplate(t)} className="w-full text-right p-3 rounded-xl hover:bg-black/5 border border-black/10 hover:border-black/20 transition-all" data-testid={`button-template-${i}`}>
                  <div className="font-medium text-sm">{t.title}</div>
                  <div className="text-xs text-black/40 mt-0.5 line-clamp-2">{t.body}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardHeader><CardTitle className="text-sm">معاينة الإشعار</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-black/5 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-black flex items-center justify-center"><Bell className="w-3 h-3 text-white" /></div>
                  <div className="font-semibold text-sm">{form.title || "عنوان الإشعار"}</div>
                </div>
                <div className="text-xs text-black/60 pr-8">{form.body || "نص الإشعار سيظهر هنا..."}</div>
                <div className="text-xs text-black/30 pr-8">{form.url || "/"}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
