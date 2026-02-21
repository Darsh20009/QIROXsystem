import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, MessageCircle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <Navigation />

      <section className="pt-36 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div className="absolute inset-0 animated-grid-dark opacity-20" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
              <MessageCircle className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Contact</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-white mb-6 tracking-tight">
              تواصل <span className="text-gradient">معنا</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/30 text-lg max-w-2xl mx-auto">
              نحن جاهزون للإجابة على استفساراتك وبناء مشروعك الرقمي.
            </motion.p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
      </section>

      <section className="py-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-6">
          <motion.div initial="hidden" animate="visible" className="md:col-span-3">
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold font-heading text-white mb-8">أرسل رسالة</h2>
              <form className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-white/50 block mb-2">الاسم</label>
                  <Input placeholder="اسمك الكامل" className="bg-white/5 border-white/10 focus:border-[#00D4FF]/50 text-white placeholder:text-white/20 h-12 rounded-xl" data-testid="input-contact-name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/50 block mb-2">البريد الإلكتروني</label>
                  <Input type="email" placeholder="email@example.com" className="bg-white/5 border-white/10 focus:border-[#00D4FF]/50 text-white placeholder:text-white/20 h-12 rounded-xl" data-testid="input-contact-email" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/50 block mb-2">الموضوع</label>
                  <Input placeholder="عنوان الرسالة" className="bg-white/5 border-white/10 focus:border-[#00D4FF]/50 text-white placeholder:text-white/20 h-12 rounded-xl" data-testid="input-contact-subject" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/50 block mb-2">الرسالة</label>
                  <Textarea placeholder="اكتب رسالتك هنا..." rows={5} className="bg-white/5 border-white/10 focus:border-[#00D4FF]/50 text-white placeholder:text-white/20 rounded-xl resize-none" data-testid="input-contact-message" />
                </div>
                <Button className="w-full h-12 premium-btn rounded-xl font-semibold" data-testid="button-send-contact">
                  <Send className="w-4 h-4 ml-2" />
                  إرسال الرسالة
                </Button>
              </form>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" className="md:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center mb-5">
                <Mail className="w-5 h-5 text-[#00D4FF]" />
              </div>
              <h3 className="font-bold text-white text-sm mb-2">البريد الإلكتروني</h3>
              <p className="text-sm text-white/30">info@qirox.tech</p>
            </div>
            <div className="glass-card rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center mb-5">
                <MapPin className="w-5 h-5 text-[#00D4FF]" />
              </div>
              <h3 className="font-bold text-white text-sm mb-2">المواقع</h3>
              <p className="text-sm text-white/30">المملكة العربية السعودية</p>
              <p className="text-sm text-white/30">مصر</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
