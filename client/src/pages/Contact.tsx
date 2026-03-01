import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "يرجى تعبئة جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/contact", form);
      setSent(true);
    } catch {
      toast({ title: "فشل إرسال الرسالة، يرجى المحاولة مرة أخرى", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navigation />

      <section className="pt-36 pb-24 relative overflow-hidden">
        <PageGraphics variant="minimal" />
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] mb-6">
              <MessageCircle className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">Contact</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-black dark:text-white mb-6 tracking-tight">
              تواصل <span className="text-gray-400">معنا</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 text-lg max-w-2xl mx-auto">
              نحن جاهزون للإجابة على استفساراتك وبناء مشروعك الرقمي.
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
                  <h3 className="text-xl font-bold text-black dark:text-white mb-2">تم إرسال رسالتك!</h3>
                  <p className="text-black/40 dark:text-white/40 text-sm leading-relaxed">
                    شكراً لتواصلك معنا. سيرد عليك فريقنا خلال 24 ساعة على البريد الإلكتروني المُدخل.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6 rounded-xl"
                    onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    data-testid="button-send-another"
                  >
                    إرسال رسالة أخرى
                  </Button>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-xl font-bold font-heading text-black dark:text-white mb-8">أرسل رسالة</h2>
                  <form className="space-y-5" onSubmit={handleSubmit} dir="rtl">
                    <div>
                      <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-2">الاسم <span className="text-red-400">*</span></label>
                      <Input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="اسمك الكامل"
                        className="bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] focus:border-black/20 dark:focus:border-white/20 text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25 h-12 rounded-xl"
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-2">البريد الإلكتروني <span className="text-red-400">*</span></label>
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
                      <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-2">الموضوع</label>
                      <Input
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="عنوان الرسالة"
                        className="bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] focus:border-black/20 dark:focus:border-white/20 text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25 h-12 rounded-xl"
                        data-testid="input-contact-subject"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-2">الرسالة <span className="text-red-400">*</span></label>
                      <Textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="اكتب رسالتك هنا..."
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
                      {loading ? "جاري الإرسال..." : "إرسال الرسالة"}
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
              <h3 className="font-bold text-black dark:text-white text-sm mb-2">البريد الإلكتروني</h3>
              <p className="text-sm text-black/40 dark:text-white/40">support@qiroxstudio.online</p>
            </div>
            <div className="bg-white dark:bg-gray-900/60 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-7 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mb-5">
                <MapPin className="w-5 h-5 text-black/40 dark:text-white/40" />
              </div>
              <h3 className="font-bold text-black dark:text-white text-sm mb-2">المواقع</h3>
              <p className="text-sm text-black/40 dark:text-white/40">المملكة العربية السعودية</p>
              <p className="text-sm text-black/40 dark:text-white/40">مصر</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
