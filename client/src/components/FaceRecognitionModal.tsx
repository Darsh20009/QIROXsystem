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
  { key: "front", label: "أمامي",  instruction: "انظر مباشرة للكاميرا وثبّت وجهك" },
  { key: "left",  label: "يسار",   instruction: "أدر رأسك قليلاً نحو اليسار" },
  { key: "right", label: "يمين",   instruction: "أدر رأسك قليلاً نحو اليمين" },
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
let _modelsLoading = false;

async function ensureModels() {
  if (_modelsLoaded) return;
  if (_modelsLoading) {
    // wait for ongoing load
    while (_modelsLoading) await new Promise(r => setTimeout(r, 100));
    return;
  }
  _modelsLoading = true;
  try {
    const MODEL_URL = "/models/face-api";
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    _modelsLoaded = true;
  } finally {
    _modelsLoading = false;
  }
}

export function FaceRecognitionModal({ open, onClose, mode, onRegistered, onSkip, prefillIdentifier, showSkip }: Props) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const videoRef   = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const detectingRef = useRef(false);   // guard against concurrent detections

  const ANGLES = mode === "register" ? REG_ANGLES : AUTH_ANGLES;

  const [phase,       setPhase]       = useState<Phase>("loading");
  const [angleIdx,    setAngleIdx]    = useState(0);
  const [captured,    setCaptured]    = useState<number[][]>([]);
  const [faceDetected,setFaceDetected]= useState(false);
  const [confidence,  setConfidence]  = useState(0);
  const [countdown,   setCountdown]   = useState(0);
  const [errorMsg,    setErrorMsg]    = useState("");
  const [loadingText, setLoadingText] = useState("تهيئة نظام التعرف...");

  const phaseRef     = useRef<Phase>("loading");
  const capturedRef  = useRef<number[][]>([]);
  const angleIdxRef  = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { capturedRef.current = captured; }, [captured]);
  useEffect(() => { angleIdxRef.current = angleIdx; }, [angleIdx]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Open / reset ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    setPhase("loading");
    setAngleIdx(0);
    setCaptured([]);
    setErrorMsg("");
    setFaceDetected(false);
    setConfidence(0);
    setCountdown(0);
    phaseRef.current = "loading";
    capturedRef.current = [];
    angleIdxRef.current = 0;

    const msgs = ["تهيئة نظام التعرف...", "تحميل نماذج الذكاء الاصطناعي...", "تحليل الخوارزميات...", "جاهز تقريباً..."];
    let mi = 0;
    const iv = setInterval(() => { if (++mi < msgs.length) setLoadingText(msgs[mi]); }, 800);

    ensureModels()
      .then(() => {
        clearInterval(iv);
        if (!mountedRef.current) return;
        return openCamera();
      })
      .catch(() => {
        clearInterval(iv);
        if (mountedRef.current) { setErrorMsg("تعذّر تحميل نماذج التعرف على الوجه"); setPhase("error"); }
      });

    return () => { clearInterval(iv); stopAll(); };
  }, [open]);

  // ── Camera ───────────────────────────────────────────────────────────────
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try { await videoRef.current?.play(); } catch {}
          if (mountedRef.current) {
            setPhase("scanning");
            phaseRef.current = "scanning";
            startDetectionLoop();
          }
        };
      }
    } catch (err: any) {
      if (mountedRef.current) {
        const msg = err?.name === "NotAllowedError"
          ? "تم رفض الوصول للكاميرا — يرجى السماح بالوصول في إعدادات المتصفح"
          : "تعذّر الوصول للكاميرا";
        setErrorMsg(msg);
        setPhase("error");
      }
    }
  };

  const stopAll = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    detectingRef.current = false;
  };

  // ── Detection loop — 200ms interval, one async task at a time ────────────
  const startDetectionLoop = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(async () => {
      const vid = videoRef.current;
      if (!vid || !mountedRef.current) return;
      if (detectingRef.current) return;               // skip frame if still processing
      if (phaseRef.current !== "scanning") return;    // only detect while scanning

      // Ensure video is ready
      if (vid.readyState < 2 || vid.videoWidth === 0) return;

      detectingRef.current = true;
      try {
        const det = await faceapi
          .detectSingleFace(vid, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
          .withFaceLandmarks(true)
          .withFaceDescriptor();

        if (!mountedRef.current) return;

        const score = det?.detection?.score || 0;
        setFaceDetected(!!det && score >= 0.3);
        setConfidence(Math.round(score * 100));
      } catch {
        // silent — detection failed this frame, retry next
      } finally {
        detectingRef.current = false;
      }
    }, 200) as any;
  };

  // ── Capture one descriptor ────────────────────────────────────────────────
  const captureDescriptor = async (): Promise<number[] | null> => {
    const vid = videoRef.current;
    if (!vid || vid.readyState < 2) return null;
    try {
      const det = await faceapi
        .detectSingleFace(vid, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();
      return det ? Array.from(det.descriptor) : null;
    } catch { return null; }
  };

  // ── Handle capture button ─────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (phaseRef.current !== "scanning" || !faceDetected) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    setPhase("capturing");
    phaseRef.current = "capturing";

    for (let i = 3; i >= 1; i--) {
      if (!mountedRef.current) return;
      setCountdown(i);
      await new Promise(r => setTimeout(r, 700));
    }
    setCountdown(0);

    const desc = await captureDescriptor();
    if (!mountedRef.current) return;

    if (!desc) {
      toast({ title: "لم يُكتشف وجه", description: "تأكد من الإضاءة الجيدة وإظهار وجهك كاملاً", variant: "destructive" });
      setPhase("scanning");
      phaseRef.current = "scanning";
      startDetectionLoop();
      return;
    }

    const newCaptured = [...capturedRef.current, desc];
    setCaptured(newCaptured);
    capturedRef.current = newCaptured;

    if (angleIdxRef.current < ANGLES.length - 1) {
      const next = angleIdxRef.current + 1;
      setAngleIdx(next);
      angleIdxRef.current = next;
      setPhase("scanning");
      phaseRef.current = "scanning";
      startDetectionLoop();
    } else {
      setPhase("processing");
      phaseRef.current = "processing";
      await submit(newCaptured);
    }
  }, [faceDetected, ANGLES.length]);

  // ── Submit to backend ─────────────────────────────────────────────────────
  const submit = async (descs: number[][]) => {
    try {
      if (mode === "register") {
        const res  = await apiRequest("POST", "/api/auth/face-recognition/register", { descriptors: descs });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        markFaceRegistered();
        if (mountedRef.current) setPhase("success");
        setTimeout(() => { if (mountedRef.current) { onRegistered?.(); handleClose(); } }, 2200);
      } else {
        const res  = await apiRequest("POST", "/api/auth/face-recognition/identify", {
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
            const r = data.role;
            if (r === "admin" || r === "manager") navigate("/admin");
            else if (r?.startsWith("employee")) navigate("/employee/dashboard");
            else navigate("/dashboard");
            handleClose();
          }
        }, 1600);
      }
    } catch (e: any) {
      if (mountedRef.current) {
        setErrorMsg(e.message || "فشلت عملية التعرف على الوجه — لم يُعرَّف الوجه");
        setPhase("error");
      }
    }
  };

  const handleReset = async () => {
    setAngleIdx(0);
    setAngleIdx(0);
    angleIdxRef.current = 0;
    setCaptured([]);
    capturedRef.current = [];
    setErrorMsg("");
    setFaceDetected(false);
    setConfidence(0);
    setCountdown(0);

    if (!streamRef.current) {
      setPhase("loading");
      await openCamera();
    } else {
      setPhase("scanning");
      phaseRef.current = "scanning";
      startDetectionLoop();
    }
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
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #0a1628 0%, #060811 60%, #030508 100%)" }}
        onClick={mode === "authenticate" ? handleClose : undefined}
      />

      {/* Particle grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(0,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        {Array.from({ length: 28 }).map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full bg-cyan-400/20"
            style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0.05, 0.35, 0.05] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full max-w-[340px] mx-4"
      >
        {/* Header */}
        <div className="text-center mb-4 relative z-10">
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
            {mode === "register" ? "التقط وجهك من 3 زوايا مختلفة" : "انظر مباشرة للكاميرا"}
          </p>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">

            {/* ── Loading ── */}
            {phase === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-14 gap-5">
                <div className="relative">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="absolute inset-0 rounded-full border border-cyan-400/25"
                      animate={{ scale: [1, 1.8, 2.4], opacity: [0.3, 0.08, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.7 }}
                    />
                  ))}
                  <motion.div className="w-20 h-20 rounded-full border-2 border-t-cyan-400 border-r-cyan-300 border-b-cyan-500/30 border-l-cyan-500/30"
                    animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <p className="text-cyan-400/80 text-sm font-medium">{loadingText}</p>
              </motion.div>
            )}

            {/* ── Scanning / Capturing ── */}
            {(phase === "scanning" || phase === "capturing") && (
              <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Angle progress — register only */}
                {mode === "register" && (
                  <div className="flex justify-center gap-2 mb-4">
                    {REG_ANGLES.map((a, i) => (
                      <motion.div key={a.key}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                          i < angleIdx   ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : i === angleIdx ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-white/5 text-white/20 border-white/10"
                        }`}
                        animate={i === angleIdx ? { scale: [1, 1.04, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {i < angleIdx && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {a.label}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Camera oval */}
                <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
                  {/* Outer glow ring */}
                  <motion.div className="absolute inset-0 rounded-full border border-cyan-400/20"
                    animate={{ opacity: faceDetected ? [0.3, 0.7, 0.3] : 0.15 }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />

                  {/* L-brackets */}
                  {[
                    { style: { top: 8, left: 8 },   rotate: 0   },
                    { style: { top: 8, right: 8 },   rotate: 90  },
                    { style: { bottom: 8, right: 8 }, rotate: 180 },
                    { style: { bottom: 8, left: 8 },  rotate: 270 },
                  ].map((b, i) => (
                    <motion.div key={i} className="absolute w-8 h-8" style={b.style as any}
                      animate={{ opacity: faceDetected ? 1 : 0.3 }} transition={{ duration: 0.3 }}>
                      <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: `rotate(${b.rotate}deg)` }}>
                        <path d="M2 18 L2 2 L18 2" fill="none"
                          stroke={faceDetected ? "#22d3ee" : "rgba(255,255,255,0.25)"} strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </motion.div>
                  ))}

                  {/* Video oval */}
                  <div className="absolute inset-6 rounded-full overflow-hidden bg-black/60 border border-white/10">
                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover"
                      style={{ transform: "scaleX(-1)" }} muted playsInline autoPlay />

                    {/* Scan beam */}
                    <motion.div
                      className="absolute left-0 right-0 h-px pointer-events-none"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.85), transparent)", boxShadow: "0 0 8px rgba(34,211,238,0.4)" }}
                      animate={{ top: ["5%", "95%", "5%"] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Countdown overlay */}
                    <AnimatePresence>
                      {phase === "capturing" && countdown > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                          <motion.span key={countdown}
                            initial={{ scale: 3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 280 }}
                            className="text-7xl font-black text-cyan-300 tabular-nums drop-shadow-2xl">
                            {countdown}
                          </motion.span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Confidence ring SVG */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 280 280">
                    <circle cx="140" cy="140" r="133" fill="none" stroke="rgba(34,211,238,0.07)" strokeWidth="2" />
                    <motion.circle cx="140" cy="140" r="133" fill="none"
                      stroke={faceDetected ? "#22d3ee" : "rgba(255,255,255,0.08)"} strokeWidth="2" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 133}`}
                      animate={{ strokeDashoffset: `${2 * Math.PI * 133 * (1 - Math.max(0, confidence) / 100)}` }}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                      transition={{ duration: 0.4 }}
                    />
                  </svg>

                  {/* Confidence badge */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4">
                    <motion.div className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${
                      faceDetected ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-white/5 border-white/10 text-white/25"
                    }`} animate={faceDetected ? { scale: [1, 1.04, 1] } : {}} transition={{ duration: 1.4, repeat: Infinity }}>
                      {faceDetected ? `✓ وجه مكتشف ${confidence}%` : "لا يوجد وجه — قرّب وجهك للكاميرا"}
                    </motion.div>
                  </div>
                </div>

                {/* Instruction */}
                <p className="text-center text-sm text-white/60 font-medium mt-8 mb-4">{cur.instruction}</p>

                {/* Capture button */}
                <motion.button
                  onClick={handleCapture}
                  disabled={!faceDetected || phase === "capturing"}
                  data-testid="btn-face-capture"
                  className={`w-full h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                    faceDetected && phase === "scanning"
                      ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_30px_rgba(34,211,238,0.35)]"
                      : "bg-white/5 text-white/20 cursor-not-allowed border border-white/10"
                  }`}
                  whileHover={faceDetected ? { scale: 1.02 } : {}}
                  whileTap={faceDetected ? { scale: 0.98 } : {}}
                >
                  {phase === "capturing" ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />جاري الالتقاط...</>
                  ) : (
                    <><Camera className="w-5 h-5" />
                      {mode === "register"
                        ? `التقاط — ${cur.label} (${angleIdx + 1}/${ANGLES.length})`
                        : "تحقق بالوجه"
                      }
                    </>
                  )}
                </motion.button>

                {/* Skip */}
                {showSkip && mode === "register" && (
                  <button onClick={onSkip}
                    className="w-full mt-3 text-xs text-white/25 hover:text-white/50 transition-colors flex items-center justify-center gap-1.5 py-2">
                    <SkipForward className="w-3.5 h-3.5" />تخطي — أضيفها لاحقاً
                  </button>
                )}
              </motion.div>
            )}

            {/* ── Processing ── */}
            {phase === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="py-14 flex flex-col items-center gap-5">
                <div className="relative">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="absolute inset-0 rounded-full border border-cyan-400/30"
                      animate={{ scale: [1, 1.6, 2.2], opacity: [0.35, 0.1, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.45 }}
                    />
                  ))}
                  <motion.div className="w-20 h-20 rounded-full border-2 border-cyan-400 border-t-transparent flex items-center justify-center"
                    animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}>
                    <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  </motion.div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{mode === "register" ? "حفظ البصمة البيومترية..." : "مطابقة البصمة..."}</p>
                  <p className="text-xs text-white/40 mt-1">{mode === "register" ? "يتم تشفير ملامحك وحفظها بأمان" : "جارٍ البحث في قاعدة البيانات"}</p>
                </div>
              </motion.div>
            )}

            {/* ── Success ── */}
            {phase === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="py-14 flex flex-col items-center gap-4">
                <div className="relative">
                  {[0, 1, 2, 3].map(i => (
                    <motion.div key={i} className="absolute inset-0 rounded-full border border-emerald-400/35"
                      initial={{ scale: 1, opacity: 0.4 }}
                      animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
                      transition={{ duration: 1.1, delay: i * 0.14 }}
                    />
                  ))}
                  <motion.div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center"
                    animate={{ scale: [0.9, 1.05, 1] }} transition={{ type: "spring", stiffness: 200 }}>
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  </motion.div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-black text-white">{mode === "register" ? "تم تسجيل البصمة! 🎉" : "تم التعرف ✓"}</h3>
                  <p className="text-xs text-white/50 mt-1">{mode === "register" ? "وجهك محفوظ بأمان في حسابك" : "جاري تسجيل الدخول..."}</p>
                </div>
              </motion.div>
            )}

            {/* ── Error ── */}
            {phase === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="py-12 flex flex-col items-center gap-5">
                <motion.div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center"
                  animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.2, repeat: Infinity }}>
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-bold text-red-400 mb-1">حدث خطأ</p>
                  <p className="text-xs text-white/40 leading-relaxed max-w-[230px] mx-auto">{errorMsg}</p>
                </div>
                <div className="flex gap-2">
                  <motion.button onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <RotateCcw className="w-3.5 h-3.5" />إعادة المحاولة
                  </motion.button>
                  {showSkip && mode === "register" ? (
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

        {/* Close btn — auth mode */}
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
