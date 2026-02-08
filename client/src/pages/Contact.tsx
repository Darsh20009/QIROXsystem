import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-4xl font-bold mb-6 text-primary">تواصل معنا</h1>
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6 space-y-4">
          <Input placeholder="الاسم" />
          <Input placeholder="البريد الإلكتروني" />
          <Textarea placeholder="رسالتك" />
          <Button className="w-full">إرسال</Button>
        </CardContent>
      </Card>
    </div>
  );
}
