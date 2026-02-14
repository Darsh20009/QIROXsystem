import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, GraduationCap, Building2, LayoutGrid } from "lucide-react";

const engines = [
  {
    title: "Qirox Commerce Engine",
    description: "محرك التجارة المتكامل للمطاعم، المتاجر، والبراندات العالمية.",
    icon: ShoppingCart,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Qirox Education Engine",
    description: "نظام إدارة تعلم (LMS) جاهز مع تحكم كامل لتجربة تعليمية فريدة.",
    icon: GraduationCap,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "Qirox Corporate Engine",
    description: "أنظمة داخلية متطورة (CRM, HR, ERP) مخصصة لاحتياجات الشركات.",
    icon: Building2,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "Structured Architecture",
    description: "نظام معياري، قابل للتكرار والتوسع بما يخدم رؤية Qirox.",
    icon: LayoutGrid,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  }
];

export default function Segments() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <div className="max-w-3xl mb-12">
        <h1 className="text-4xl font-bold mb-4 text-primary">نظام Qirox الكامل</h1>
        <p className="text-xl text-muted-foreground">
          Core Philosophy: QIROX = System First.
          نحول الخدمات إلى مسارات برمجية مهيكلة وقابلة للتوسع.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {engines.map((engine, index) => (
          <Card key={index} className="hover-elevate transition-all border-none bg-card/50 backdrop-blur">
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
