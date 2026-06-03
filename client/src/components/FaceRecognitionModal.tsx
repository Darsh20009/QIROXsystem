import { useState, useRef, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, Loader2, AlertCircle, RotateCcw, ChevronRight, SkipForward } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { markFaceRegistered } from "@/hooks/use-biometric";
import { saveDeviceToken } from "@/hooks/use-auth";

export type FaceMode = "register" | "authenticate";
type Phase = "loading" | "scanning" | "capturing" | "processing" | "success" | "error";

const REG_ANGLES = [
  { key: "front", label: "أمامي", instruction: "انظر مباشرة للكاميرا وثبّت وجهك" },
  { key: "left",  label: "يسار",  instruction: "أدر رأسك قليلاً نحو اليسار" },
  { key: "right", label: "يمين", instruction: "أدر رأسك قليلاً نحو اليمين" },
];
const AUTH_ANGLES = [{ key: "front", label: "أمامي", instruction: "انظر مباشرة للكاميرا" }];

interface Props {
  open: boolean;
  onClose: () => void;
  mode: FaceMode;
  onRegistered?: () => void;
  onSkip?: () => void;
  prefillIdentifier?: string;
  showSkip?: boolean;
}

let _modelsLoaded = false;

export function FaceRecognitionModal({ open, onClose, mode, onRegistered, onSkip, prefillIdentifier, showSkip }: Props) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const confidenceRef = useRef(0);

  const ANGLES = mode === "register" ? REG_ANGLES : AUTH_ANGLES;

  const [phase, setPhase] = useState<Phase>("loading");
  const [angleIdx, setAngleIdx] = useState(0);
  const [captured, setCaptured] = useState<number[][]>([]);
  const [faceDetected, setFaceDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingText, setLoadingText] = useState("تهيئة نظام التعرف...");

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    if (!open) return;
    setPhase("loading");
    setAngleIdx(0);
    setCaptured([]);
    setErrorMsg("");
    setFaceDetected(false);
    setConfidence(0);

    const loadingMessages = ["تهيئة نظام التعرف...", "تحميل نماذج الذكاء الاصطناعي...", "تحليل خوارزميات البيومترية...", "جاهز تقريباً..."];
    let idx = 0;
    const iv = setInterval(() => { if (++idx < loadingMessages.length) setLoadingText(loadingMessages[idx]); }, 700);

    (async () => {
      try {
        if (!_modelsLoaded) {
          await faceapi.nets.tinyFaceDetector.loadFromUri("/models/face-api");
          await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models/face-api");
          await faceapi.nets.faceRecognitionNet.loadFromUri("/models/face-api");
          _modelsLoaded = true;
        }
        clearInterval(iv);
        if (!mountedRef.current) return;
        await openCamera();
      } catch {
        clearInterval(iv);
        if (mountedRef.current) { setErrorMsg("تعذّر تحميل نظام التعرف على الوجه"); setPhase("error"); }
      }
    })();

    return () => { clearInterval(iv); stopAll(); };
  }, [open]);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
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
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      const cv = canvasRef.current;
      const vid = videoRef.current;
      const ctx = cv.getContext("2d");

      if (ctx && vid.videoWidth) {
        cv.width = vid.videoWidth;
        cv.height = vid.videoHeight;
        ctx.clearRect(0, 0, cv.width, cv.height);
      }

      const score = det?.detection?.score || 0;
      confidenceRef.current = score;
      if (mountedRef.current) {
        setFaceDetected(!!det);
        setConfidence(Math.round(score * 100));
      }
      loopRef.current = requestAnimationFrame(loop);
    };
    loopRef.current = requestAnimationFrame(loop);
  };

  const captureOne = async (): Promise<number[] | null> => {
    if (!videoRef.current) return null;
    const det = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
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
      await new Promise(r => setTimeout(r, 700));
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
        setTimeout(() => { if (mountedRef.current) { onRegistered?.(); handleClose(); } }, 2500);
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
        }, 1800);
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
    setConfidence(0);
    setPhase("scanning");
    if (!streamRef.current) await openCamera();
    else startLoop();
  };

  const handleClose = () => { stopAll(); onClose(); };
  const cur = ANGLES[angleIdx];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" dir="rtl">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #0a1628 0%, #060811 60%, #030508 100%)" }}
        onClick={mode === "authenticate" ? handleClose : undefined}
      />

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-400/10"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.05, 0.3, 0.05], scale: [1, 1.5, 1] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(0,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full max-w-sm mx-4"
      >
        {/* Header */}
        <div className="text-center mb-5 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
                {mode === "register" ? "BIOMETRIC ENROLLMENT" : "FACE AUTHENTICATION"}
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              {mode === "register" ? "تسجيل بصمة الوجه" : "الدخول بالوجه"}
            </h2>
            <p className="text-white/40 text-xs mt-1">
              {mode === "register" ? "التقط وجهك من 3 زوايا مختلفة للحماية المثلى" : "انظر للكاميرا لتسجيل دخولك"}
            </p>
          </motion.div>
        </div>

        {/* Camera / State area */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">

            {/* Loading */}
            {phase === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-cyan-500/20 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 flex items-center justify-center">
                      <motion.div
                        className="w-10 h-10 rounded-full border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  </div>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      className="absolute inset-0 rounded-full border border-cyan-400/20"
                      animate={{ scale: [1, 1.8, 2.2], opacity: [0.3, 0.1, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8 }}
                    />
                  ))}
                </div>
                <p className="text-cyan-400/70 text-sm font-medium">{loadingText}</p>
              </motion.div>
            )}

            {/* Camera scan */}
            {(phase === "scanning" || phase === "capturing") && (
              <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Step progress — register only */}
                {mode === "register" && (
                  <div className="flex justify-center gap-3 mb-4">
                    {REG_ANGLES.map((a, i) => (
                      <motion.div key={a.key}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                          i < angleIdx ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : i === angleIdx ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-white/5 text-white/20 border border-white/10"
                        }`}
                        animate={i === angleIdx ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {i < angleIdx && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {a.label}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Camera frame */}
                <div className="relative mx-auto" style={{ width: 280, height: 280 }}>

                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border border-cyan-500/15" />
                  <motion.div
                    className="absolute inset-0 rounded-full border border-cyan-400/30"
                    animate={{ scale: faceDetected ? [1, 1.02, 1] : 1, opacity: faceDetected ? [0.3, 0.6, 0.3] : 0.15 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />

                  {/* Corner L-brackets */}
                  {[
                    { top: 10, left: 10, rotate: 0 },
                    { top: 10, right: 10, rotate: 90 },
                    { bottom: 10, right: 10, rotate: 180 },
                    { bottom: 10, left: 10, rotate: 270 },
                  ].map((pos, i) => (
                    <motion.div key={i}
                      className="absolute w-8 h-8"
                      style={{ ...pos } as any}
                      animate={{ opacity: faceDetected ? 1 : 0.35 }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: `rotate(${pos.rotate}deg)` }}>
                        <path d="M2 16 L2 2 L16 2" fill="none" stroke={faceDetected ? "#22d3ee" : "rgba(255,255,255,0.3)"} strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </motion.div>
                  ))}

                  {/* Oval clip container */}
                  <div className="absolute inset-6 rounded-full overflow-hidden bg-black/50">
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ transform: "scaleX(-1)" }}
                      muted
                      playsInline
                    />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ transform: "scaleX(-1)" }} />

                    {/* Scan beam */}
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 pointer-events-none"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.8), transparent)" }}
                      animate={{ top: ["8%", "92%", "8%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Countdown overlay */}
                    <AnimatePresence>
                      {phase === "capturing" && countdown > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
                        >
                          <motion.span
                            key={countdown}
                            initial={{ scale: 3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="text-6xl font-black text-cyan-300 drop-shadow-2xl tabular-nums"
                          >
                            {countdown}
                          </motion.span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Face confidence ring */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 280 280">
                    <circle cx="140" cy="140" r="132" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="2" />
                    <motion.circle
                      cx="140" cy="140" r="132"
                      fill="none"
                      stroke={faceDetected ? "#22d3ee" : "rgba(255,255,255,0.1)"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 132}`}
                      strokeDashoffset={`${2 * Math.PI * 132 * (1 - confidence / 100)}`}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                      animate={{ strokeDashoffset: `${2 * Math.PI * 132 * (1 - confidence / 100)}` }}
                      transition={{ duration: 0.4 }}
                    />
                  </svg>

                  {/* Confidence badge */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                    <motion.div
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                        faceDetected
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                          : "bg-white/5 border-white/10 text-white/30"
                      }`}
                      animate={faceDetected ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {faceDetected ? `✓ ${confidence}% تطابق` : "لا يوجد وجه"}
                    </motion.div>
                  </div>
                </div>

                {/* Instruction */}
                <p className="text-center text-sm text-white/60 font-medium mt-6 mb-4">{cur.instruction}</p>

                {/* Capture button */}
                <motion.button
                  onClick={handleCapture}
                  disabled={!faceDetected || phase === "capturing"}
                  data-testid="btn-face-capture"
                  className={`w-full h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                    faceDetected && phase === "scanning"
                      ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                      : "bg-white/5 text-white/20 cursor-not-allowed border border-white/10"
                  }`}
                  whileHover={faceDetected ? { scale: 1.02 } : {}}
                  whileTap={faceDetected ? { scale: 0.98 } : {}}
                >
                  {phase === "capturing" ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />جاري الالتقاط...</>
                  ) : (
                    <><Camera className="w-5 h-5" />
                    {mode === "register" ? `التقاط — ${cur.label} (${angleIdx + 1}/${ANGLES.length})` : "تحقق بالوجه"}
                    </>
                  )}
                </motion.button>

                {/* Skip option */}
                {showSkip && mode === "register" && (
                  <button onClick={onSkip}
                    className="w-full mt-3 text-xs text-white/25 hover:text-white/50 transition-colors flex items-center justify-center gap-1.5 py-2">
                    <SkipForward className="w-3.5 h-3.5" />
                    تخطي لأحدثها لاحقاً
                  </button>
                )}
              </motion.div>
            )}

            {/* Processing */}
            {phase === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-16 flex flex-col items-center gap-5">
                <div className="relative">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      className="absolute inset-0 rounded-full border border-cyan-400/30"
                      animate={{ scale: [1, 1.5, 2], opacity: [0.4, 0.1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                    />
                  ))}
                  <motion.div className="w-20 h-20 rounded-full border-2 border-cyan-400 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  </motion.div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">
                    {mode === "register" ? "حفظ البصمة الرقمية..." : "مطابقة البصمة..."}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {mode === "register" ? "يتم تشفير ملامح وجهك وحفظها بأمان" : "يتم البحث في قاعدة البيانات"}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Success */}
            {phase === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="py-16 flex flex-col items-center gap-4">
                <div className="relative">
                  {[0, 1, 2, 3].map(i => (
                    <motion.div key={i}
                      className="absolute inset-0 rounded-full border border-emerald-400/40"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
                      transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                    />
                  ))}
                  <motion.div
                    className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center"
                    animate={{ scale: [0.9, 1.05, 1] }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  </motion.div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-black text-white">
                    {mode === "register" ? "تم تسجيل البصمة! 🎉" : "تم التعرف! ✓"}
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    {mode === "register" ? "بصمة وجهك محفوظة بأمان في حسابك" : "جاري تسجيل دخولك..."}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {phase === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="py-12 flex flex-col items-center gap-5">
                <motion.div
                  className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-bold text-red-400 mb-1">حدث خطأ</p>
                  <p className="text-xs text-white/40 leading-relaxed max-w-[220px] mx-auto">{errorMsg}</p>
                </div>
                <div className="flex gap-2">
                  <motion.button onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <RotateCcw className="w-3.5 h-3.5" />إعادة المحاولة
                  </motion.button>
                  {(showSkip && mode === "register") ? (
                    <motion.button onClick={onSkip}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-bold"
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      تخطي
                    </motion.button>
                  ) : (
                    <motion.button onClick={handleClose}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-bold"
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      إغلاق
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Close button — auth mode only */}
        {mode === "authenticate" && phase !== "success" && (
          <button onClick={handleClose}
            className="absolute top-0 left-0 p-2 text-white/20 hover:text-white/60 transition-colors"
            data-testid="btn-face-close">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
