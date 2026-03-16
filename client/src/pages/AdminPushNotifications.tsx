import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import {
  Bell, Send, Users, CheckCircle, Zap, BellRing, Mail,
  AppWindow, Megaphone, ChevronRight, MessageSquare, MailCheck
} from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

type TargetRole = "all" | "clients" | "employees" | "admin" | "manager" | "developer" | "designer" | "support" | "sales" | "accountant";
type SendMode = "push" | "inapp" | "email";

interface BroadcastForm {
  title: string;
  body: string;
  url: string;
  targetRole: TargetRole;
}
interface EmailForm {
  subject: string;
  body: string;
  targetRole: TargetRole;
}

function getTemplates(ar: boolean) {
  return [
    {
      cat: ar ? "مناسبات" : "Occasions",
      items: [
        { title: ar ? "عيد مبارك 🌙" : "Eid Mubarak 🌙", body: ar ? "تهنئكم منصة قيروكس ستوديو بمناسبة العيد المبارك! أعاده الله عليكم بالخير واليُمن والبركات." : "Qirox Studio wishes you a blessed Eid! May it bring you joy, peace, and prosperity." },
        { title: ar ? "رمضان كريم 🌙" : "Ramadan Kareem 🌙", body: ar ? "رمضان كريم! نسأل الله أن يتقبل صيامكم وقيامكم ويتغمدكم برحمته." : "Ramadan Kareem! May this holy month bring peace and blessings to you and your family." },
        { title: ar ? "اليوم الوطني السعودي 🇸🇦" : "Saudi National Day 🇸🇦", body: ar ? "في ذكرى اليوم الوطني المجيد، نشارككم الفخر والاعتزاز بهذا الوطن العزيز. كل عام والمملكة بخير." : "Happy Saudi National Day! We're proud to serve this great nation." },
        { title: ar ? "صباح الخير ☀️" : "Good Morning ☀️", body: ar ? "صباح الخير! نتمنى لكم يوماً مليئاً بالإنجازات والنجاحات. فريق قيروكس ستوديو دائماً في خدمتكم." : "Good morning! We wish you a productive and successful day. Qirox Studio is always at your service." },
      ],
    },
    {
      cat: ar ? "خدمة" : "Service",
      items: [
        { title: ar ? "تحديث المنصة 🚀" : "Platform Update 🚀", body: ar ? "تم تحديث منصة قيروكس ستوديو بمميزات جديدة! ادخل الآن واكتشف كل الجديد." : "Qirox Studio platform has been updated with new features! Log in now to explore." },
        { title: ar ? "عرض خاص 🎁" : "Special Offer 🎁", body: ar ? "عرض لفترة محدودة! تواصل معنا الآن للحصول على التفاصيل وأفضل الأسعار." : "Limited-time offer! Contact us now for details and best prices." },
        { title: ar ? "تذكير بالمشروع 📋" : "Project Reminder 📋", body: ar ? "لديك مشروع قيد التنفيذ. يمكنك متابعة حالته من لوحة التحكم الخاصة بك." : "You have an active project in progress. Track its status from your dashboard." },
      ],
    },
  ];
}

const TARGET_OPTIONS = (ar: boolean): { value: TargetRole; label: string }[] => [
  { value: "all", label: ar ? "الجميع" : "Everyone" },
  { value: "clients", label: ar ? "العملاء فقط" : "Clients Only" },
  { value: "employees", label: ar ? "الموظفون فقط" : "Employees Only" },
  { value: "admin", label: ar ? "المدراء فقط" : "Admins Only" },
  { value: "developer", label: ar ? "المطورون" : "Developers" },
  { value: "designer", label: ar ? "المصممون" : "Designers" },
  { value: "support", label: ar ? "الدعم الفني" : "Support Team" },
  { value: "sales", label: ar ? "المبيعات" : "Sales Team" },
  { value: "accountant", label: ar ? "المحاسبون" : "Accountants" },
];

type SendResult = { sent: number; failed: number; total: number } | null;

export default function AdminPushNotifications() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const TEMPLATES = getTemplates(ar);
  const TARGETS = TARGET_OPTIONS(ar);

  const [tab, setTab] = useState<SendMode>("push");
  const [pushForm, setPushForm] = useState<BroadcastForm>({ title: "", body: "", url: "/", targetRole: "all" });
  const [inappForm, setInappForm] = useState<BroadcastForm>({ title: "", body: "", url: "/", targetRole: "all" });
  const [emailForm, setEmailForm] = useState<EmailForm>({ subject: "", body: "", targetRole: "all" });
  const [pushResult, setPushResult] = useState<SendResult>(null);
  const [inappResult, setInappResult] = useState<{ count: number } | null>(null);
  const [emailResult, setEmailResult] = useState<SendResult>(null);

  const { data: subData } = useQuery<{ count: number; registeredCount: number }>({
    queryKey: ["/api/admin/push/subscribers", pushForm.targetRole],
    queryFn: () => fetch(`/api/admin/push/subscribers?targetRole=${pushForm.targetRole}`).then(r => r.json()),
    refetchInterval: 30000,
  });

  const pushMutation = useMutation({
    mutationFn: (data: BroadcastForm) => apiRequest("POST", "/api/admin/push/broadcast", data),
    onSuccess: (res: any) => {
      setPushResult(res);
      toast({ title: ar ? `تم الإرسال: ${res.sent} نجح، ${res.failed} فشل` : `Sent: ${res.sent} ok, ${res.failed} failed` });
    },
    onError: (e: any) => toast({ title: ar ? "خطأ في الإرسال" : "Send Error", description: e.message, variant: "destructive" }),
  });

  const inappMutation = useMutation({
    mutationFn: (data: { title: string; body: string; link: string; targetRole: string }) =>
      apiRequest("POST", "/api/admin/notifications/broadcast", data),
    onSuccess: (res: any) => {
      setInappResult(res);
      toast({ title: ar ? `تم إرسال الإشعار لـ ${res.count} مستخدم` : `Notification sent to ${res.count} users` });
    },
    onError: (e: any) => toast({ title: ar ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const emailMutation = useMutation({
    mutationFn: (data: EmailForm) => apiRequest("POST", "/api/admin/email/broadcast", data),
    onSuccess: (res: any) => {
      setEmailResult(res);
      toast({ title: ar ? `تم إرسال البريد لـ ${res.sent} مستخدم` : `Email sent to ${res.sent} users` });
    },
    onError: (e: any) => toast({ title: ar ? "خطأ في إرسال البريد" : "Email Error", description: e.message, variant: "destructive" }),
  });

  const applyTemplate = (t: { title: string; body: string }) => {
    if (tab === "push") setPushForm(f => ({ ...f, title: t.title, body: t.body }));
    else if (tab === "inapp") setInappForm(f => ({ ...f, title: t.title, body: t.body }));
    else setEmailForm(f => ({ ...f, subject: t.title, body: t.body }));
  };

  const tabs: { key: SendMode; label: string; icon: any; color: string }[] = [
    { key: "push", label: ar ? "Push للمتصفح" : "Browser Push", icon: BellRing, color: "blue" },
    { key: "inapp", label: ar ? "داخل التطبيق" : "In-App", icon: AppWindow, color: "violet" },
    { key: "email", label: ar ? "بريد جماعي" : "Mass Email", icon: Mail, color: "amber" },
  ];

  const tabColors: Record<string, string> = {
    blue: "bg-blue-600 text-white",
    violet: "bg-violet-600 text-white",
    amber: "bg-amber-600 text-white",
  };
  const tabActiveBorder: Record<string, string> = {
    blue: "border-blue-500",
    violet: "border-violet-500",
    amber: "border-amber-500",
  };

  const currentTab = tabs.find(t => t.key === tab)!;

  return (
    <div className="p-4 md:p-6 space-y-6 font-sans max-w-6xl mx-auto" dir={dir}>
      <PageGraphics />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6" />
            {ar ? "مركز البث الشامل" : "Broadcast Center"}
          </h1>
          <p className="text-black/50 dark:text-white/40 text-sm mt-0.5">
            {ar ? "أرسل إشعارات وبريد لجميع المستخدمين أو فئة محددة" : "Send notifications & emails to all users or specific roles"}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 rounded-xl px-4 py-2">
          <Users className="w-4 h-4 text-black/40 dark:text-white/40" />
          <div>
            <div className="text-lg font-bold">{subData?.registeredCount ?? "—"}</div>
            <div className="text-xs text-black/40 dark:text-white/40">{ar ? "مستخدم مسجّل" : "registered users"}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/[0.05] rounded-2xl">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? tabColors[t.color] : "text-black/50 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"}`}
            data-testid={`tab-${t.key}`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">

          {tab === "push" && (
            <Card className={`border-2 ${tabActiveBorder.blue} dark:border-blue-500/40`}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-blue-500" />
                  {ar ? "إشعار Push للمتصفح" : "Browser Push Notification"}
                </CardTitle>
                <p className="text-xs text-black/40 dark:text-white/30">
                  {ar ? "يصل للمستخدمين حتى لو كانوا خارج التطبيق — شرط قبول الإشعارات في متصفحهم" : "Reaches users even when outside the app — requires browser permission"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-black/50 dark:text-white/40 mb-1 block">{ar ? "الفئة المستهدفة" : "Target Audience"}</label>
                    <Select value={pushForm.targetRole} onValueChange={v => setPushForm(f => ({ ...f, targetRole: v as TargetRole }))}>
                      <SelectTrigger className="border-black/20" data-testid="select-push-target">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGETS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="w-full bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2 text-center">
                      <div className="text-lg font-bold text-blue-600">{subData?.count ?? 0}</div>
                      <div className="text-xs text-blue-500">{ar ? "مشتركو Push" : "push subscribers"}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/40 mb-1 block">{ar ? "عنوان الإشعار *" : "Title *"}</label>
                  <Input value={pushForm.title} onChange={e => setPushForm(f => ({ ...f, title: e.target.value }))} placeholder={ar ? "عنوان واضح وجذاب..." : "Clear, catchy title..."} className="border-black/20" data-testid="input-push-title" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/40 mb-1 block">{ar ? "نص الإشعار *" : "Body *"}</label>
                  <Textarea value={pushForm.body} onChange={e => setPushForm(f => ({ ...f, body: e.target.value }))} placeholder={ar ? "محتوى الإشعار..." : "Notification content..."} className="border-black/20 min-h-20" data-testid="textarea-push-body" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/40 mb-1 block">{ar ? "رابط عند الضغط" : "Click URL"}</label>
                  <Input value={pushForm.url} onChange={e => setPushForm(f => ({ ...f, url: e.target.value }))} placeholder="/dashboard" className="border-black/20" dir="ltr" data-testid="input-push-url" />
                </div>
                {pushResult && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3 grid grid-cols-3 text-center gap-2">
                    <div><span className="text-green-600 font-bold text-lg">{pushResult.sent}</span><div className="text-xs text-black/40">{ar ? "نجح" : "success"}</div></div>
                    <div><span className="text-red-500 font-bold text-lg">{pushResult.failed}</span><div className="text-xs text-black/40">{ar ? "فشل" : "failed"}</div></div>
                    <div><span className="font-bold text-lg">{pushResult.total}</span><div className="text-xs text-black/40">{ar ? "إجمالي" : "total"}</div></div>
                  </div>
                )}
                {(subData?.count ?? 0) === 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
                    {ar ? "لا يوجد مشتركون في Push للفئة المختارة. استخدم الإشعار الداخلي أو البريد." : "No push subscribers for this target. Use In-App or Email instead."}
                  </div>
                )}
                <Button
                  onClick={() => pushMutation.mutate(pushForm)}
                  disabled={pushMutation.isPending || !pushForm.title || !pushForm.body}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  data-testid="button-send-push"
                >
                  {pushMutation.isPending ? <><Zap className="w-4 h-4 animate-pulse" /> {ar ? "جاري الإرسال..." : "Sending..."}</> : <><Send className="w-4 h-4" /> {ar ? `إرسال Push لـ ${subData?.count ?? 0} مشترك` : `Send Push to ${subData?.count ?? 0} subscribers`}</>}
                </Button>
              </CardContent>
            </Card>
          )}

          {tab === "inapp" && (
            <Card className={`border-2 ${tabActiveBorder.violet} dark:border-violet-500/40`}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AppWindow className="w-4 h-4 text-violet-500" />
                  {ar ? "إشعار داخل التطبيق" : "In-App Notification"}
                </CardTitle>
                <p className="text-xs text-black/40 dark:text-white/30">
                  {ar ? "يُحفظ في قاعدة البيانات ويظهر لكل مستخدم عند فتح التطبيق — بغض النظر عن Push" : "Stored in DB and shown to every user when they open the app — works without Push permission"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/40 mb-1 block">{ar ? "الفئة المستهدفة" : "Target Audience"}</label>
                  <Select value={inappForm.targetRole} onValueChange={v => setInappForm(f => ({ ...f, targetRole: v as TargetRole }))}>
                    <SelectTrigger className="border-black/20" data-testid="select-inapp-target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGETS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/40 mb-1 block">{ar ? "عنوان الإشعار *" : "Title *"}</label>
                  <Input value={inappForm.title} onChange={e => setInappForm(f => ({ ...f, title: e.target.value }))} placeholder={ar ? "مثال: عيد مبارك 🌙" : "e.g. New feature available 🚀"} className="border-black/20" data-testid="input-inapp-title" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/40 mb-1 block">{ar ? "نص الرسالة" : "Message Body"}</label>
                  <Textarea value={inappForm.body} onChange={e => setInappForm(f => ({ ...f, body: e.target.value }))} placeholder={ar ? "تفاصيل الإشعار..." : "Notification details..."} className="border-black/20 min-h-20" data-testid="textarea-inapp-body" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/40 mb-1 block">{ar ? "رابط الإشعار" : "Link"}</label>
                  <Input value={inappForm.url} onChange={e => setInappForm(f => ({ ...f, url: e.target.value }))} placeholder="/dashboard" className="border-black/20" dir="ltr" data-testid="input-inapp-url" />
                </div>
                {inappResult && (
                  <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-xl p-3 flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-violet-500" />
                    <span className="text-violet-700 dark:text-violet-300 font-semibold">
                      {ar ? `تم إرسال الإشعار لـ ${inappResult.count} مستخدم ✓` : `Notification delivered to ${inappResult.count} users ✓`}
                    </span>
                  </div>
                )}
                <Button
                  onClick={() => inappMutation.mutate({ title: inappForm.title, body: inappForm.body, link: inappForm.url, targetRole: inappForm.targetRole })}
                  disabled={inappMutation.isPending || !inappForm.title}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
                  data-testid="button-send-inapp"
                >
                  {inappMutation.isPending ? <><Zap className="w-4 h-4 animate-pulse" /> {ar ? "جاري الإرسال..." : "Sending..."}</> : <><MessageSquare className="w-4 h-4" /> {ar ? "إرسال للجميع داخل التطبيق" : "Send In-App to All"}</>}
                </Button>
              </CardContent>
            </Card>
          )}

          {tab === "email" && (
            <Card className={`border-2 ${tabActiveBorder.amber} dark:border-amber-500/40`}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MailCheck className="w-4 h-4 text-amber-500" />
                  {ar ? "البريد الجماعي" : "Mass Email"}
                </CardTitle>
                <p className="text-xs text-black/40 dark:text-white/30">
                  {ar ? "يُرسل إلى بريد كل مستخدم مسجّل — يضمن وصول الرسالة حتى للمستخدمين غير النشطين" : "Sent to every registered user's email — guaranteed delivery even to inactive users"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/40 mb-1 block">{ar ? "الفئة المستهدفة" : "Target Audience"}</label>
                  <Select value={emailForm.targetRole} onValueChange={v => setEmailForm(f => ({ ...f, targetRole: v as TargetRole }))}>
                    <SelectTrigger className="border-black/20" data-testid="select-email-target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGETS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/40 mb-1 block">{ar ? "موضوع البريد *" : "Subject *"}</label>
                  <Input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} placeholder={ar ? "مثال: عيد مبارك من قيروكس ستوديو" : "e.g. Happy Eid from Qirox Studio"} className="border-black/20" data-testid="input-email-subject" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/40 mb-1 block">{ar ? "نص الرسالة *" : "Message Body *"}</label>
                  <Textarea value={emailForm.body} onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))} placeholder={ar ? "محتوى البريد الإلكتروني..." : "Email content..."} className="border-black/20 min-h-28" data-testid="textarea-email-body" />
                </div>
                {emailResult && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 grid grid-cols-3 text-center gap-2">
                    <div><span className="text-green-600 font-bold text-lg">{emailResult.sent}</span><div className="text-xs text-black/40">{ar ? "أُرسل" : "sent"}</div></div>
                    <div><span className="text-red-500 font-bold text-lg">{emailResult.failed}</span><div className="text-xs text-black/40">{ar ? "فشل" : "failed"}</div></div>
                    <div><span className="font-bold text-lg">{emailResult.total}</span><div className="text-xs text-black/40">{ar ? "إجمالي" : "total"}</div></div>
                  </div>
                )}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
                  {ar ? "⚠️ تأكد من إعداد SMTP في إعدادات الاتصال قبل الإرسال." : "⚠️ Make sure SMTP is configured in Connection Settings before sending."}
                </div>
                <Button
                  onClick={() => emailMutation.mutate(emailForm)}
                  disabled={emailMutation.isPending || !emailForm.subject || !emailForm.body}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  data-testid="button-send-email"
                >
                  {emailMutation.isPending ? <><Zap className="w-4 h-4 animate-pulse" /> {ar ? "جاري الإرسال..." : "Sending..."}</> : <><Mail className="w-4 h-4" /> {ar ? "إرسال البريد الجماعي" : "Send Mass Email"}</>}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-black/10">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {ar ? "قوالب جاهزة" : "Ready Templates"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {TEMPLATES.map((group, gi) => (
                <div key={gi}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-black/30 dark:text-white/30 mb-2">{group.cat}</div>
                  <div className="space-y-1.5">
                    {group.items.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => applyTemplate(t)}
                        className={`w-full p-2.5 rounded-xl ${ar ? "text-right" : "text-left"} hover:bg-black/5 dark:hover:bg-white/5 border border-black/[0.07] dark:border-white/[0.07] hover:border-black/20 dark:hover:border-white/20 transition-all group`}
                        data-testid={`button-template-${gi}-${i}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-xs">{t.title}</div>
                          <ChevronRight className={`w-3 h-3 text-black/20 dark:text-white/20 group-hover:text-black/50 dark:group-hover:text-white/50 transition-colors ${ar ? "rotate-180" : ""}`} />
                        </div>
                        <div className="text-[10px] text-black/40 dark:text-white/30 mt-0.5 line-clamp-2">{t.body}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardHeader><CardTitle className="text-sm">{ar ? "معاينة" : "Preview"}</CardTitle></CardHeader>
            <CardContent>
              {tab === "push" || tab === "inapp" ? (
                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-black dark:bg-white flex items-center justify-center shrink-0">
                      <Bell className="w-3.5 h-3.5 text-white dark:text-black" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm leading-tight">
                        {(tab === "push" ? pushForm.title : inappForm.title) || (ar ? "عنوان الإشعار" : "Notification Title")}
                      </div>
                      <div className="text-xs text-black/40 dark:text-white/30">QIROX Studio</div>
                    </div>
                  </div>
                  <div className="text-xs text-black/60 dark:text-white/50 pr-9">
                    {(tab === "push" ? pushForm.body : inappForm.body) || (ar ? "نص الإشعار سيظهر هنا..." : "Notification body appears here...")}
                  </div>
                  <div className="text-[10px] text-black/25 dark:text-white/20 pr-9">
                    {(tab === "push" ? pushForm.url : inappForm.url) || "/"}
                  </div>
                </div>
              ) : (
                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 space-y-2">
                  <div className="text-xs font-semibold text-black/50 dark:text-white/40">{ar ? "الموضوع:" : "Subject:"}</div>
                  <div className="text-sm font-medium">{emailForm.subject || (ar ? "موضوع البريد" : "Email Subject")}</div>
                  <div className="border-t border-black/10 dark:border-white/10 pt-2 text-xs text-black/50 dark:text-white/40 whitespace-pre-wrap line-clamp-4">
                    {emailForm.body || (ar ? "نص البريد سيظهر هنا..." : "Email body appears here...")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardContent className="p-4 space-y-2">
              <div className="text-xs font-black uppercase tracking-widest text-black/30 dark:text-white/30 mb-3">{ar ? "الفرق بين القنوات" : "Channel Comparison"}</div>
              {[
                { icon: BellRing, label: ar ? "Push" : "Push", desc: ar ? "حتى خارج التطبيق — يحتاج إذناً" : "Outside app — needs permission", color: "text-blue-500" },
                { icon: AppWindow, label: ar ? "داخلي" : "In-App", desc: ar ? "لكل المسجّلين عند الفتح" : "All registered users on open", color: "text-violet-500" },
                { icon: MailCheck, label: ar ? "بريد" : "Email", desc: ar ? "يصل حتى للمعطَّلين" : "Reaches inactive users too", color: "text-amber-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                  <div>
                    <span className="text-xs font-semibold">{item.label} — </span>
                    <span className="text-xs text-black/40 dark:text-white/30">{item.desc}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
