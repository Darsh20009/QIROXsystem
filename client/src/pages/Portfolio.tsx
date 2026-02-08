import { Card, CardContent } from "@/components/ui/card";

export default function Portfolio() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-4xl font-bold mb-6 text-primary">نماذج الأعمال</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card><CardContent className="pt-6 h-40 flex items-center justify-center">مشروع 1</CardContent></Card>
        <Card><CardContent className="pt-6 h-40 flex items-center justify-center">مشروع 2</CardContent></Card>
        <Card><CardContent className="pt-6 h-40 flex items-center justify-center">مشروع 3</CardContent></Card>
      </div>
    </div>
  );
}
