import re

with open('client/src/lib/i18n.tsx', 'r') as f:
    content = f.read()

translations = """
  "dsv2.nav.services": { ar: "الخدمات", en: "Services" },
  "dsv2.nav.portfolio": { ar: "الأنظمة الجاهزة", en: "Ready Systems" },
  "dsv2.nav.contact": { ar: "تواصل معنا", en: "Contact Us" },
  "dsv2.nav.dashboard": { ar: "لوحة التحكم", en: "Dashboard" },
  "dsv2.nav.login": { ar: "دخول", en: "Login" },
  "dsv2.nav.startProject": { ar: "ابدأ مشروعك", en: "Start Project" },
  
  "dsv2.hero.badge": { ar: "مصنع الأنظمة الرقمية", en: "DIGITAL SYSTEMS FACTORY" },
  "dsv2.hero.title1": { ar: "نصمم", en: "We Design" },
  "dsv2.hero.title2": { ar: "ونشحن", en: "and Ship" },
  "dsv2.hero.title3": { ar: "أنظمة للإنتاج", en: "Production Systems" },
  "dsv2.hero.subtitle": { ar: "أنظمة جاهزة للإنتاج، ومتاجر إلكترونية، ومنصات مؤسسية. مصممة كمنتجات SaaS احترافية، وليست مشاريع مخصصة لمرة واحدة. هندسة دقيقة لشركات المستقبل.", en: "Production-ready systems, e-commerce stores, and institutional platforms. Built as polished SaaS products, not custom one-offs. Precision engineering for the companies of the future." },
  "dsv2.hero.cta": { ar: "ابدأ مشروعك", en: "Start Your Project" },
  "dsv2.hero.secondaryCta": { ar: "استكشف الأنظمة", en: "Explore Systems" },

  "dsv2.services.badge": { ar: "الأنظمة والحلول", en: "SYSTEMS & SOLUTIONS" },
  "dsv2.services.title": { ar: "منتجات جاهزة للإنتاج", en: "Production-Ready Products" },
  "dsv2.services.subtitle": { ar: "حلول برمجية متكاملة مصممة بدقة للعمل على نطاق واسع.", en: "Complete software solutions precisely engineered to operate at scale." },
  "dsv2.services.price": { ar: "ر.س", en: "SAR" },
  "dsv2.services.duration": { ar: "أسابيع", en: "Weeks" },
  "dsv2.services.customQuote": { ar: "تسعير مخصص", en: "Custom Quote" },
  
  "dsv2.portfolio.badge": { ar: "أعمالنا", en: "PORTFOLIO" },
  "dsv2.portfolio.title": { ar: "أنظمة حية تعمل الآن", en: "Live Systems in Action" },
  "dsv2.portfolio.subtitle": { ar: "قوالب وأنظمة مخصصة للقطاعات جاهزة للعمل. استعرض إمكانيات الأنظمة الحية التي تعمل في السوق اليوم.", en: "Sector-specific templates and systems ready for deployment. Explore the capabilities of live systems powering the market today." },
  "dsv2.portfolio.viewDemo": { ar: "عرض النظام المباشر", en: "View Live Demo" },
  "dsv2.portfolio.liveDemo": { ar: "تجربة حية", en: "Live Demo" },
  
  "dsv2.tech.badge": { ar: "البنية التقنية", en: "TECHNOLOGY STACK" },
  "dsv2.tech.title": { ar: "بنية تحتية هندسية صارمة", en: "Rigorous Engineering Infrastructure" },
  "dsv2.tech.subtitle": { ar: "تم بناء أنظمتنا على أحدث التقنيات لضمان السرعة، وقابلية التوسع، وتجربة مستخدم ممتازة في اللغتين العربية والإنجليزية.", en: "Our systems are built on modern technologies to ensure speed, scalability, and an excellent user experience in both Arabic and English." },
  
  "dsv2.cta.title": { ar: "جاهز لبناء بنية تحتية رقمية؟", en: "Ready to build a digital infrastructure?" },
  "dsv2.cta.subtitle": { ar: "تواصل معنا لمناقشة متطلبات مشروعك، أو احصل على وصول فوري لأحد أنظمتنا الجاهزة.", en: "Contact us to discuss your project requirements, or get instant access to one of our ready systems." },
  "dsv2.cta.contact": { ar: "تواصل معنا الآن", en: "Contact Us Now" },
  
  "dsv2.footer.description": { ar: "شركة سعودية هندسية لبناء برمجيات على مستوى المؤسسات وأنظمة للشركات الحديثة.", en: "Saudi engineering company building enterprise-grade software and systems for modern businesses." },
  "dsv2.footer.rights": { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },
  "dsv2.footer.legal": { ar: "قانوني", en: "Legal" },
  "dsv2.footer.privacy": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "dsv2.footer.terms": { ar: "الشروط والأحكام", en: "Terms & Conditions" },
  "dsv2.footer.contact": { ar: "تواصل", en: "Contact" },
"""

content = re.sub(r'(  "common\.noData":      \{ ar: "لا توجد بيانات", en: "No data available" \},)', r'\1\n' + translations, content)

with open('client/src/lib/i18n.tsx', 'w') as f:
    f.write(content)

