import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface DashboardVideoBgProps {
  opacity?: number;
  blur?: number;
  overlay?: "dark" | "light" | "none";
  particles?: boolean;
}

export default function DashboardVideoBg({
  opacity = 0.13,
  blur = 0,
  overlay = "dark",
  particles = true,
}: DashboardVideoBgProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.play().catch(() => {});
  }, []);

  const overlayClass =
    overlay === "dark"
      ? "bg-gradient-to-b from-[#f8f8f8]/80 via-[#f8f8f8]/60 to-[#f8f8f8]/80 dark:from-gray-950/85 dark:via-gray-950/70 dark:to-gray-950/85"
      : overlay === "light"
      ? "bg-gradient-to-b from-white/80 via-white/60 to-white/80"
      : "";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Video layer */}
      <video
        ref={videoRef}
        src="/dashboard-bg.mov"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          transform: "scale(1.04)",
        }}
        muted
        loop
        playsInline
        autoPlay
      />

      {/* Gradient overlay to keep text readable */}
      {overlay !== "none" && (
        <div className={`absolute inset-0 ${overlayClass}`} />
      )}

      {/* Radial glow spots */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-black/[0.02] dark:bg-white/[0.03] rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-black/[0.02] dark:bg-white/[0.03] rounded-full blur-3xl" />

      {/* Animated shimmer particles */}
      {particles && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-black/[0.025] dark:bg-white/[0.035]"
              style={{
                width: `${60 + i * 30}px`,
                height: `${60 + i * 30}px`,
                left: `${8 + i * 15}%`,
                top: `${10 + i * 12}%`,
              }}
              animate={{
                y: [0, -18, 0],
                opacity: [0.4, 0.9, 0.4],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 4 + i * 0.7,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Subtle scanline effect */}
      <div
        className="absolute inset-0 opacity-[0.018] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 3px)",
        }}
      />
    </div>
  );
}
