import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Shield, Eye, Lock, Server, UserCheck, Bell, Mail, Globe } from "lucide-react";
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
      icon: Eye,
      title: "المعلومات التي نجمعها",
      items: [
        "معلومات الحساب: الاسم الكامل، اسم المستخدم، البريد الإلكتروني، رقم الهاتف عند التسجيل.",
        "بيانات المشروع: تفاصيل الطلبات، الملفات المرفوعة (الشعارات، الهوية البصرية، المحتوى)، ومتطلبات المشروع.",
        "بيانات الدفع: معلومات المعاملات المالية عبر PayPal أو التحويل البنكي. لا نخزّن بيانات البطاقات الائتمانية مباشرة.",
        "بيانات الاستخدام: سجلات الدخول، نوع المتصفح، عنوان IP، والصفحات التي تمت زيارتها لتحسين تجربة المستخدم.",
      ]
    },
    {
      icon: Lock,
      title: "كيف نستخدم بياناتك",
      items: [
        "إنشاء وإدارة حسابك على منصة QIROX وتقديم الخدمات المطلوبة.",
        "تنفيذ المشاريع الرقمية وفقاً لمتطلباتك (مواقع مطاعم، متاجر، منصات تعليمية، إلخ).",
        "معالجة المدفوعات والفواتير وإصدار الإيصالات.",
        "التواصل معك بشأن تحديثات المشروع، الدعم الفني، والعروض الجديدة.",
        "تحسين خدماتنا وتطوير قوالب وأنظمة جديدة بناءً على احتياجات السوق.",
      ]
    },
    {
      icon: Server,
      title: "حماية البيانات وتخزينها",
      items: [
        "نستخدم قواعد بيانات MongoDB Atlas المشفرة مع نسخ احتياطية يومية.",
        "جميع الاتصالات مشفرة عبر بروتوكول HTTPS/TLS.",
        "كلمات المرور مشفرة باستخدام خوارزمية scrypt ولا يمكن استرجاعها.",
        "نظام صلاحيات متعدد المستويات (عميل، مدير، مطور، مصمم، محاسب) لضمان وصول كل مستخدم للبيانات المخولة فقط.",
        "الملفات المرفوعة محمية ومتاحة فقط للمستخدم المعني وفريق العمل المخوّل.",
      ]
    },
    {
      icon: UserCheck,
      title: "مشاركة البيانات مع أطراف ثالثة",
      items: [
        "لا نبيع أو نؤجر بياناتك الشخصية لأي طرف ثالث.",
        "قد نشارك بيانات محدودة مع مزودي خدمات الدفع (PayPal) لإتمام المعاملات المالية.",
        "قد نشارك البيانات عند الضرورة القانونية أو بأمر قضائي.",
        "فريق العمل الداخلي (مطورون، مصممون، مدراء) يطّلع فقط على بيانات المشاريع المكلفين بها.",
      ]
    },
    {
      icon: Bell,
      title: "حقوقك كمستخدم",
      items: [
        "طلب نسخة من بياناتك الشخصية المخزنة لدينا.",
        "تعديل أو تحديث معلومات حسابك في أي وقت.",
        "طلب حذف حسابك وبياناتك (مع مراعاة الالتزامات القانونية والتعاقدية).",
        "إلغاء الاشتراك في الرسائل التسويقية.",
        "الاعتراض على معالجة بياناتك لأغراض معينة.",
      ]
    },
    {
      icon: Globe,
      title: "ملفات تعريف الارتباط (Cookies)",
      items: [
        "نستخدم ملفات الجلسة (Session Cookies) للحفاظ على تسجيل دخولك.",
        "نستخدم التخزين المحلي (localStorage) لحفظ تفضيلات اللغة (عربي/إنجليزي).",
        "لا نستخدم ملفات تتبع إعلانية من أطراف ثالثة.",
      ]
    },
  ],
  en: [
    {
      icon: Eye,
      title: "Information We Collect",
      items: [
        "Account Information: Full name, username, email address, and phone number during registration.",
        "Project Data: Order details, uploaded files (logos, brand identity, content), and project requirements.",
        "Payment Data: Transaction information via PayPal or bank transfer. We do not store credit card details directly.",
        "Usage Data: Login records, browser type, IP address, and pages visited to improve user experience.",
      ]
    },
    {
      icon: Lock,
      title: "How We Use Your Data",
      items: [
        "Creating and managing your QIROX platform account and delivering requested services.",
        "Executing digital projects according to your requirements (restaurant sites, stores, educational platforms, etc.).",
        "Processing payments, invoices, and issuing receipts.",
        "Communicating with you regarding project updates, technical support, and new offers.",
        "Improving our services and developing new templates and systems based on market needs.",
      ]
    },
    {
      icon: Server,
      title: "Data Protection & Storage",
      items: [
        "We use encrypted MongoDB Atlas databases with daily backups.",
        "All connections are encrypted via HTTPS/TLS protocol.",
        "Passwords are hashed using the scrypt algorithm and cannot be retrieved.",
        "Multi-level permission system (client, manager, developer, designer, accountant) ensures each user accesses only authorized data.",
        "Uploaded files are protected and accessible only to the relevant user and authorized team members.",
      ]
    },
    {
      icon: UserCheck,
      title: "Third-Party Data Sharing",
      items: [
        "We do not sell or rent your personal data to any third party.",
        "We may share limited data with payment providers (PayPal) to complete financial transactions.",
        "We may share data when legally required or by court order.",
        "Internal team members (developers, designers, managers) only access project data they are assigned to.",
      ]
    },
    {
      icon: Bell,
      title: "Your Rights as a User",
      items: [
        "Request a copy of your personal data stored with us.",
        "Modify or update your account information at any time.",
        "Request deletion of your account and data (subject to legal and contractual obligations).",
        "Unsubscribe from marketing communications.",
        "Object to processing of your data for specific purposes.",
      ]
    },
    {
      icon: Globe,
      title: "Cookies",
      items: [
        "We use session cookies to maintain your login state.",
        "We use localStorage to save language preferences (Arabic/English).",
        "We do not use third-party advertising tracking cookies.",
      ]
    },
  ]
};

export default function Privacy() {
  const { lang } = useI18n();
  const content = sections[lang];
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      <section className="pt-40 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
                <Shield className="w-3.5 h-3.5 text-black/40" />
                <span className="text-black/40 text-xs tracking-wider uppercase">Privacy Policy</span>
              </motion.div>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-black leading-[1.05] mb-6 tracking-tight">
                {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-black/40 leading-relaxed max-w-2xl mx-auto mb-4">
                {isAr
                  ? "نحن في QIROX نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضّح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك."
                  : "At QIROX, we are committed to protecting your privacy and personal data. This policy explains how we collect, use, and protect your information."}
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
                <div className="bg-white border border-black/[0.06] rounded-2xl p-8 hover:shadow-lg hover:shadow-black/[0.04] transition-all" data-testid={`privacy-section-${idx}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-black/40" />
                    </div>
                    <h2 className="text-xl font-bold font-heading text-black">{section.title}</h2>
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
                {isAr ? "تواصل معنا" : "Contact Us"}
              </h3>
              <p className="text-sm text-black/40 mb-4">
                {isAr
                  ? "إذا كان لديك أي استفسار حول سياسة الخصوصية، يمكنك التواصل معنا عبر:"
                  : "If you have any questions about our privacy policy, you can reach us at:"}
              </p>
              <p className="text-sm text-black/60 font-medium" data-testid="privacy-contact-email">
                privacy@qiroxstudio.online
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}