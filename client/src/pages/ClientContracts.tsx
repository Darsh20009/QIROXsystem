// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, CheckCircle, XCircle, Clock, Pen, Type } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "بانتظار توقيعك", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  acknowledged: { label: "موقّع", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

function SignaturePad({ onSave }: { onSave: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true); setHasDrawn(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const save = () => {
    const canvas = canvasRef.current; if (!canvas || !hasDrawn) return;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} width={400} height={150} className="border-2 border-dashed border-black/20 rounded-xl w-full touch-none bg-white cursor-crosshair"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        data-testid="canvas-signature"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={clear} className="border-black/20" data-testid="button-clear-signature">مسح</Button>
        <Button size="sm" onClick={save} disabled={!hasDrawn} className="bg-black text-white hover:bg-black/80" data-testid="button-save-signature">استخدام التوقيع</Button>
      </div>
    </div>
  );
}

export default function ClientContracts() {
  const { toast } = useToast();
  const [signDialog, setSignDialog] = useState<any>(null);
  const [signMode, setSignMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | "sign" | "reject">(null);

  const { data: contracts = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/client/contracts"] });

  const signMutation = useMutation({
    mutationFn: (payload: any) => apiRequest("PATCH", `/api/client/contracts/${signDialog?.id}/sign`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/contracts"] });
      setSignDialog(null); setConfirmAction(null); setSignatureData(""); setTypedName("");
      toast({ title: confirmAction === "reject" ? "تم رفض العقد" : "تم التوقيع على العقد بنجاح" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const pending = contracts.filter(c => c.status === "pending");
  const done = contracts.filter(c => c.status !== "pending");

  const handleSign = () => {
    if (signMode === "type" && !typedName.trim()) return toast({ title: "يرجى كتابة اسمك" });
    if (signMode === "draw" && !signatureData) return toast({ title: "يرجى رسم توقيعك" });
    signMutation.mutate({ signatureData: signMode === "draw" ? signatureData : "", signatureText: signMode === "type" ? typedName : "" });
    setConfirmAction("sign");
  };

  const handleReject = () => {
    setConfirmAction("reject");
    signMutation.mutate({ action: "reject" });
  };

  return (
    <div className="p-6 space-y-6 font-sans max-w-3xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-black">عقودي الإلكترونية</h1>
        <p className="text-black/50 text-sm">عرض وتوقيع عقود الخدمات</p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-black/30">جاري التحميل...</div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-16 text-black/30"><FileText className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>لا توجد عقود بعد</p></div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-black/60 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> تحتاج إلى توقيعك ({pending.length})</h2>
              <div className="space-y-3">
                {pending.map(c => (
                  <Card key={c.id} className="border-amber-200 bg-amber-50/50" data-testid={`card-contract-${c.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold">{c.order?.serviceTitle || c.order?.title || "عقد خدمة"}</div>
                          <div className="text-sm text-black/40 mt-0.5">{c.totalAmount?.toLocaleString()} ريال · {new Date(c.createdAt).toLocaleDateString("ar-SA")}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-black/20" onClick={() => setSignDialog(c)} data-testid={`button-open-contract-${c.id}`}>
                            عرض وتوقيع
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-black/60 mb-3">السابقة</h2>
              <div className="space-y-3">
                {done.map(c => {
                  const st = STATUS_MAP[c.status] || STATUS_MAP.pending;
                  return (
                    <Card key={c.id} className="border-black/10" data-testid={`card-contract-done-${c.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{c.order?.serviceTitle || c.order?.title || "عقد"}</div>
                            <div className="text-xs text-black/40 mt-0.5">{c.totalAmount?.toLocaleString()} ريال · {new Date(c.createdAt).toLocaleDateString("ar-SA")}</div>
                          </div>
                          <Badge className={`${st.color} border text-xs`}>{st.label}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!signDialog} onOpenChange={() => setSignDialog(null)}>
        <DialogContent className="sm:max-w-2xl font-sans max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>مراجعة وتوقيع العقد</DialogTitle></DialogHeader>
          {signDialog && (
            <div className="space-y-5">
              <div className="bg-black/5 rounded-xl p-5 max-h-64 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans text-black/80">{signDialog.terms}</pre>
              </div>
              {signDialog.totalAmount > 0 && (
                <div className="bg-black/5 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm text-black/60">قيمة العقد</span>
                  <span className="font-bold">{signDialog.totalAmount?.toLocaleString()} ريال</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="font-semibold text-sm">التوقيع الإلكتروني</div>
                <div className="flex gap-2">
                  <Button size="sm" variant={signMode === "draw" ? "default" : "outline"} onClick={() => setSignMode("draw")} className={signMode === "draw" ? "bg-black text-white" : "border-black/20"} data-testid="button-sign-mode-draw">
                    <Pen className="w-3.5 h-3.5 ml-1" /> رسم التوقيع
                  </Button>
                  <Button size="sm" variant={signMode === "type" ? "default" : "outline"} onClick={() => setSignMode("type")} className={signMode === "type" ? "bg-black text-white" : "border-black/20"} data-testid="button-sign-mode-type">
                    <Type className="w-3.5 h-3.5 ml-1" /> كتابة الاسم
                  </Button>
                </div>
                {signMode === "draw" ? (
                  <SignaturePad onSave={setSignatureData} />
                ) : (
                  <div className="space-y-2">
                    <Input value={typedName} onChange={e => setTypedName(e.target.value)} placeholder="اكتب اسمك الكامل..." className="border-black/20 text-center font-bold text-lg" style={{ fontFamily: "cursive" }} data-testid="input-typed-signature" />
                    {typedName && <div className="text-center py-4 text-2xl font-bold text-black/60" style={{ fontFamily: "cursive" }}>{typedName}</div>}
                  </div>
                )}
              </div>

              {signatureData && signMode === "draw" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center text-sm text-green-700 flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4" /> تم حفظ التوقيع، اضغط "أوافق وأوقّع" للتأكيد
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50" onClick={handleReject} disabled={signMutation.isPending} data-testid="button-reject-contract">
                  رفض العقد
                </Button>
                <Button onClick={handleSign} disabled={signMutation.isPending || (signMode === "draw" && !signatureData) || (signMode === "type" && !typedName.trim())} className="flex-1 bg-black text-white hover:bg-black/80" data-testid="button-sign-contract">
                  {signMutation.isPending ? "جاري المعالجة..." : "أوافق وأوقّع ✓"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
