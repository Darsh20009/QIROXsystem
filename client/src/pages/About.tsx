import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-4xl font-bold mb-6 text-primary">من نحن</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-lg leading-relaxed">
            كيروكس (Qirox) هي منصة للخدمات الرقمية تهدف إلى بناء مواقع وأنظمة احترافية للشركات.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
