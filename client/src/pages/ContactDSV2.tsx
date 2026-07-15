import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ContactHeroVisual } from "@/components/MarketingVisual";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import { useSEO } from "@/hooks/use-seo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function ContactDSV2() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const { data: user } = useUser();

  useSEO({
    title: lang === "ar" ? "تواصل معنا — كيروكس استوديو | الرياض" : "Contact Us — Qirox Studio | Riyadh",
    description: lang === "ar"
      ? "تواصل مع فريق كيروكس استوديو للحصول على عرض سعر لمشروعك. نرد خلال دقائق. الرياض، المملكة العربية السعودية."
      : "Contact Qirox Studio team for a project quote. We respond within minutes. Riyadh, Saudi Arabia.",
    keywords: "تواصل مع كيروكس, كيروكس استوديو الرياض, Qirox contact, شركة برمجة الرياض تواصل, طلب مشروع برمجة",
    canonical: "/contact",
  });

  const { data: publicSettings } = useQuery<{ whatsapp?: string }>({
    queryKey: ["/api/public/settings"],
    staleTime: 10 * 60 * 1000,
  });

  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
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
    phone: lang === "ar" ? "رقم الجوال" : "Phone Number",
    phonePh: lang === "ar" ? "05xxxxxxxx" : "05xxxxxxxx",
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
    whatsappLabel: lang === "ar" ? "واتساب" : "WhatsApp",
    whatsappChat: lang === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp",
    locations: lang === "ar" ? "المواقع" : "Locations",
    saudi: lang === "ar" ? "المملكة العربية السعودية" : "Saudi Arabia",
    egypt: lang === "ar" ? "مصر" : "Egypt",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.message) {
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
    <div className="min-h-screen flex flex-col bg-ds-background text-ds-foreground" dir={dir}>
      <Navigation />

      <section className="relative overflow-hidden bg-ds-surface-inverse">
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--ds-surface-inverse-foreground)) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ds-background to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 pt-32 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-ds-container-lg mx-auto">
            <motion.div initial="hidden" animate="visible">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-ds-full border border-ds-surface-inverse-foreground/10 bg-ds-surface-inverse-foreground/5 mb-6">
                <MessageCircle className="w-4 h-4 text-ds-surface-inverse-foreground/60" />
                <span className="text-ds-surface-inverse-foreground/70 text-ds-xs tracking-ds-wide uppercase font-semibold">{T.badge}</span>
              </motion.div>
              <motion.h1 variants={fadeUp} custom={1} className="text-ds-4xl md:text-ds-5xl lg:text-ds-6xl font-black font-heading text-ds-surface-inverse-foreground mb-6 tracking-ds-tight leading-ds-tight">
                {T.title} <span className="text-ds-surface-inverse-foreground/40">{T.titleHighlight}</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-ds-surface-inverse-foreground/60 text-ds-lg max-w-sm leading-ds-relaxed">
                {T.subtitle}
              </motion.p>
            </motion.div>
            <ContactHeroVisual lang={lang} />
          </div>
        </div>
      </section>

      <section className="py-24 container mx-auto px-4 sm:px-6">
        <div className="max-w-ds-container-md mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
          <motion.div initial="hidden" animate="visible" className="md:col-span-3">
            <div className="ds-card ds-card-elevated p-8 sm:p-10">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10"
                >
                  <div className="w-16 h-16 bg-ds-accent/10 rounded-ds-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-ds-accent" />
                  </div>
                  <h3 className="text-ds-2xl font-bold text-ds-foreground mb-3">{T.successTitle}</h3>
                  <p className="text-ds-muted-foreground text-ds-base leading-ds-relaxed max-w-xs mx-auto">{T.successDesc}</p>
                  <button
                    className="mt-8 ds-btn ds-btn-outline px-6 py-3 rounded-ds-xl"
                    onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
                    data-testid="button-send-another"
                  >
                    {T.sendAnother}
                  </button>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-ds-2xl font-bold font-heading text-ds-foreground mb-8">{T.sendMsg}</h2>
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                      <label className="text-ds-sm font-semibold text-ds-muted-foreground block mb-2">
                        {T.name} <span className="text-ds-foreground/50">*</span>
                      </label>
                      <Input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder={T.namePh}
                        className="ds-input w-full h-12 px-4"
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div>
                      <label className="text-ds-sm font-semibold text-ds-muted-foreground block mb-2">
                        {T.email} <span className="text-ds-foreground/50">*</span>
                      </label>
                      <Input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="email@example.com"
                        className="ds-input w-full h-12 px-4"
                        data-testid="input-contact-email"
                      />
                    </div>
                    <div>
                      <label className="text-ds-sm font-semibold text-ds-muted-foreground block mb-2">
                        {T.phone} <span className="text-ds-foreground/50">*</span>
                      </label>
                      <Input
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder={T.phonePh}
                        className="ds-input w-full h-12 px-4"
                        dir="ltr"
                        data-testid="input-contact-phone"
                      />
                    </div>
                    <div>
                      <label className="text-ds-sm font-semibold text-ds-muted-foreground block mb-2">
                        {T.subject}
                      </label>
                      <Input
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        placeholder={T.subjectPh}
                        className="ds-input w-full h-12 px-4"
                        data-testid="input-contact-subject"
                      />
                    </div>
                    <div>
                      <label className="text-ds-sm font-semibold text-ds-muted-foreground block mb-2">
                        {T.message} <span className="text-ds-foreground/50">*</span>
                      </label>
                      <Textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder={T.messagePh}
                        rows={5}
                        className="ds-input w-full p-4 resize-none"
                        data-testid="input-contact-message"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="ds-btn ds-btn-primary w-full h-12 rounded-ds-xl text-ds-base shadow-ds-sm hover:shadow-ds-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring disabled:opacity-70 mt-2"
                      data-testid="button-send-contact"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      {loading ? T.sending : T.send}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" className="md:col-span-2 space-y-4">
            <div className="ds-card p-6 sm:p-7 shadow-ds-xs hover:shadow-ds-sm transition-shadow">
              <div className="w-12 h-12 rounded-ds-xl bg-ds-surface-2 flex items-center justify-center mb-5 border border-ds-border-hairline">
                <Mail className="w-5 h-5 text-ds-muted-foreground" strokeWidth={1.75} />
              </div>
              <h3 className="font-bold text-ds-foreground text-ds-base mb-2">{T.emailLabel}</h3>
              <p className="text-ds-sm text-ds-muted-foreground font-medium">info@qiroxstudio.online</p>
            </div>

            {publicSettings?.whatsapp && publicSettings.whatsapp.replace(/\D/g, "").length > 0 && (
              <a
                href={`https://wa.me/${publicSettings.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block ds-card p-6 sm:p-7 shadow-ds-xs hover:shadow-ds-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] hover:border-[#25D366]/30"
                data-testid="link-whatsapp-contact"
              >
                <div className="w-12 h-12 rounded-ds-xl bg-[#25D366]/10 flex items-center justify-center mb-5 border border-[#25D366]/20">
                  <SiWhatsapp className="w-5 h-5 text-[#25D366]" />
                </div>
                <h3 className="font-bold text-ds-foreground text-ds-base mb-2">{T.whatsappLabel}</h3>
                <p className="text-ds-sm text-ds-muted-foreground mb-2" dir="ltr">{publicSettings.whatsapp}</p>
                <p className="text-ds-sm font-bold text-[#25D366] group-hover:underline flex items-center gap-1">
                  {T.whatsappChat}
                </p>
              </a>
            )}

            <a
              href="https://whatsapp.com/channel/0029VbCzt1a17En1ClfrWt2i"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#f0fdf4] dark:bg-[#0d2b1a] border border-[#25D366]/25 hover:border-[#25D366]/60 rounded-ds-lg p-6 sm:p-7 shadow-ds-xs hover:shadow-ds-md transition-all duration-ds-base group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
              data-testid="link-whatsapp-channel-contact"
            >
              <div className="w-12 h-12 rounded-ds-xl bg-[#25D366] flex items-center justify-center mb-5 shadow-ds-sm shadow-[#25D366]/30">
                <SiWhatsapp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-ds-foreground text-ds-base mb-2">
                {lang === "ar" ? "📢 قناة واتساب" : "📢 WhatsApp Channel"}
              </h3>
              <p className="text-ds-sm text-ds-muted-foreground mb-4 leading-ds-relaxed">
                {lang === "ar" ? "انضم لقناتنا للحصول على عروض حصرية وآخر المشاريع والخصومات" : "Join our channel for exclusive offers, latest projects & discounts"}
              </p>
              <p className="text-ds-sm font-bold text-[#25D366] group-hover:underline">
                {lang === "ar" ? "انضم الآن ←" : "Join Now →"}
              </p>
            </a>

            <div className="ds-card p-6 sm:p-7 shadow-ds-xs hover:shadow-ds-sm transition-shadow">
              <div className="w-12 h-12 rounded-ds-xl bg-ds-surface-2 flex items-center justify-center mb-5 border border-ds-border-hairline">
                <MapPin className="w-5 h-5 text-ds-muted-foreground" strokeWidth={1.75} />
              </div>
              <h3 className="font-bold text-ds-foreground text-ds-base mb-3">{T.locations}</h3>
              <p className="text-ds-sm font-medium text-ds-muted-foreground mb-2">
                {T.saudi}
              </p>
              <p className="text-ds-sm font-medium text-ds-muted-foreground">
                {T.egypt}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
