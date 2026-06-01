import { useState, useRef, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanFace, Camera, CheckCircle2, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { markFaceRegistered } from "@/hooks/use-biometric";
import { saveDeviceToken } from "@/hooks/use-auth";

export type FaceMode = "register" | "authenticate";
type Phase = "loading" | "scanning" | "capturing" | "processing" | "success" | "error";
type Angle = { key: string; label: string; instruction: string };

const REG_ANGLES: Angle[] = [
  { key: "front",  label: "أمام",  instruction: "انظر مباشرة إلى الكاميرا" },
  { key: "left",   label: "يسار",  instruction: "أدر وجهك قليلاً للـيسار" },
  { key: "right",  label: "يمين",  instruction: "أدر وجهك قليلاً للـيمين" },
];

const AUTH_ANGLES: Angle[] = [
  { key: "front", label: "أمام", instruction: "انظر مباشرة إلى الكاميرا" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  mode: FaceMode;
  onRegistered?: () => void;
  prefillIdentifier?: string;
}

let _modelsLoaded = false;

export function FaceRecognitionModal({ open, onClose, mode, onRegistered, prefillIdentifier }: Props) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const ANGLES = mode === "register" ? REG_ANGLES : AUTH_ANGLES;

  const [phase, setPhase] = useState<Phase>("loading");
  const [angleIdx, setAngleIdx] = useState(0);
  const [captured, setCaptured] = useState<number[][]>([]);
  const [faceDetected, setFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    if (!open) return;
    setPhase("loading");
    setAngleIdx(0);
    setCaptured([]);
    setErrorMsg("");
    setFaceDetected(false);

    (async () => {
      try {
        if (!_modelsLoaded) {
          await faceapi.nets.tinyFaceDetector.loadFromUri("/models/face-api");
          await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models/face-api");
          await faceapi.nets.faceRecognitionNet.loadFromUri("/models/face-api");
          _modelsLoaded = true;
        }
        if (!mountedRef.current) return;
        await openCamera();
      } catch {
        if (mountedRef.current) { setErrorMsg("تعذّر تحميل نظام التعرف على الوجه"); setPhase("error"); }
      }
    })();

    return () => stopAll();
  }, [open]);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      if (mountedRef.current) { setPhase("scanning"); startLoop(); }
    } catch {
      if (mountedRef.current) { setErrorMsg("تعذّر الوصول للكاميرا — تأكد من منح الإذن"); setPhase("error"); }
    }
  };

  const stopAll = () => {
    if (loopRef.current) { cancelAnimationFrame(loopRef.current); loopRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startLoop = () => {
    const loop = async () => {
      if (!videoRef.current || !canvasRef.current || !mountedRef.current) return;
      const det = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      const cv = canvasRef.current;
      const vid = videoRef.current;
      const ctx = cv.getContext("2d");
      if (ctx && vid.videoWidth) {
        cv.width = vid.videoWidth; cv.height = vid.videoHeight;
        ctx.clearRect(0, 0, cv.width, cv.height);
        if (det) {
          const b = det.detection.box;
          ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y, b.width, b.height);
          const c = 18, lw = 3.5;
          ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = lw;
          const corners: [number, number, number, number, number, number][] = [
            [b.x, b.y, c, 0, 0, c], [b.x+b.width, b.y, -c, 0, 0, c],
            [b.x, b.y+b.height, c, 0, 0, -c], [b.x+b.width, b.y+b.height, -c, 0, 0, -c],
          ];
          corners.forEach(([x,y,dx1,dy1,dx2,dy2]) => {
            ctx.beginPath(); ctx.moveTo(x+dx1, y+dy1); ctx.lineTo(x, y); ctx.lineTo(x+dx2, y+dy2); ctx.stroke();
          });
        }
      }
      if (mountedRef.current) setFaceDetected(!!det);
      loopRef.current = requestAnimationFrame(loop);
    };
    loopRef.current = requestAnimationFrame(loop);
  };

  const captureOne = async (): Promise<number[] | null> => {
    if (!videoRef.current) return null;
    const det = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
      .withFaceLandmarks(true)
      .withFaceDescriptor();
    return det ? Array.from(det.descriptor) : null;
  };

  const handleCapture = useCallback(async () => {
    if (phase !== "scanning" || !faceDetected) return;
    setPhase("capturing");
    for (let i = 3; i >= 1; i--) {
      if (!mountedRef.current) return;
      setCountdown(i);
      await new Promise(r => setTimeout(r, 650));
    }
    setCountdown(0);
    const desc = await captureOne();
    if (!desc) {
      toast({ title: "لم يُكتشف وجه", description: "تأكد من الإضاءة وإظهار وجهك كاملاً", variant: "destructive" });
      if (mountedRef.current) setPhase("scanning");
      return;
    }
    const newCaptured = [...captured, desc];
    setCaptured(newCaptured);

    if (angleIdx < ANGLES.length - 1) {
      setAngleIdx(i => i + 1);
      setPhase("scanning");
    } else {
      setPhase("processing");
      if (loopRef.current) { cancelAnimationFrame(loopRef.current); loopRef.current = null; }
      await submit(newCaptured);
    }
  }, [phase, faceDetected, angleIdx, captured, ANGLES.length]);

  const submit = async (descs: number[][]) => {
    try {
      if (mode === "register") {
        const res = await apiRequest("POST", "/api/auth/face-recognition/register", { descriptors: descs });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        markFaceRegistered();
        if (mountedRef.current) setPhase("success");
        setTimeout(() => { if (mountedRef.current) { onRegistered?.(); handleClose(); } }, 2200);
      } else {
        const res = await apiRequest("POST", "/api/auth/face-recognition/identify", {
          descriptor: descs[0],
          identifier: prefillIdentifier || undefined,
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.deviceToken) saveDeviceToken(data.deviceToken);
        const userData = { ...data }; delete userData.deviceToken;
        queryClient.setQueryData(["/api/user"], userData);
        if (mountedRef.current) setPhase("success");
        setTimeout(() => {
          if (mountedRef.current) {
            const role = data.role;
            if (role === "admin") navigate("/admin");
            else if (role === "employee") navigate("/employee/dashboard");
            else navigate("/dashboard");
            handleClose();
          }
        }, 1500);
      }
    } catch (e: any) {
      if (mountedRef.current) { setErrorMsg(e.message || "فشلت عملية التعرف على الوجه"); setPhase("error"); }
    }
  };

  const handleReset = async () => {
    setAngleIdx(0);
    setCaptured([]);
    setErrorMsg("");
    setFaceDetected(false);
    setPhase("scanning");
    if (!streamRef.current) await openCamera();
    else startLoop();
  };

  const handleClose = () => {
    stopAll();
    onClose();
  };

  const cur = ANGLES[angleIdx];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm" dir="rtl" aria-describedby="face-modal-desc">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-slate-900 to-sky-950 border border-white/10 shadow-2xl">
          <div className="p-5 pb-0 text-center">
            <h2 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <ScanFace className="w-5 h-5 text-sky-400" />
              {mode === "register" ? "تسجيل بصمة الوجه" : "الدخول بالتعرف على الوجه"}
            </h2>
            <p id="face-modal-desc" className="text-[11px] text-white/30 mt-0.5">
              {mode === "register" ? "التقط وجهك من 3 زوايا مختلفة" : "انظر للكاميرا للدخول"}
            </p>
          </div>

          <div className="p-5 space-y-4">
            <AnimatePresence mode="wait">
              {phase === "loading" && (
                <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-sky-400 mx-auto" />
                  <p className="text-sm text-white/50">تحميل نظام التعرف على الوجه...</p>
                </motion.div>
              )}

              {(phase === "scanning" || phase === "capturing") && (
                <motion.div key="cam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {mode === "register" && (
                    <div className="flex justify-center gap-2">
                      {REG_ANGLES.map((a, i) => (
                        <div key={a.key} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${i < angleIdx ? "bg-green-500/20 text-green-400" : i === angleIdx ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40" : "bg-white/5 text-white/20"}`}>
                          {i < angleIdx && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {a.label}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
                    <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} muted playsInline />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />

                    {phase === "capturing" && countdown > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                        <motion.span key={countdown} initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400 }} className="text-7xl font-black text-sky-300 drop-shadow-2xl">
                          {countdown}
                        </motion.span>
                      </div>
                    )}

                    <div className={`absolute bottom-2 left-2 right-2 text-center rounded-lg py-1.5 text-[10px] font-bold transition-all ${faceDetected ? "bg-green-500/25 text-green-400" : "bg-white/5 text-white/30"}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1 ${faceDetected ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
                      {faceDetected ? "✓ وجه مكتشف — اضغط التقاط" : "لا يوجد وجه في الإطار"}
                    </div>
                  </div>

                  <p className="text-center text-sm text-white/60 font-medium">{cur.instruction}</p>

                  <Button
                    data-testid="btn-face-capture"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold gap-2 disabled:opacity-40"
                    disabled={!faceDetected || phase === "capturing"}
                    onClick={handleCapture}
                  >
                    {phase === "capturing" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />جاري الالتقاط...</>
                    ) : mode === "register" ? (
                      <><Camera className="w-4 h-4" />التقاط — {cur.label} ({angleIdx + 1}/{ANGLES.length})</>
                    ) : (
                      <><ScanFace className="w-4 h-4" />تحقق بالوجه</>
                    )}
                  </Button>
                </motion.div>
              )}

              {phase === "processing" && (
                <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-sky-400 mx-auto" />
                  <p className="text-sm text-white/50">{mode === "register" ? "جاري حفظ بصمة وجهك..." : "جاري البحث عن تطابق..."}</p>
                </motion.div>
              )}

              {phase === "success" && (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }} className="py-10 text-center space-y-3">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto drop-shadow-[0_0_20px_rgba(74,222,128,0.4)]" />
                  <p className="text-base font-bold text-green-400">
                    {mode === "register" ? "تم تسجيل بصمة الوجه!" : "تم التعرف — جاري الدخول..."}
                  </p>
                </motion.div>
              )}

              {phase === "error" && (
                <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                  <p className="text-sm text-red-400 leading-relaxed">{errorMsg}</p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={handleReset} className="bg-sky-700 hover:bg-sky-600 gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" /> إعادة المحاولة
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleClose} className="text-white/40">إغلاق</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
