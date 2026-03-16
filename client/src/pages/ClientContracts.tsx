// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  FileText, CheckCircle, XCircle, Clock, Pen, Type,
  ShieldCheck, ArrowRight, RefreshCw, Info
} from "lucide-react";

// ──────────────────────────── SignaturePad ───────────────────────────────────
function SignaturePad({ onSave }: { onSave: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
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
    if (!isDrawing) return; e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };
  const endDraw = () => setIsDrawing(false);
  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false); onSave("");
  };
  const save = () => {
    const canvas = canvasRef.current; if (!canvas || !hasDrawn) return;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef} width={600} height={180}
        className="border-2 border-dashed border-black/20 rounded-xl w-full touch-none bg-white cursor-crosshair"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        data-testid="canvas-signature"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={clear} className="border-black/20" data-testid="button-clear-signature">مسح</Button>
        <Button size="sm" onClick={save} disabled={!hasDrawn} className="bg-black text-white hover:bg-black/80" data-testid="button-save-signature">
          حفظ التوقيع
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────── Steps indicator ────────────────────────────────
function StepIndicator({ step, L }: { step: number; L: boolean }) {
  const steps = L
    ? ["قراءة العقد", "التوقيع", "التحقق بـ OTP", "مكتمل"]
    : ["Read Contract", "Sign", "OTP Verify", "Done"];
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5 flex-1">
          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-green-500 text-white" : i === step ? "bg-black text-white" : "bg-black/10 text-black/40"}`}>
            {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:block ${i === step ? "font-semibold text-black" : "text-black/40"}`}>{label}</span>
          {i < steps.length - 1 && <div className={`flex-1 h-px mx-1 ${i < step ? "bg-green-400" : "bg-black/10"}`} />}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────── Main Page ─────────────────────────────────────
export default function ClientContracts() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
    pending:     { label: L ? "بانتظار توقيعك" : "Awaiting Your Signature", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    acknowledged:{ label: L ? "موقّع ✓" : "Signed ✓",                      color: "bg-green-100 text-green-700 border-green-200",  icon: CheckCircle },
    rejected:    { label: L ? "مرفوض" : "Rejected",                         color: "bg-red-100 text-red-700 border-red-200",        icon: XCircle },
  };

  const [signDialog, setSignDialog] = useState<any>(null);
  const [step, setStep] = useState(0);          // 0=read, 1=sign, 2=otp, 3=done
  const [signMode, setSignMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const { data: contracts = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/client/contracts"] });

  const pending = contracts.filter(c => c.status === "pending");
  const done    = contracts.filter(c => c.status !== "pending");

  const resetDialog = () => {
    setSignDialog(null); setStep(0); setSignMode("draw");
    setTypedName(""); setSignatureData(""); setOtpCode(""); setOtpSent(false);
  };

  // Step 2 → Step 3: request OTP
  const otpMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/client/contracts/${signDialog?.id}/sign/request-otp`, {}),
    onSuccess: () => { setOtpSent(true); setStep(2); toast({ title: L ? "تم إرسال رمز التحقق" : "OTP Sent", description: L ? "تحقق من إشعاراتك داخل التطبيق" : "Check your in-app notifications" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  // Step 3 → Step 4: submit signature + OTP
  const signMutation = useMutation({
    mutationFn: (payload: any) => apiRequest("PATCH", `/api/client/contracts/${signDialog?.id}/sign`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/contracts"] });
      setStep(3);
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  // Step 3 → reject
  const rejectMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/client/contracts/${signDialog?.id}/sign`, { action: "reject" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/contracts"] });
      resetDialog();
      toast({ title: L ? "تم رفض العقد" : "Contract Rejected" });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const canProceedToOtp = signMode === "draw" ? !!signatureData : !!typedName.trim();

  const handleSubmitSign = () => {
    if (!otpCode.trim() || otpCode.length < 6) return toast({ title: L ? "أدخل رمز التحقق المكوّن من 6 أرقام" : "Enter the 6-digit OTP" });
    signMutation.mutate({
      signatureData: signMode === "draw" ? signatureData : "",
      signatureText: signMode === "type" ? typedName : "",
      otpCode,
    });
  };

  return (
    <div className="p-6 space-y-6 font-sans max-w-3xl mx-auto" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">{L ? "عقودي الإلكترونية" : "My Contracts"}</h1>
        <p className="text-black/50 dark:text-white/40 text-sm">{L ? "عرض وتوقيع عقود الخدمات بشكل قانوني" : "Legally binding electronic contract signing"}</p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-black/30">{L ? "جاري التحميل..." : "Loading..."}</div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-16 text-black/30">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>{L ? "لا توجد عقود بعد" : "No contracts yet"}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-black/60 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                {L ? `تحتاج إلى توقيعك (${pending.length})` : `Awaiting your signature (${pending.length})`}
              </h2>
              <div className="space-y-3">
                {pending.map(c => (
                  <Card key={c.id} className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20" data-testid={`card-contract-${c.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{c.contractNumber || (L ? "عقد خدمة" : "Service Contract")}</div>
                            <div className="text-xs text-black/40 mt-0.5">
                              {c.order?.serviceTitle || c.order?.title || (L ? "خدمة" : "Service")} · {c.totalAmount?.toLocaleString()} {L ? "ريال" : "SAR"}
                            </div>
                            <div className="text-xs text-black/30">{new Date(c.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => { setSignDialog(c); setStep(0); }} className="bg-black text-white hover:bg-black/80 gap-1.5" data-testid={`button-open-contract-${c.id}`}>
                          <Pen className="w-3.5 h-3.5" /> {L ? "عرض وتوقيع" : "View & Sign"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-black/60 dark:text-white/50 mb-3">{L ? "السابقة" : "Previous"}</h2>
              <div className="space-y-3">
                {done.map(c => {
                  const st = STATUS_MAP[c.status] || STATUS_MAP.pending;
                  return (
                    <Card key={c.id} className="border-black/10" data-testid={`card-contract-done-${c.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm flex items-center gap-2">
                              {c.contractNumber || (L ? "عقد" : "Contract")}
                              {c.signedOtpVerified && (
                                <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" /> OTP
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-black/40 mt-0.5">
                              {c.totalAmount?.toLocaleString()} {L ? "ريال" : "SAR"} · {new Date(c.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}
                            </div>
                          </div>
                          <Badge className={`${st.color} border text-xs`}>{st.label}</Badge>
                        </div>
                        {c.status === "acknowledged" && c.signatureData && (
                          <div className="mt-3 border border-green-200 rounded-lg p-2 bg-green-50 inline-block">
                            <img src={c.signatureData} alt={L ? "توقيعك" : "Your signature"} className="max-h-12 max-w-xs" />
                          </div>
                        )}
                        {c.status === "acknowledged" && c.signatureText && (
                          <div className="mt-2 text-lg font-bold text-green-700" style={{ fontFamily: "cursive" }}>{c.signatureText}</div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Multi-step Sign Dialog ── */}
      <Dialog open={!!signDialog} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-2xl font-sans max-h-[90vh] overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {step === 3 ? (L ? "تم التوقيع بنجاح 🎉" : "Signed Successfully 🎉") : (L ? "مراجعة وتوقيع العقد" : "Review & Sign Contract")}
            </DialogTitle>
          </DialogHeader>

          {signDialog && step < 3 && (
            <StepIndicator step={step} L={L} />
          )}

          {/* STEP 0: Read Contract */}
          {signDialog && step === 0 && (
            <div className="space-y-5">
              {signDialog.contractNumber && (
                <div className="text-xs text-black/40 font-mono">{L ? "رقم العقد:" : "Contract No:"} {signDialog.contractNumber}</div>
              )}
              <div className="bg-black/5 rounded-xl p-5 max-h-72 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans text-black/80 leading-relaxed">{signDialog.terms}</pre>
              </div>
              {signDialog.totalAmount > 0 && (
                <div className="bg-black/5 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm text-black/60">{L ? "قيمة العقد" : "Contract Value"}</span>
                  <span className="font-bold text-lg">{signDialog.totalAmount?.toLocaleString()} <span className="text-sm font-normal text-black/40">{L ? "ريال" : "SAR"}</span></span>
                </div>
              )}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2 text-xs text-blue-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{L ? "قراءة العقد جيداً قبل التوقيع. بالتوقيع الإلكتروني تؤكد موافقتك على جميع البنود المذكورة." : "Read the contract carefully before signing. By signing electronically you confirm your agreement to all stated terms."}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50" onClick={() => { if (confirm(L ? "رفض هذا العقد؟" : "Reject this contract?")) rejectMutation.mutate(); }} disabled={rejectMutation.isPending} data-testid="button-reject-contract">
                  {L ? "رفض العقد" : "Reject Contract"}
                </Button>
                <Button onClick={() => setStep(1)} className="flex-1 bg-black text-white hover:bg-black/80 gap-2" data-testid="button-proceed-to-sign">
                  {L ? "متابعة للتوقيع" : "Proceed to Sign"} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: Signature */}
          {signDialog && step === 1 && (
            <div className="space-y-5">
              <div className="flex gap-2">
                <Button size="sm" variant={signMode === "draw" ? "default" : "outline"} onClick={() => { setSignMode("draw"); setSignatureData(""); }} className={signMode === "draw" ? "bg-black text-white" : "border-black/20"} data-testid="button-sign-mode-draw">
                  <Pen className="w-3.5 h-3.5 mr-1.5" /> {L ? "رسم التوقيع" : "Draw Signature"}
                </Button>
                <Button size="sm" variant={signMode === "type" ? "default" : "outline"} onClick={() => { setSignMode("type"); setSignatureData(""); }} className={signMode === "type" ? "bg-black text-white" : "border-black/20"} data-testid="button-sign-mode-type">
                  <Type className="w-3.5 h-3.5 mr-1.5" /> {L ? "كتابة الاسم" : "Type Name"}
                </Button>
              </div>

              {signMode === "draw" ? (
                <div className="space-y-2">
                  <label className="text-sm text-black/60">{L ? "ارسم توقيعك داخل المنطقة البيضاء:" : "Draw your signature in the white area:"}</label>
                  <SignaturePad onSave={setSignatureData} />
                  {signatureData && (
                    <div className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {L ? "تم حفظ التوقيع" : "Signature saved"}</div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm text-black/60">{L ? "اكتب اسمك الكامل كتوقيع قانوني:" : "Type your full name as a legal signature:"}</label>
                  <Input
                    value={typedName} onChange={e => setTypedName(e.target.value)}
                    placeholder={L ? "الاسم الكامل..." : "Full name..."}
                    className="border-black/20 text-center font-bold text-xl"
                    style={{ fontFamily: "cursive" }}
                    data-testid="input-typed-signature"
                  />
                  {typedName && (
                    <div className="text-center py-5 text-3xl font-bold text-black/60 border-2 border-dashed border-black/10 rounded-xl bg-white" style={{ fontFamily: "cursive" }}>
                      {typedName}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="border-black/20" data-testid="button-back-to-read">
                  {L ? "رجوع" : "Back"}
                </Button>
                <Button
                  onClick={() => otpMutation.mutate()}
                  disabled={!canProceedToOtp || otpMutation.isPending}
                  className="flex-1 bg-black text-white hover:bg-black/80 gap-2"
                  data-testid="button-request-otp"
                >
                  {otpMutation.isPending ? (L ? "جاري الإرسال..." : "Sending...") : (<>{L ? "طلب رمز التحقق" : "Request OTP"} <ShieldCheck className="w-4 h-4" /></>)}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: OTP */}
          {signDialog && step === 2 && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-blue-500 mx-auto" />
                <div className="font-semibold text-blue-800">{L ? "تحقق من هويتك" : "Verify Your Identity"}</div>
                <p className="text-sm text-blue-600">{L ? "تم إرسال رمز التحقق المكوّن من 6 أرقام إلى إشعاراتك داخل التطبيق. أدخله أدناه لإتمام التوقيع القانوني." : "A 6-digit OTP has been sent to your in-app notifications. Enter it below to complete the legal signature."}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{L ? "رمز التحقق (OTP)" : "Verification Code (OTP)"}</label>
                <Input
                  value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="● ● ● ● ● ●"
                  maxLength={6}
                  className="text-center text-2xl font-bold tracking-[0.4em] border-black/20 h-14"
                  data-testid="input-otp-code"
                />
              </div>

              <button
                className="text-xs text-black/40 hover:text-black/70 flex items-center gap-1 mx-auto"
                onClick={() => otpMutation.mutate()}
                disabled={otpMutation.isPending}
                data-testid="button-resend-otp"
              >
                <RefreshCw className="w-3 h-3" /> {L ? "إعادة إرسال الرمز" : "Resend code"}
              </button>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="border-black/20" data-testid="button-back-to-signature">
                  {L ? "رجوع" : "Back"}
                </Button>
                <Button
                  onClick={handleSubmitSign}
                  disabled={otpCode.length < 6 || signMutation.isPending}
                  className="flex-1 bg-black text-white hover:bg-black/80 gap-2"
                  data-testid="button-confirm-sign"
                >
                  {signMutation.isPending ? (L ? "جاري التوقيع..." : "Signing...") : (L ? "تأكيد التوقيع ✓" : "Confirm Signature ✓")}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Done */}
          {step === 3 && (
            <div className="text-center py-8 space-y-5">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-green-700">{L ? "تم التوقيع بنجاح!" : "Signed Successfully!"}</h3>
                <p className="text-sm text-black/50">{L ? "وُقِّع العقد إلكترونياً وتم التحقق من هويتك بـ OTP. هذا التوقيع ملزم قانونياً." : "The contract was signed electronically with OTP identity verification. This signature is legally binding."}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 space-y-1">
                <div className="flex items-center gap-2 justify-center font-semibold"><CheckCircle className="w-4 h-4" /> {L ? "العقد موقّع ✓" : "Contract Signed ✓"}</div>
                <div className="text-xs text-green-500">{L ? "تم إشعار الفريق" : "Team notified"}</div>
              </div>
              <Button onClick={resetDialog} className="bg-black text-white hover:bg-black/80" data-testid="button-close-done">
                {L ? "إغلاق" : "Close"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
