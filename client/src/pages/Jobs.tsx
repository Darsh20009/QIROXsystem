import { Card, CardContent } from "@/components/ui/card";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

export default function Jobs() {
  return (
    <div className="relative overflow-hidden container mx-auto px-4 py-8 pt-20">
      <PageGraphics variant="bars-corners" />
      <h1 className="text-4xl font-bold mb-6 text-primary">الوظائف</h1>
      <p>لا توجد وظائف شاغرة حالياً. تابعنا للمزيد.</p>
    </div>
  );
}
