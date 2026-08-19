import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeBuoy, Mail, MessageCircle, Send, CheckCircle } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/use-seo";

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

export default function PublicSupport() {
  const { lang, dir } = useI18n();
  const { toast } = useToast();
  const L = lang === "ar";
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState<ContactForm>({
    name: "", email: "", subject: "", category: "general", message: "",
  });

  useSEO({
    title: L ? "الدعم الفني – QIROX" : "Support – QIROX",
    description: L
      ? "تواصل مع فريق دعم QIROX عبر البريد الإلكتروني أو واتساب أو النموذج المباشر."
      : "Contact QIROX support team via email, WhatsApp, or the direct form.",
    canonical: "https://qiroxstudio.online/support",
  });

  // Fetch live contact details from admin settings
  const { data: settings } = useQuery<{
    whatsapp?: string;
    contactPhone?: string;
    contactEmail?: string;
  }>({
    queryKey: ["/api/public/settings"],
    staleTime: 5 * 60 * 1000,
  });

  const waNumber = settings?.whatsapp || settings?.contactPhone || "966500000000";
  const supportEmail = settings?.contactEmail || "info@qiroxstudio.online";
  // Normalize: strip + and spaces for wa.me link
  const waLink = `https://wa.me/${waNumber.replace(/[^0-9]/g, "")}`;

  const sendMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: `[${data.category}] ${data.subject}`,
          message: data.message,
        }),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => {
      setSent(true);
      setForm({ name: "", email: "", subject: "", category: "general", message: "" });
    },
    onError: () =>
      toast({ title: L ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again.", variant: "destructive" }),
  });

  const CHANNELS = [
    {
      icon: <Mail className="w-6 h-6" />,
      label: L ? "البريد الإلكتروني" : "Email",
      value: supportEmail,
      href: `mailto:${supportEmail}`,
    },
    {
      icon: <SiWhatsapp className="w-6 h-6 text-green-500" />,
      label: "WhatsApp",
      value: L ? "تواصل مباشر عبر واتساب" : "Chat directly on WhatsApp",
      href: waLink,
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      label: L ? "الدعم المباشر" : "Live Support",
      value: L ? "من خلال النموذج أدناه" : "Using the form below",
      href: "#contact-form",
    },
  ];

  const CAT = [
    { value: "general", label: L ? "استفسار عام" : "General Inquiry" },
    { value: "technical", label: L ? "مشكلة تقنية" : "Technical Issue" },
    { value: "billing", label: L ? "مالية وفواتير" : "Billing" },
    { value: "complaint", label: L ? "شكوى" : "Complaint" },
    { value: "other", label: L ? "أخرى" : "Other" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black" dir={dir}>
      <Navigation />
      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black dark:bg-white rounded-2xl mb-6">
            <LifeBuoy className="w-8 h-8 text-white dark:text-black" />
          </div>
          <h1 className="text-4xl font-black text-black dark:text-white mb-4">
            {L ? "مركز الدعم" : "Support Center"}
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            {L
              ? "نحن هنا لمساعدتك. تواصل معنا عبر أي من القنوات التالية."
              : "We're here to help. Reach us through any of the channels below."}
          </p>
        </div>

        {/* Contact channels */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {CHANNELS.map((ch, i) => (
            <a
              key={i}
              href={ch.href}
              target={ch.href.startsWith("http") ? "_blank" : undefined}
              rel={ch.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex flex-col items-center text-center p-6 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
            >
              <div className="mb-3 text-black dark:text-white">{ch.icon}</div>
              <p className="font-black text-black dark:text-white text-sm mb-1">{ch.label}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs break-all">{ch.value}</p>
            </a>
          ))}
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-black dark:text-white mb-8 text-center">
            {L ? "أسئلة شائعة" : "Frequently Asked Questions"}
          </h2>
          <div className="space-y-4">
            {[
              {
                q: L ? "كيف أبدأ مع QIROX؟" : "How do I get started with QIROX?",
                a: L
                  ? "سجّل حساباً مجانياً، اختر الباقة المناسبة، وسيتواصل معك فريقنا خلال 24 ساعة."
                  : "Create a free account, choose your plan, and our team will contact you within 24 hours.",
              },
              {
                q: L ? "كيف أتواصل مع الدعم الفني؟" : "How can I reach technical support?",
                a: L
                  ? `يمكنك التواصل عبر البريد الإلكتروني ${supportEmail} أو النموذج أدناه، ويرد الفريق خلال ساعات العمل.`
                  : `Contact us via ${supportEmail} or the form below. The team responds during business hours.`,
              },
              {
                q: L ? "ما هي ساعات الدعم؟" : "What are your support hours?",
                a: L
                  ? "فريق الدعم متاح من الأحد إلى الخميس، 9 صباحاً – 6 مساءً (توقيت السعودية)."
                  : "Support team is available Sunday–Thursday, 9 AM – 6 PM (Saudi time).",
              },
              {
                q: L ? "هل يمكنني ترقية باقتي؟" : "Can I upgrade my plan?",
                a: L
                  ? "نعم، تواصل مع الدعم وسنساعدك على الترقية أو تغيير الباقة في أي وقت."
                  : "Yes, contact support and we'll help you upgrade or change your plan at any time.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group border border-black/[0.08] dark:border-white/[0.08] rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer font-bold text-black dark:text-white text-sm list-none">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="px-5 pb-5 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div id="contact-form" className="border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-8">
          <h2 className="text-2xl font-black text-black dark:text-white mb-6">
            {L ? "أرسل رسالة" : "Send a Message"}
          </h2>

          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
              <h3 className="text-xl font-black text-black dark:text-white mb-2">
                {L ? "تم إرسال رسالتك!" : "Message Sent!"}
              </h3>
              <p className="text-gray-500 mb-6">
                {L
                  ? "سيتواصل معك فريق الدعم قريباً."
                  : "Our support team will get back to you soon."}
              </p>
              <Button onClick={() => setSent(false)} variant="outline" className="rounded-xl">
                {L ? "إرسال رسالة أخرى" : "Send Another Message"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black/60 dark:text-white/60 mb-1">
                    {L ? "الاسم" : "Name"} *
                  </label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={L ? "اسمك الكامل" : "Your full name"}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black/60 dark:text-white/60 mb-1">
                    {L ? "البريد الإلكتروني" : "Email"} *
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    dir="ltr"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black/60 dark:text-white/60 mb-1">
                    {L ? "نوع الطلب" : "Category"}
                  </label>
                  <Select
                    value={form.category}
                    onValueChange={v => setForm(f => ({ ...f, category: v }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAT.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black/60 dark:text-white/60 mb-1">
                    {L ? "الموضوع" : "Subject"} *
                  </label>
                  <Input
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder={L ? "موضوع رسالتك" : "Message subject"}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black/60 dark:text-white/60 mb-1">
                  {L ? "الرسالة" : "Message"} *
                </label>
                <Textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder={L ? "اكتب رسالتك هنا..." : "Write your message here..."}
                  rows={5}
                  className="rounded-xl resize-none"
                />
              </div>

              <Button
                onClick={() => sendMutation.mutate(form)}
                disabled={sendMutation.isPending || !form.name || !form.email || !form.message}
                className="w-full rounded-xl bg-black dark:bg-white text-white dark:text-black font-black h-12"
              >
                {sendMutation.isPending ? (
                  <span className="animate-pulse">{L ? "جاري الإرسال..." : "Sending..."}</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {L ? "إرسال الرسالة" : "Send Message"}
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
