import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, X, Music } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function GlobalMusicPlayer() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.25;
    audio.loop = true;

    const tryPlay = () => {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    };

    const onInteraction = () => {
      tryPlay();
      document.removeEventListener("click", onInteraction);
      document.removeEventListener("keydown", onInteraction);
      document.removeEventListener("touchstart", onInteraction);
    };

    tryPlay();

    document.addEventListener("click", onInteraction, { once: true });
    document.addEventListener("keydown", onInteraction, { once: true });
    document.addEventListener("touchstart", onInteraction, { once: true });

    return () => {
      document.removeEventListener("click", onInteraction);
      document.removeEventListener("keydown", onInteraction);
      document.removeEventListener("touchstart", onInteraction);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  };

  const close = () => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); }
    setPlaying(false);
    setVisible(false);
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <>
      <audio ref={audioRef} src="/posters/qirox-music.mp3" preload="auto" />
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-black/85 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl shadow-black/40"
            dir={ar ? "rtl" : "ltr"}
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
              <motion.div
                animate={playing ? { rotate: [0, 360] } : { rotate: 0 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Music className="w-4 h-4 text-purple-300" />
              </motion.div>
            </div>

            <div className="min-w-0">
              <p className="text-white text-[11px] font-semibold leading-tight truncate max-w-[110px]">
                Cairo Rooftop Rain
              </p>
              <p className="text-white/40 text-[9px] leading-tight">Oud Tarab LoFi</p>
            </div>

            <button
              onClick={toggle}
              data-testid="btn-toggle-music"
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={toggleMute}
              data-testid="btn-toggle-mute"
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={close}
              data-testid="btn-close-music"
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/40 hover:text-white transition-colors shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
