import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Contact() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const { data: user } = useUser();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: prev.name || user.fullName || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const T = {
    badge: lang === "ar" ? "Contact" : "Contact",
    title: lang === "ar" ? "تواصل" : "Contact",
    titleHighlight: lang === "ar" ? "معنا" : "Us",
    subtitle: lang === "ar" ? "نحن جاهزون للإجابة على استفساراتك وبناء مشروعك الرقمي." : "We're ready to answer your questions and build your digital project.",
    sendMsg: lang === "ar" ? "أرسل رسالة" : "Send a Message",
    name: lang === "ar" ? "الاسم" : "Name",
    namePh: lang === "ar" ? "اسمك الكامل" : "Your full name",
    email: lang === "ar" ? "البريد الإلكتروني" : "Email",
    subject: lang === "ar" ? "الموضوع" : "Subject",
    subjectPh: lang === "ar" ? "عنوان الرسالة" : "Message subject",
    message: lang === "ar" ? "الرسالة" : "Message",
    messagePh: lang === "ar" ? "اكتب رسالتك هنا..." : "Write your message here...",
    sending: lang === "ar" ? "جاري الإرسال..." : "Sending...",
    send: lang === "ar" ? "إرسال الرسالة" : "Send Message",
    required: lang === "ar" ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill in all required fields",
    failed: lang === "ar" ? "فشل إرسال الرسالة، يرجى المحاولة مرة أخرى" : "Failed to send message, please try again",
    successTitle: lang === "ar" ? "تم إرسال رسالتك!" : "Your message was sent!",
    successDesc: lang === "ar" ? "شكراً لتواصلك معنا. سيرد عليك فريقنا خلال 24 ساعة على البريد الإلكتروني المُدخل." : "Thank you for contacting us. Our team will reply within 24 hours to the email you provided.",
    sendAnother: lang === "ar" ? "إرسال رسالة أخرى" : "Send Another Message",
    emailLabel: lang === "ar" ? "البريد الإلكتروني" : "Email",
    locations: lang === "ar" ? "المواقع" : "Locations",
    saudi: lang === "ar" ? "المملكة العربية السعودية" : "Saudi Arabia",
    egypt: lang === "ar" ? "مصر" : "Egypt",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: T.required, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/contact", form);
      setSent(true);
    } catch {
      toast({ title: T.failed, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      <section className="pt-36 pb-24 relative overflow-hidden">
        <PageGraphics variant="minimal" />
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] mb-6">
              <MessageCircle className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">{T.badge}</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-black dark:text-white mb-6 tracking-tight">
              {T.title} <span className="text-gray-400">{T.titleHighlight}</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 text-lg max-w-2xl mx-auto">
              {T.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-6">
          <motion.div initial="hidden" animate="visible" className="md:col-span-3">
            <div className="bg-white dark:bg-gray-900/60 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-8 shadow-sm">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-50 dark:bg-green-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-black dark:text-white mb-2">{T.successTitle}</h3>
                  <p className="text-black/40 dark:text-white/40 text-sm leading-relaxed">{T.successDesc}</p>
                  <Button
                    variant="outline"
                    className="mt-6 rounded-xl"
                    onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    data-testid="button-send-another"
                  >
                    {T.sendAnother}
                  </Button>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-xl font-bold font-heading text-black dark:text-white mb-8">{T.sendMsg}</h2>
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                      <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-2">{T.name} <span className="text-red-400">*</span></label>
                      <Input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder={T.namePh}
                        className="bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] focus:border-black/20 dark:focus:border-white/20 text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25 h-12 rounded-xl"
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-2">{T.email} <span className="text-red-400">*</span></label>
                      <Input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="email@example.com"
                        className="bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] focus:border-black/20 dark:focus:border-white/20 text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25 h-12 rounded-xl"
                        data-testid="input-contact-email"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-2">{T.subject}</label>
                      <Input
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        placeholder={T.subjectPh}
                        className="bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] focus:border-black/20 dark:focus:border-white/20 text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25 h-12 rounded-xl"
                        data-testid="input-contact-subject"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-2">{T.message} <span className="text-red-400">*</span></label>
                      <Textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder={T.messagePh}
                        rows={5}
                        className="bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] focus:border-black/20 dark:focus:border-white/20 text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25 rounded-xl resize-none"
                        data-testid="input-contact-message"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 premium-btn rounded-xl font-semibold gap-2"
                      data-testid="button-send-contact"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {loading ? T.sending : T.send}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" className="md:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-900/60 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-7 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mb-5">
                <Mail className="w-5 h-5 text-black/40 dark:text-white/40" />
              </div>
              <h3 className="font-bold text-black dark:text-white text-sm mb-2">{T.emailLabel}</h3>
              <p className="text-sm text-black/40 dark:text-white/40">info@qiroxstudio.online</p>
            </div>
            <div className="bg-white dark:bg-gray-900/60 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-7 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mb-5">
                <MapPin className="w-5 h-5 text-black/40 dark:text-white/40" />
              </div>
              <h3 className="font-bold text-black dark:text-white text-sm mb-2">{T.locations}</h3>
              <p className="text-sm text-black/40 dark:text-white/40">{T.saudi}</p>
              <p className="text-sm text-black/40 dark:text-white/40">{T.egypt}</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
