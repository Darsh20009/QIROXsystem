import { Card, CardContent } from "@/components/ui/card";

export default function Prices() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-4xl font-bold mb-6 text-primary">أسعار الخدمات</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="pt-6">باقة المبتدئين</CardContent></Card>
        <Card><CardContent className="pt-6">باقة الأعمال</CardContent></Card>
        <Card><CardContent className="pt-6">باقة الشركات</CardContent></Card>
      </div>
    </div>
  );
}
