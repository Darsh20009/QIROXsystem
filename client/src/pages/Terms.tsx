import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { motion } from "framer-motion";
import { FileText, Scale, CreditCard, Package, AlertTriangle, RefreshCw, Ban, Gavel, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const sections = {
  ar: [
    {
      icon: Scale,
      title: "القبول بالشروط",
      items: [
        "باستخدامك لمنصة QIROX أو أي من خدماتها، فأنت توافق على الالتزام بهذه الشروط والأحكام.",
        "إذا كنت تستخدم المنصة نيابة عن شركة أو مؤسسة، فأنت تقر بأن لديك الصلاحية لإلزام تلك الجهة بهذه الشروط.",
        "نحتفظ بحق تعديل هذه الشروط في أي وقت، وسيتم إشعارك بالتغييرات الجوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة.",
        "استمرارك في استخدام المنصة بعد التعديل يعني موافقتك على الشروط المحدثة.",
      ]
    },
    {
      icon: Package,
      title: "الخدمات المقدمة",
      items: [
        "تصميم وتطوير مواقع وأنظمة رقمية متكاملة عبر 8 قطاعات (مطاعم، متاجر، تعليم، لياقة، سيرة ذاتية، جمعيات خيرية، أكاديميات قرآن، وأنظمة اختبارات).",
        "3 باقات تسعير: Starter (5,000 ر.س)، Business (15,000 ر.س)، Enterprise (40,000 ر.س).",
        "لوحة تحكم للعميل لمتابعة تقدم المشروع والتواصل مع فريق العمل.",
        "دعم فني وصيانة وفقاً للباقة المختارة.",
        "إمكانية طلب إضافات ووحدات إضافية (Modules) حسب احتياجات العميل.",
      ]
    },
    {
      icon: CreditCard,
      title: "الأسعار والدفع",
      items: [
        "الأسعار المعروضة بالريال السعودي (SAR) وقابلة للتغيير مع إشعار مسبق.",
        "يتم الدفع عبر PayPal أو التحويل البنكي المباشر.",
        "يجب دفع 50% مقدماً كعربون قبل البدء في تنفيذ المشروع.",
        "المبلغ المتبقي يُدفع عند اكتمال المشروع وقبل التسليم النهائي.",
        "إيصال التحويل البنكي يجب رفعه عبر المنصة لتأكيد الدفع.",
        "في حال تأخر الدفع أكثر من 30 يوماً بعد الاستحقاق، يحق لنا تعليق العمل على المشروع.",
      ]
    },
    {
      icon: RefreshCw,
      title: "التسليم والتعديلات",
      items: [
        "مدة التسليم تختلف حسب الباقة: Starter (7 أيام عمل)، Business (14 يوم عمل)، Enterprise (حسب الاتفاق).",
        "يحق للعميل طلب جولتين من التعديلات المجانية بعد التسليم الأولي.",
        "التعديلات الإضافية بعد الجولتين تُحسب برسوم إضافية يتم الاتفاق عليها مسبقاً.",
        "التأخير الناتج عن تأخر العميل في تسليم المحتوى أو الملفات لا يُحسب ضمن مدة التنفيذ.",
        "يُعتبر المشروع مسلّماً بعد موافقة العميل أو مرور 14 يوماً من التسليم دون ردّ.",
      ]
    },
    {
      icon: AlertTriangle,
      title: "الملكية الفكرية",
      items: [
        "تنتقل ملكية التصميم النهائي والمحتوى المخصص للعميل بعد اكتمال الدفع.",
        "تحتفظ QIROX بملكية الكود المصدري الأساسي (Core Framework) والقوالب العامة.",
        "يحق لـ QIROX عرض المشروع في معرض أعمالها ما لم يطلب العميل خلاف ذلك كتابياً.",
        "المحتوى والملفات التي يرفعها العميل (شعارات، صور، نصوص) تبقى ملكاً للعميل.",
        "لا يحق للعميل إعادة بيع أو توزيع القالب الأساسي لأطراف ثالثة.",
      ]
    },
    {
      icon: Ban,
      title: "الاستخدام المحظور",
      items: [
        "استخدام المنصة لأي نشاط غير قانوني أو مخالف للأنظمة السعودية والمصرية.",
        "محاولة الوصول غير المصرح به لحسابات مستخدمين آخرين أو أنظمة المنصة.",
        "رفع محتوى ضار، فيروسات، أو برمجيات خبيثة.",
        "استخدام المنصة لإرسال رسائل غير مرغوب فيها (Spam).",
        "نسخ أو هندسة عكسية لأي جزء من أنظمة QIROX.",
        "انتحال هوية أشخاص أو جهات أخرى.",
      ]
    },
    {
      icon: AlertTriangle,
      title: "إلغاء الخدمة والاسترداد",
      items: [
        "يحق للعميل إلغاء الطلب قبل بدء التنفيذ واسترداد كامل المبلغ.",
        "بعد بدء التنفيذ، يتم خصم قيمة العمل المنجز وإرجاع الباقي (إن وُجد).",
        "بعد تسليم المشروع لا يمكن استرداد المبالغ المدفوعة.",
        "يحق لـ QIROX إنهاء حساب المستخدم في حال مخالفة هذه الشروط مع إشعار مسبق.",
        "في حال إنهاء الحساب، يتم تسليم أي ملفات مستحقة للعميل خلال 30 يوماً.",
      ]
    },
    {
      icon: Gavel,
      title: "القانون الواجب التطبيق",
      items: [
        "تخضع هذه الشروط لأنظمة المملكة العربية السعودية.",
        "أي نزاع ينشأ عن استخدام المنصة يُحل ودياً أولاً، وفي حال تعذر ذلك يُحال للجهات القضائية المختصة في مدينة الرياض.",
        "تسري هذه الشروط من تاريخ إنشاء الحساب أو استخدام أي من خدمات المنصة.",
      ]
    },
  ],
  en: [
    {
      icon: Scale,
      title: "Acceptance of Terms",
      items: [
        "By using the QIROX platform or any of its services, you agree to be bound by these Terms & Conditions.",
        "If you are using the platform on behalf of a company or organization, you represent that you have the authority to bind that entity to these terms.",
        "We reserve the right to modify these terms at any time. You will be notified of material changes via email or in-platform notification.",
        "Your continued use of the platform after modifications constitutes acceptance of the updated terms.",
      ]
    },
    {
      icon: Package,
      title: "Services Provided",
      items: [
        "Design and development of complete digital websites and systems across 8 sectors (restaurants, stores, education, fitness, CV/resume, charities, Quran academies, and exam systems).",
        "3 pricing tiers: Starter (5,000 SAR), Business (15,000 SAR), Enterprise (40,000 SAR).",
        "Client dashboard for tracking project progress and communicating with the team.",
        "Technical support and maintenance according to the selected plan.",
        "Option to request additional add-ons and modules based on client needs.",
      ]
    },
    {
      icon: CreditCard,
      title: "Pricing & Payment",
      items: [
        "Prices are displayed in Saudi Riyals (SAR) and are subject to change with prior notice.",
        "Payment is accepted via PayPal or direct bank transfer.",
        "A 50% advance payment is required before project execution begins.",
        "The remaining balance is due upon project completion and before final delivery.",
        "Bank transfer receipts must be uploaded through the platform to confirm payment.",
        "If payment is delayed more than 30 days past the due date, we reserve the right to suspend work on the project.",
      ]
    },
    {
      icon: RefreshCw,
      title: "Delivery & Revisions",
      items: [
        "Delivery timelines vary by plan: Starter (7 business days), Business (14 business days), Enterprise (as agreed).",
        "Clients are entitled to two rounds of free revisions after initial delivery.",
        "Additional revisions beyond the two rounds are charged at rates agreed upon in advance.",
        "Delays caused by the client's late submission of content or files are not counted in the execution timeline.",
        "The project is considered delivered after client approval or 14 days from delivery without response.",
      ]
    },
    {
      icon: AlertTriangle,
      title: "Intellectual Property",
      items: [
        "Ownership of the final design and custom content transfers to the client upon full payment.",
        "QIROX retains ownership of the core source code (Core Framework) and general templates.",
        "QIROX may showcase the project in its portfolio unless the client requests otherwise in writing.",
        "Content and files uploaded by the client (logos, images, text) remain the client's property.",
        "The client may not resell or distribute the base template to third parties.",
      ]
    },
    {
      icon: Ban,
      title: "Prohibited Use",
      items: [
        "Using the platform for any illegal activity or violation of Saudi and Egyptian regulations.",
        "Attempting unauthorized access to other users' accounts or platform systems.",
        "Uploading harmful content, viruses, or malicious software.",
        "Using the platform to send unsolicited messages (Spam).",
        "Copying or reverse engineering any part of QIROX systems.",
        "Impersonating other individuals or entities.",
      ]
    },
    {
      icon: AlertTriangle,
      title: "Cancellation & Refunds",
      items: [
        "Clients may cancel orders before execution begins and receive a full refund.",
        "After execution begins, the value of completed work is deducted and the remainder refunded (if any).",
        "After project delivery, no refunds are available for payments made.",
        "QIROX reserves the right to terminate a user's account for violations of these terms with prior notice.",
        "Upon account termination, any files owed to the client will be delivered within 30 days.",
      ]
    },
    {
      icon: Gavel,
      title: "Governing Law",
      items: [
        "These terms are governed by the laws and regulations of the Kingdom of Saudi Arabia.",
        "Any dispute arising from the use of the platform shall first be resolved amicably. If resolution is not possible, it shall be referred to the competent judicial authorities in Riyadh.",
        "These terms are effective from the date of account creation or use of any platform services.",
      ]
    },
  ]
};

export default function Terms() {
  const { lang } = useI18n();
  const content = sections[lang];
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      <section className="pt-40 pb-20 relative overflow-hidden">
        <PageGraphics variant="minimal" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
                <FileText className="w-3.5 h-3.5 text-black/40" />
                <span className="text-black/40 text-xs tracking-wider uppercase">Terms & Conditions</span>
              </motion.div>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-black leading-[1.05] mb-6 tracking-tight">
                {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-black/40 leading-relaxed max-w-2xl mx-auto mb-4">
                {isAr
                  ? "يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام منصة QIROX. هذه الشروط تحكم علاقتك بالمنصة وتحدد حقوقك والتزاماتك."
                  : "Please read these Terms & Conditions carefully before using the QIROX platform. These terms govern your relationship with the platform and define your rights and obligations."}
              </motion.p>
              <motion.p variants={fadeUp} custom={3} className="text-sm text-black/25">
                {isAr ? "آخر تحديث: فبراير 2026" : "Last updated: February 2026"}
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="pb-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {content.map((section, idx) => (
              <motion.div
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={idx}
              >
                <div className="bg-white border border-black/[0.06] rounded-2xl p-8 hover:shadow-lg hover:shadow-black/[0.04] transition-all" data-testid={`terms-section-${idx}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-black/40" />
                    </div>
                    <h2 className="text-xl font-bold font-heading text-black">
                      <span className="text-black/20 ml-2">{String(idx + 1).padStart(2, '0')}</span>
                      {section.title}
                    </h2>
                  </div>
                  <ul className="space-y-4">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-black/50 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-black/15 mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-4xl mx-auto mt-10"
          >
            <div className="bg-[#fafafa] border border-black/[0.06] rounded-2xl p-8 text-center">
              <Mail className="w-8 h-8 text-black/25 mx-auto mb-4" />
              <h3 className="text-lg font-bold font-heading text-black mb-2">
                {isAr ? "أسئلة حول الشروط؟" : "Questions About Terms?"}
              </h3>
              <p className="text-sm text-black/40 mb-4">
                {isAr
                  ? "إذا كان لديك أي استفسار حول الشروط والأحكام، لا تتردد في التواصل معنا:"
                  : "If you have any questions about our Terms & Conditions, don't hesitate to contact us:"}
              </p>
              <p className="text-sm text-black/60 font-medium" data-testid="terms-contact-email">
                legal@qiroxstudio.online
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}