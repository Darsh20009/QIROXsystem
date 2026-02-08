import { Card, CardContent } from "@/components/ui/card";

export default function Customers() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-4xl font-bold mb-6 text-primary">العملاء</h1>
      <div className="flex flex-wrap gap-8 justify-center">
        <div className="grayscale hover:grayscale-0 transition">Logo 1</div>
        <div className="grayscale hover:grayscale-0 transition">Logo 2</div>
        <div className="grayscale hover:grayscale-0 transition">Logo 3</div>
      </div>
    </div>
  );
}
