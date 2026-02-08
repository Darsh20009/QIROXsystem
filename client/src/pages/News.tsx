import { Card, CardContent } from "@/components/ui/card";

export default function News() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-4xl font-bold mb-6 text-primary">الأخبار</h1>
      <div className="space-y-4">
        <Card><CardContent className="pt-6">خبر جديد عن منصة كيروكس</CardContent></Card>
        <Card><CardContent className="pt-6">تحديثات النظام لشهر فبراير</CardContent></Card>
      </div>
    </div>
  );
}
