import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

export default function InternalGate() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/internal-gate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setLocation("/employee/register-secret");
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "كلمة المرور غير صحيحة",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء التحقق",
      });
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <PageGraphics variant="auth" />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">بوابة الموظفين</CardTitle>
          <CardDescription>يرجى إدخال كلمة المرور الموحدة للدخول</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center"
                dir="ltr"
              />
            </div>
            <Button type="submit" className="w-full">
              دخول
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
