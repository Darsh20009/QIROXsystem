import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MapPin, Send } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F4]">
      <Navigation />

      <section className="pt-32 pb-16 bg-[#111111] text-white relative overflow-hidden">
        <div className="absolute inset-0 animated-grid-dark opacity-40" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.span variants={fadeUp} custom={0} className="inline-block text-white/40 text-sm font-medium tracking-widest uppercase mb-6">
              Contact
            </motion.span>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading mb-6 tracking-tight">
              تواصل معنا
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/40 text-lg max-w-2xl mx-auto">
              نحن جاهزون للإجابة على استفساراتك وبناء مشروعك الرقمي.
            </motion.p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F4F4F4] to-transparent" />
      </section>

      <section className="py-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
          <motion.div initial="hidden" animate="visible" className="md:col-span-3">
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-8">
              <h2 className="text-xl font-bold font-heading text-[#111111] mb-6">أرسل رسالة</h2>
              <form className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#111111] block mb-1.5">الاسم</label>
                  <Input placeholder="اسمك الكامل" className="border-[#E0E0E0] focus:border-[#111111] rounded-lg" data-testid="input-contact-name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#111111] block mb-1.5">البريد الإلكتروني</label>
                  <Input type="email" placeholder="email@example.com" className="border-[#E0E0E0] focus:border-[#111111] rounded-lg" data-testid="input-contact-email" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#111111] block mb-1.5">الموضوع</label>
                  <Input placeholder="عنوان الرسالة" className="border-[#E0E0E0] focus:border-[#111111] rounded-lg" data-testid="input-contact-subject" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#111111] block mb-1.5">الرسالة</label>
                  <Textarea placeholder="اكتب رسالتك هنا..." rows={5} className="border-[#E0E0E0] focus:border-[#111111] rounded-lg resize-none" data-testid="input-contact-message" />
                </div>
                <Button className="w-full h-12 bg-[#111111] hover:bg-[#2B2B2B] text-white rounded-lg font-semibold" data-testid="button-send-contact">
                  <Send className="w-4 h-4 ml-2" />
                  إرسال الرسالة
                </Button>
              </form>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
              <div className="w-10 h-10 rounded-lg bg-[#F4F4F4] flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="font-bold text-[#111111] text-sm mb-1">البريد الإلكتروني</h3>
              <p className="text-sm text-[#555555]">info@qirox.tech</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
              <div className="w-10 h-10 rounded-lg bg-[#F4F4F4] flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="font-bold text-[#111111] text-sm mb-1">المواقع</h3>
              <p className="text-sm text-[#555555]">المملكة العربية السعودية</p>
              <p className="text-sm text-[#555555]">مصر</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
