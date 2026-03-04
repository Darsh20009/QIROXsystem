import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", resize);

    const STAR_COUNT = 160;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.3,
      speed: Math.random() * 0.4 + 0.1,
      alpha: Math.random() * 0.7 + 0.3,
      flicker: Math.random() * 0.03 + 0.005,
      flickerDir: Math.random() > 0.5 ? 1 : -1,
    }));

    const PARTICLE_COUNT = 40;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 3 + 1,
      hue: Math.random() * 60 + 180,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    let t = 0;

    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, W, H);

      // Deep space background
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.8);
      bg.addColorStop(0, "#0a0a1a");
      bg.addColorStop(0.5, "#050510");
      bg.addColorStop(1, "#020208");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Stars with flicker
      for (const s of stars) {
        s.alpha += s.flicker * s.flickerDir;
        if (s.alpha > 1 || s.alpha < 0.1) s.flickerDir *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y + Math.sin(t * s.speed + s.x) * 0.8, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${s.alpha})`;
        ctx.fill();
      }

      // Nebula glow blobs
      const blobs = [
        { x: W * 0.2, y: H * 0.3, r: W * 0.25, h: 240, a: 0.025 },
        { x: W * 0.8, y: H * 0.7, r: W * 0.3, h: 280, a: 0.02 },
        { x: W * 0.5, y: H * 0.5, r: W * 0.2, h: 200, a: 0.015 },
      ];
      for (const b of blobs) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `hsla(${b.h},80%,60%,${b.a})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},90%,70%,${p.alpha})`;
        ctx.fill();
      }

      // Shooting star occasionally
      const ss = Math.sin(t * 0.7) * 0.5 + 0.5;
      if (ss > 0.98) {
        const sx = W * 0.3 + Math.random() * W * 0.4;
        const sy = H * 0.1 + Math.random() * H * 0.2;
        const len = 120 + Math.random() * 80;
        const grad = ctx.createLinearGradient(sx, sy, sx + len, sy + len * 0.4);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.5, "rgba(180,220,255,0.7)");
        grad.addColorStop(1, "rgba(255,255,255,0.9)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + len, sy + len * 0.4);
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020208] flex items-center justify-center" dir="rtl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 text-center px-6 max-w-xl mx-auto select-none">
        {/* Glowing 404 */}
        <div className="relative mb-6">
          <div
            className="text-[clamp(100px,25vw,220px)] font-black leading-none tracking-tighter"
            style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 40%, #c084fc 70%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 40px rgba(99,102,241,0.6)) drop-shadow(0 0 80px rgba(56,189,248,0.3))",
              animation: "pulse404 3s ease-in-out infinite",
            }}
          >
            404
          </div>
          {/* Orbit ring */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ animation: "spin 8s linear infinite" }}
          >
            <div
              className="w-[clamp(200px,40vw,360px)] h-[clamp(200px,40vw,360px)] rounded-full border border-indigo-500/20"
              style={{ boxShadow: "0 0 20px rgba(99,102,241,0.1)" }}
            />
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ animation: "spinReverse 12s linear infinite" }}
          >
            <div className="w-[clamp(240px,48vw,430px)] h-[clamp(240px,48vw,430px)] rounded-full border border-cyan-500/10" />
          </div>
          {/* Orbit dot */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ animation: "orbit 8s linear infinite" }}
          >
            <div
              className="relative"
              style={{ transform: `translateX(clamp(100px,20vw,180px))` }}
            >
              <div className="w-3 h-3 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 12px #22d3ee, 0 0 24px #22d3ee" }} />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3 mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold text-white"
            style={{ textShadow: "0 0 30px rgba(99,102,241,0.5)" }}
          >
            عذراً! الصفحة ضائعة في الفضاء
          </h1>
          <p className="text-white/40 text-base leading-relaxed">
            يبدو أن هذه الصفحة انجرفت بعيداً في الكون.
            <br />
            لنعد إلى الأرض معاً.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 rounded-2xl font-bold text-white text-sm transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #6366f1, #38bdf8)",
              boxShadow: "0 0 30px rgba(99,102,241,0.4), 0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            🚀 العودة للرئيسية
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-8 py-3 rounded-2xl font-bold text-white/70 text-sm border border-white/10 hover:border-white/30 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)" }}
          >
            ← الصفحة السابقة
          </button>
        </div>

        {/* Error code badge */}
        <div className="mt-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10"
          style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-white/30 text-xs font-mono">HTTP_ERROR 404 · PAGE_NOT_FOUND</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse404 {
          0%, 100% { filter: drop-shadow(0 0 40px rgba(99,102,241,0.6)) drop-shadow(0 0 80px rgba(56,189,248,0.3)); }
          50% { filter: drop-shadow(0 0 60px rgba(99,102,241,0.9)) drop-shadow(0 0 120px rgba(56,189,248,0.5)); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinReverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
