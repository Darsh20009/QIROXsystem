import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  HelpCircle, MessageSquare, LifeBuoy, BookOpen, ChevronDown, ChevronUp,
  Send, Headphones, FileText, Shield, CreditCard, Settings, Loader2, CheckCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";

const FAQ_ITEMS = [
  {
    q: "كيف أبدأ مشروعي الأول؟",
    qEn: "How do I start my first project?",
    a: "يمكنك البدء بتصفح صفحة الباقات واختيار الخطة المناسبة لاحتياجاتك، ثم استكمال نموذج الطلب. سيتواصل معك فريقنا خلال 24 ساعة.",
    aEn: "Browse the pricing page, choose a plan that fits your needs, then complete the order form. Our team will contact you within 24 hours.",
    icon: BookOpen,
  },
  {
    q: "كيف أتابع حالة مشروعي؟",
    qEn: "How do I track my project status?",
    a: "من لوحة التحكم يمكنك رؤية جميع مشاريعك وحالتها ونسبة الإنجاز. يمكنك أيضاً التواصل مع مدير المشروع عبر صفحة الرسائل.",
    aEn: "From your dashboard, you can see all your projects, their status, and completion progress. You can also communicate with your project manager via the Messages page.",
    icon: FileText,
  },
  {
    q: "كيف أرسل طلب تعديل؟",
    qEn: "How do I submit a modification request?",
    a: "انتقل إلى صفحة 'طلبات التعديل' من لوحة التحكم، ثم اضغط على 'طلب تعديل جديد' واملأ تفاصيل التعديل المطلوب.",
    aEn: "Go to the 'Modification Requests' page from your dashboard, click 'New Request', and fill in the details of the requested modification.",
    icon: Settings,
  },
  {
    q: "كيف أستخدم المحفظة الإلكترونية؟",
    qEn: "How do I use my e-wallet?",
    a: "يمكنك شحن محفظتك الإلكترونية من صفحة 'محفظتي' واستخدام الرصيد للدفع السريع للخدمات والمنتجات.",
    aEn: "You can top up your e-wallet from the 'My Wallet' page and use the balance for quick payments for services and products.",
    icon: CreditCard,
  },
  {
    q: "كيف أتواصل مع الدعم الفني؟",
    qEn: "How do I contact technical support?",
    a: "يمكنك إرسال تذكرة دعم من صفحة 'الدعم الفني'، أو التحدث مباشرة مع فريقنا عبر 'خدمة العملاء'. كما يمكنك استخدام نموذج التواصل أدناه.",
    aEn: "You can submit a support ticket from the 'Support' page, chat directly with our team via 'Customer Service', or use the contact form below.",
    icon: Headphones,
  },
  {
    q: "هل بياناتي آمنة؟",
    qEn: "Is my data secure?",
    a: "نعم، نحن نستخدم أحدث تقنيات التشفير وحماية البيانات. جميع المعلومات محمية بتشفير SSL ونظام مصادقة متقدم.",
    aEn: "Yes, we use the latest encryption and data protection technologies. All information is protected with SSL encryption and an advanced authentication system.",
    icon: Shield,
  },
];

const HELP_LINKS = [
  { title: "الدعم الفني", titleEn: "Support Tickets", url: "/support", icon: LifeBuoy, desc: "أرسل تذكرة دعم فني", descEn: "Submit a support ticket" },
  { title: "خدمة العملاء", titleEn: "Customer Service", url: "/cs-chat", icon: Headphones, desc: "تحدث مع فريقنا مباشرة", descEn: "Chat with our team directly" },
  { title: "الرسائل", titleEn: "Messages", url: "/inbox", icon: MessageSquare, desc: "تواصل مع مدير مشروعك", descEn: "Communicate with your project manager" },
];

export default function ClientHelp() {
  const { toast } = useToast();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const sendMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/contact", form).then(r => r.json()),
    onSuccess: () => {
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      toast({ title: ar ? "تم إرسال رسالتك بنجاح" : "Message sent successfully" });
    },
    onError: () => toast({ title: ar ? "حدث خطأ" : "An error occurred", variant: "destructive" }),
  });

  return (
    <div className="relative overflow-hidden space-y-8" dir={ar ? "rtl" : "ltr"}>
      <PageGraphics variant="dashboard" />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-white dark:text-black" />
        </div>
        <div>
          <h1 className="text-xl font-black text-black dark:text-white" data-testid="text-page-title">
            {ar ? "مركز المساعدة" : "Help Center"}
          </h1>
          <p className="text-xs text-black/35 dark:text-white/35">
            {ar ? "إجابات سريعة وطرق التواصل مع فريقنا" : "Quick answers and ways to contact our team"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {HELP_LINKS.map(link => (
          <Link key={link.url} href={link.url} data-testid={`link-help-${link.url.replace(/\//g, "-")}`}>
            <Card className="border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-2xl dark:bg-gray-900 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer h-full">
              <CardContent className="pt-5 pb-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                  <link.icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="font-bold text-sm text-black dark:text-white">{ar ? link.title : link.titleEn}</p>
                  <p className="text-xs text-black/40 dark:text-white/40">{ar ? link.desc : link.descEn}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-black text-black dark:text-white mb-4" data-testid="text-faq-title">
          {ar ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <Card key={i} className="border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-2xl dark:bg-gray-900">
              <CardContent className="pt-4 pb-4">
                <button
                  className="w-full flex items-center justify-between gap-3 text-right"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  data-testid={`button-faq-${i}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-black/50 dark:text-white/50" />
                    </div>
                    <span className="font-bold text-sm text-black dark:text-white">{ar ? item.q : item.qEn}</span>
                  </div>
                  {expandedFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-black/30 dark:text-white/30 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-black/30 dark:text-white/30 shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <p className="mt-3 text-sm text-black/60 dark:text-white/60 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-3 leading-relaxed">
                    {ar ? item.a : item.aEn}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-black text-black dark:text-white mb-4" data-testid="text-contact-title">
          {ar ? "تواصل معنا" : "Contact Us"}
        </h2>
        {sent ? (
          <Card className="border-green-200 dark:border-green-800 shadow-none rounded-2xl dark:bg-gray-900">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-black dark:text-white mb-1">{ar ? "تم إرسال رسالتك بنجاح!" : "Message sent successfully!"}</p>
              <p className="text-sm text-black/40 dark:text-white/40 mb-4">{ar ? "سنرد عليك في أقرب وقت" : "We'll get back to you soon"}</p>
              <Button variant="outline" onClick={() => setSent(false)} className="dark:text-white dark:border-white/10" data-testid="button-send-another">
                {ar ? "إرسال رسالة أخرى" : "Send another message"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-2xl dark:bg-gray-900">
            <CardContent className="pt-5 pb-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-1 block">{ar ? "الاسم" : "Name"}</label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder={ar ? "اسمك الكامل" : "Your full name"}
                    className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-1 block">{ar ? "البريد الإلكتروني" : "Email"}</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder={ar ? "بريدك الإلكتروني" : "Your email address"}
                    className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                    data-testid="input-email"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-1 block">{ar ? "الموضوع" : "Subject"}</label>
                <Input
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder={ar ? "موضوع الرسالة (اختياري)" : "Message subject (optional)"}
                  className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                  data-testid="input-subject"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-1 block">{ar ? "الرسالة" : "Message"}</label>
                <Textarea
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder={ar ? "اكتب رسالتك هنا..." : "Write your message here..."}
                  rows={4}
                  className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                  data-testid="input-message"
                />
              </div>
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={!form.name.trim() || !form.email.trim() || !form.message.trim() || sendMutation.isPending}
                className="bg-black dark:bg-white text-white dark:text-black gap-2"
                data-testid="button-submit"
              >
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {ar ? "إرسال الرسالة" : "Send Message"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}