import { Card, CardContent } from "@/components/ui/card";

export default function Segments() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-4xl font-bold mb-6 text-primary">مساراتنا الأربعة</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardContent className="pt-6 font-bold">المطاعم والمقاهي</CardContent></Card>
        <Card><CardContent className="pt-6 font-bold">المتاجر والعلامات التجارية</CardContent></Card>
        <Card><CardContent className="pt-6 font-bold">المنصات التعليمية</CardContent></Card>
        <Card><CardContent className="pt-6 font-bold">الأنظمة المؤسسية والداخلية</CardContent></Card>
      </div>
    </div>
  );
}
