export interface VersionFeature {
  title: string;
  description: string;
  type: "new" | "improvement" | "fix" | "security";
}

export interface VersionEntry {
  version: string;
  date: string;
  label: string;
  summary: string;
  features: VersionFeature[];
}

export const CURRENT_VERSION = "3.1.0";

export const CHANGELOG: VersionEntry[] = [
  {
    version: "3.1.0",
    date: "2026-03-09",
    label: "نظام مفاتيح API لـ QMeet",
    summary: "إضافة نظام مفاتيح API كامل لـ QMeet مع لوحة إدارة متكاملة ودليل مطورين",
    features: [
      { title: "نظام مفاتيح API لـ QMeet", description: "أصبح بالإمكان إصدار مفاتيح API لـ QMeet بباقتين: Basic (99 ر.س / 100 طلب) وPro (299 ر.س / 1000 طلب). كل مفتاح يتتبع عدد الاستخدامات وآخر وقت استخدام.", type: "new" },
      { title: "نقاط API عامة للاجتماعات", description: "مطورون خارجيون يستطيعون إنشاء وإدارة اجتماعات QMeet برمجياً عبر header المصادقة x-qmeet-api-key.", type: "new" },
      { title: "لوحة إدارة API Keys", description: "تبويب مخصص لإدارة مفاتيح API: إنشاء، تفعيل/تعطيل، نسخ المفتاح، حذف، وعرض توثيق API مع أمثلة كود جاهزة.", type: "new" },
      { title: "نافذة الاجتماع السريع", description: "زر 'اجتماع سريع' يفتح الآن نافذة لاختيار اسم الاجتماع والمدة قبل الإنشاء الفوري.", type: "improvement" },
      { title: "QIROX AI — تكامل داخلي", description: "المساعد الذكي أصبح مدمجاً داخل الصفحات ويعرف بيانات حسابك الحقيقية (طلبات، مشاريع، محفظة) ويدعم التنقل الذكي بالأوامر الطبيعية.", type: "new" },
      { title: "نظام الإشعارات في لوحة التحكم", description: "الإشعارات الآن تظهر بشكل بارز في لوحة التحكم مع بانر وويدجت مخصصة لأهم التحديثات.", type: "improvement" },
    ],
  },
  {
    version: "3.0.0",
    date: "2026-02-20",
    label: "QMeet — نظام الاجتماعات",
    summary: "إطلاق نظام QMeet المدمج للاجتماعات المرئية عبر WebRTC مع دعم كامل للغرف والضيوف",
    features: [
      { title: "QMeet — اجتماعات WebRTC", description: "نظام اجتماعات مرئية مدمج داخل المنصة يعمل عبر WebRTC. يدعم غرف متعددة، مشاركة الشاشة، الدردشة النصية.", type: "new" },
      { title: "انضمام برمز", description: "أي مستخدم يستطيع الانضمام لاجتماع عبر رمز مكوّن من 6 أحرف دون الحاجة لحساب.", type: "new" },
      { title: "جدولة الاجتماعات", description: "تحديد تاريخ، وقت، ومدة الاجتماع مع ظهوره في قائمة الاجتماعات القادمة.", type: "new" },
      { title: "جدولة ذكية تلقائية", description: "النظام يمسح تلقائياً الاجتماعات المنتهية وينظف الغرف غير النشطة.", type: "improvement" },
    ],
  },
  {
    version: "2.8.0",
    date: "2026-01-15",
    label: "نظام الإضافات والمميزات",
    summary: "إضافة نظام Extra Add-ons قابل للتخصيص مع دعم الفلترة حسب القطاع والباقة",
    features: [
      { title: "نظام Extra Add-ons", description: "لوحة تحكم لإضافة وإدارة الإضافات الإضافية للطلبات (استضافة، تطبيقات، تكاملات، تسويق...) مع ربطها بالقطاعات والباقات.", type: "new" },
      { title: "مميزات الباقات", description: "نظام System Features لتعريف ما يتضمنه كل مستوى باقة (lite / pro / infinite) من مميزات النظام.", type: "new" },
      { title: "إعدادات النظام الموحدة", description: "صفحة إعدادات مركزية تشمل: معلومات الشركة، روابط التواصل، روابط التطبيق، إعدادات البريد.", type: "improvement" },
    ],
  },
  {
    version: "2.5.0",
    date: "2025-12-01",
    label: "المحفظة والدفع",
    summary: "نظام محفظة إلكترونية كامل للعملاء مع دعم الإيداع والسحب والربط بالطلبات",
    features: [
      { title: "محفظة العميل الإلكترونية", description: "كل عميل يمتلك محفظة رقمية داخل المنصة. يمكن الإيداع عبر تحويل بنكي ورفع الإيصال، والسحب بطلب معتمد من الإدارة.", type: "new" },
      { title: "الدفع من المحفظة", description: "عند إتمام الطلب يمكن للعميل اختيار الدفع من رصيد محفظته مباشرةً.", type: "new" },
      { title: "سندات القبض", description: "توليد سند قبض رسمي تلقائي عند تأكيد الدفع، قابل للطباعة بتنسيق PDF.", type: "new" },
      { title: "التقسيط", description: "نظام دفع بالتقسيط مرن يحدد عدد الدفعات ومواعيد الاستحقاق مع تذكيرات تلقائية.", type: "new" },
    ],
  },
];
