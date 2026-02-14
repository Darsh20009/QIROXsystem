import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [text, setText] = useState("");
  const fullText = "QIROX";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, i + 1));
      i++;
      if (i === fullText.length) {
        clearInterval(timer);
        setTimeout(onComplete, 1000);
      }
    }, 150);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 font-['Montserrat']">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-7xl md:text-9xl font-bold tracking-[6px] text-slate-100 relative"
      >
        {text}
        <motion.span
          className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-cyan-400 to-transparent"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-xl md:text-2xl text-slate-400 tracking-wider font-light"
      >
        Build systems. Stay human.
      </motion.div>
    </div>
  );
}

export function QiroxLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`font-['Montserrat'] font-bold tracking-wider relative inline-block ${className}`}>
      <span className="relative">
        QIROX
        <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400 to-transparent" />
      </span>
    </div>
  );
}

export function QiroxIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <rect x="20" y="20" width="60" height="60" rx="4" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="50" r="15" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
      <path d="M50 35V65M35 50H65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
