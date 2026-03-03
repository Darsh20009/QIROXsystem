import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, GraduationCap, Building2, LayoutGrid } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";

export default function Segments() {
  const { lang, dir } = useI18n();

  const engines = [
    {
      title: "Qirox Commerce Engine",
      description: lang === "ar"
        ? "محرك التجارة المتكامل للمطاعم، المتاجر، والبراندات العالمية."
        : "The complete commerce engine for restaurants, stores, and global brands.",
      icon: ShoppingCart,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Qirox Education Engine",
      description: lang === "ar"
        ? "نظام إدارة تعلم (LMS) جاهز مع تحكم كامل لتجربة تعليمية فريدة."
        : "Ready-to-deploy LMS with full control for a unique learning experience.",
      icon: GraduationCap,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Qirox Corporate Engine",
      description: lang === "ar"
        ? "أنظمة داخلية متطورة (CRM, HR, ERP) مخصصة لاحتياجات الشركات."
        : "Advanced internal systems (CRM, HR, ERP) tailored for enterprise needs.",
      icon: Building2,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Structured Architecture",
      description: lang === "ar"
        ? "نظام معياري، قابل للتكرار والتوسع بما يخدم رؤية Qirox."
        : "A modular, repeatable, and scalable system architecture serving the Qirox vision.",
      icon: LayoutGrid,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    }
  ];

  return (
    <div className="relative overflow-hidden container mx-auto px-4 py-8 pt-20" dir={dir}>
      <PageGraphics variant="hero-light" />
      <div className="max-w-3xl mb-12">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          {lang === "ar" ? "نظام Qirox الكامل" : "The Complete Qirox System"}
        </h1>
        <p className="text-xl text-muted-foreground">
          {lang === "ar"
            ? "Core Philosophy: QIROX = System First. نحول الخدمات إلى مسارات برمجية مهيكلة وقابلة للتوسع."
            : "Core Philosophy: QIROX = System First. We transform services into structured, scalable programming paths."}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {engines.map((engine, index) => (
          <Card key={index} className="hover-elevate transition-all border-none bg-card">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={`p-3 rounded-xl ${engine.bg}`}>
                <engine.icon className={`w-6 h-6 ${engine.color}`} />
              </div>
              <CardTitle className="text-xl">{engine.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                {engine.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
