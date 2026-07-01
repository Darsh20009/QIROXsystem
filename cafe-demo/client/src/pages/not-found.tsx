import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowRight } from "lucide-react";
import qiroxLogoStaff from "@assets/qirox-logo-staff.png";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-6">
          <img src={qiroxLogoStaff} alt="QIROX" className="w-16 h-16 object-contain rounded-xl" />
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">404 — الصفحة غير موجودة</h1>
            <p className="text-sm text-muted-foreground">
              الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={() => setLocation("/")} className="w-full" data-testid="button-home">
              <Home className="h-4 w-4 ml-2" />
              العودة للرئيسية
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="w-full" data-testid="button-back">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للصفحة السابقة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
