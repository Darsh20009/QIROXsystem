import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shuffle } from "lucide-react";

export interface AvatarConfig {
  bg: number;
  skin: number;
  hair: number;
  hairColor: number;
  eyes: number;
  brows: number;
  mouth: number;
  acc: number;
  faceShape: number;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  bg: 0, skin: 2, hair: 0, hairColor: 0,
  eyes: 0, brows: 0, mouth: 0, acc: 0, faceShape: 0,
};

const BG_GRADIENTS = [
  ["#667eea","#764ba2"],["#f093fb","#f5576c"],["#4facfe","#00f2fe"],
  ["#43e97b","#38f9d7"],["#fa709a","#fee140"],["#30cfd0","#330867"],
  ["#a18cd1","#fbc2eb"],["#ffecd2","#fcb69f"],["#ff9a9e","#fecfef"],
  ["#a1c4fd","#c2e9fb"],
];

const SKIN_COLORS = [
  "#FFDBB4","#F1C27D","#E0AC69","#C68642","#8D5524","#FFCBA4",
];

const HAIR_COLORS = [
  "#1a1a1a","#4a3728","#8B5E3C","#C4A35A","#D4A017","#E8E0CC","#A0522D","#FF4757",
];

export function renderAvatarSVG(cfg: AvatarConfig, size = 100): string {
  const s = cfg.skin ?? 2;
  const skinColor = SKIN_COLORS[s] ?? SKIN_COLORS[2];
  const hairCol = HAIR_COLORS[cfg.hairColor ?? 0] ?? "#1a1a1a";
  const bg1 = BG_GRADIENTS[cfg.bg ?? 0]?.[0] ?? "#667eea";
  const bg2 = BG_GRADIENTS[cfg.bg ?? 0]?.[1] ?? "#764ba2";
  const faceW = cfg.faceShape === 1 ? 44 : cfg.faceShape === 2 ? 46 : 42;
  const faceH = cfg.faceShape === 1 ? 52 : cfg.faceShape === 2 ? 44 : 50;

  const hairPaths: Record<number, string> = {
    0: `<ellipse cx="50" cy="28" rx="${faceW * 0.98}" ry="20" fill="${hairCol}"/>`,
    1: `<path d="M ${50 - faceW} 30 Q 50 ${10} ${50 + faceW} 30 Q ${50 + faceW + 5} 22 50 14 Q ${50 - faceW - 5} 22 ${50 - faceW} 30Z" fill="${hairCol}"/>`,
    2: `<ellipse cx="50" cy="26" rx="${faceW * 1.05}" ry="22" fill="${hairCol}"/><rect x="${50 - faceW}" y="24" width="8" height="28" rx="4" fill="${hairCol}"/><rect x="${50 + faceW - 8}" y="24" width="8" height="28" rx="4" fill="${hairCol}"/>`,
    3: `<path d="M ${50 - faceW * 0.9} 32 Q 50 8 ${50 + faceW * 0.9} 32" stroke="${hairCol}" stroke-width="12" fill="none" stroke-linecap="round"/>`,
    4: `<ellipse cx="50" cy="24" rx="${faceW * 0.85}" ry="16" fill="${hairCol}"/><ellipse cx="${50 - faceW * 0.6}" cy="34" rx="8" ry="14" fill="${hairCol}"/><ellipse cx="${50 + faceW * 0.6}" cy="34" rx="8" ry="14" fill="${hairCol}"/>`,
    5: `<ellipse cx="50" cy="30" rx="${faceW}" ry="14" fill="${hairCol}" opacity="0.9"/><line x1="${50 - faceW + 4}" y1="44" x2="${50 - faceW - 2}" y2="72" stroke="${hairCol}" stroke-width="5" stroke-linecap="round"/><line x1="${50 - faceW * 0.4}" y1="44" x2="${50 - faceW * 0.4 - 3}" y2="74" stroke="${hairCol}" stroke-width="5" stroke-linecap="round"/>`,
    6: `<path d="M ${50 - faceW + 4} 36 Q ${50 - faceW * 0.5} 10 50 18 Q ${50 + faceW * 0.5} 10 ${50 + faceW - 4} 36" fill="${hairCol}"/>`,
    7: ``,
  };

  const eyesMap: Record<number, string> = {
    0: `<circle cx="${50 - 13}" cy="52" r="4" fill="#1a1a1a"/><circle cx="${50 + 13}" cy="52" r="4" fill="#1a1a1a"/><circle cx="${50 - 11}" cy="50" r="1.5" fill="white"/><circle cx="${50 + 15}" cy="50" r="1.5" fill="white"/>`,
    1: `<ellipse cx="${50 - 13}" cy="52" rx="5" ry="4" fill="#1a1a1a"/><ellipse cx="${50 + 13}" cy="52" rx="5" ry="4" fill="#1a1a1a"/><circle cx="${50 - 11}" cy="50" r="1.5" fill="white"/><circle cx="${50 + 15}" cy="50" r="1.5" fill="white"/>`,
    2: `<path d="M ${50 - 18} 54 Q ${50 - 13} 47 ${50 - 8} 54" stroke="#1a1a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M ${50 + 8} 54 Q ${50 + 13} 47 ${50 + 18} 54" stroke="#1a1a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    3: `<circle cx="${50 - 13}" cy="52" r="5" fill="#4a90e2"/><circle cx="${50 + 13}" cy="52" r="5" fill="#4a90e2"/><circle cx="${50 - 13}" cy="52" r="3" fill="#1a1a1a"/><circle cx="${50 + 13}" cy="52" r="3" fill="#1a1a1a"/><circle cx="${50 - 11}" cy="50" r="1.5" fill="white"/><circle cx="${50 + 15}" cy="50" r="1.5" fill="white"/>`,
    4: `<path d="M ${50 - 18} 52 L ${50 - 8} 52" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/><path d="M ${50 + 8} 52 L ${50 + 18} 52" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`,
    5: `<path d="M ${50 - 18} 54 Q ${50 - 13} 49 ${50 - 8} 54" fill="#1a1a1a"/><path d="M ${50 + 8} 54 Q ${50 + 13} 49 ${50 + 18} 54" fill="#1a1a1a"/>`,
  };

  const browsMap: Record<number, string> = {
    0: `<path d="M ${50 - 18} 44 Q ${50 - 13} 41 ${50 - 8} 44" stroke="#4a3728" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M ${50 + 8} 44 Q ${50 + 13} 41 ${50 + 18} 44" stroke="#4a3728" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    1: `<path d="M ${50 - 19} 43 Q ${50 - 13} 40 ${50 - 8} 43" stroke="#1a1a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M ${50 + 8} 43 Q ${50 + 13} 40 ${50 + 19} 43" stroke="#1a1a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    2: `<path d="M ${50 - 19} 44 L ${50 - 8} 41" stroke="#4a3728" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M ${50 + 8} 41 L ${50 + 19} 44" stroke="#4a3728" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    3: ``,
  };

  const mouthMap: Record<number, string> = {
    0: `<path d="M ${50 - 10} 68 Q 50 76 ${50 + 10} 68" stroke="#c0392b" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    1: `<path d="M ${50 - 12} 67 Q 50 78 ${50 + 12} 67" fill="#c0392b" stroke="#c0392b" stroke-width="1.5"/>`,
    2: `<path d="M ${50 - 10} 70 Q 50 65 ${50 + 10} 70" stroke="#c0392b" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    3: `<line x1="${50 - 9}" y1="68" x2="${50 + 9}" y2="68" stroke="#c0392b" stroke-width="2.5" stroke-linecap="round"/>`,
    4: `<path d="M ${50 - 12} 66 Q ${50 - 6} 78 50 78 Q ${50 + 6} 78 ${50 + 12} 66" fill="#c0392b"/><path d="M ${50 - 12} 66 Q 50 72 ${50 + 12} 66" fill="white"/>`,
    5: `<path d="M ${50 - 10} 66 Q ${50 - 4} 74 50 74 Q ${50 + 4} 74 ${50 + 10} 66" fill="#c0392b"/><path d="M ${50 - 12} 65 Q 50 70 ${50 + 12} 65" stroke="#c0392b" stroke-width="2" fill="none"/><path d="M ${50 - 6} 74 Q 50 80 ${50 + 6} 74" stroke="#e74c3c" stroke-width="1.5" fill="none"/>`,
    6: `<circle cx="50" cy="69" r="1.5" fill="#c0392b"/><path d="M ${50 - 12} 67 Q 50 79 ${50 + 12} 67" fill="#ff6b6b" stroke="#c0392b" stroke-width="1"/>`,
    7: `<path d="M ${50 - 8} 68 Q 50 73 ${50 + 8} 68" stroke="#c0392b" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="${50 - 8}" cy="67.5" r="1.5" fill="#ff9999"/><circle cx="${50 + 8}" cy="67.5" r="1.5" fill="#ff9999"/>`,
  };

  const accMap: Record<number, string> = {
    0: ``,
    1: `<ellipse cx="${50 - 13}" cy="52" rx="9" ry="7" fill="none" stroke="#555" stroke-width="2.5"/><ellipse cx="${50 + 13}" cy="52" rx="9" ry="7" fill="none" stroke="#555" stroke-width="2.5"/><line x1="${50 - 4}" y1="52" x2="${50 + 4}" y2="52" stroke="#555" stroke-width="2"/>`,
    2: `<rect x="${50 - faceW}" y="24" width="${faceW * 2}" height="14" rx="5" fill="${hairCol}"/>`,
    3: `<path d="M ${50 - 8} 74 Q 50 82 ${50 + 8} 74 Q ${50 + 8} 78 ${50 + 4} 80 Q 50 84 ${50 - 4} 80 Q ${50 - 8} 78 ${50 - 8} 74Z" fill="#c0392b" opacity="0.7"/>`,
    4: `<ellipse cx="${50 - 13}" cy="52" rx="9" ry="7" fill="rgba(100,180,255,0.3)" stroke="#89c4f4" stroke-width="2.5"/><ellipse cx="${50 + 13}" cy="52" rx="9" ry="7" fill="rgba(100,180,255,0.3)" stroke="#89c4f4" stroke-width="2.5"/><line x1="${50 - 4}" y1="52" x2="${50 + 4}" y2="52" stroke="#89c4f4" stroke-width="2"/>`,
  };

  const cheeks = `<circle cx="${50 - faceW * 0.55}" cy="60" r="8" fill="#ffb6c1" opacity="0.45"/><circle cx="${50 + faceW * 0.55}" cy="60" r="8" fill="#ffb6c1" opacity="0.45"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <clipPath id="circle-clip">
      <circle cx="50" cy="50" r="50"/>
    </clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#bg)"/>
  <g clip-path="url(#circle-clip)">
    ${hairPaths[cfg.hair ?? 0] ?? ""}
    <ellipse cx="50" cy="52" rx="${faceW}" ry="${faceH}" fill="${skinColor}"/>
    ${cheeks}
    ${eyesMap[cfg.eyes ?? 0] ?? ""}
    ${browsMap[cfg.brows ?? 0] ?? ""}
    ${mouthMap[cfg.mouth ?? 0] ?? ""}
    ${accMap[cfg.acc ?? 0] ?? ""}
  </g>
</svg>`;
}

const FACE_SHAPES = ["بيضاوي","طويل","مربع"];
const SKIN_LABELS = ["فاتح جداً","فاتح","قمحي","بني فاتح","بني","وردي"];
const HAIR_STYLE_LABELS = ["كلاسيك","ويف","طويل جانبي","مقوس","كيرلي","قصير جانبي","ريح","أصلع"];
const HAIR_COLOR_LABELS = ["أسود","بني داكن","بني","ذهبي","أشقر داكن","رمادي","كستنائي","أحمر"];
const EYES_LABELS = ["عادي","كبير","نصف مغلق","ملوّن","هادئ","حاد"];
const BROWS_LABELS = ["عادي","سميك","مرفوع","بدون"];
const MOUTH_LABELS = ["ابتسامة","مفتوح","حزين","محايد","مبتهج","مضحك","بوسة","خجول"];
const ACC_LABELS = ["بدون","نظارة","قبعة","شارب","نظارة زرقاء"];

const CATEGORIES = [
  { key: "bg" as keyof AvatarConfig, label: "الخلفية", count: BG_GRADIENTS.length, type: "gradient" },
  { key: "faceShape" as keyof AvatarConfig, label: "الوجه", count: FACE_SHAPES.length, type: "labels", labels: FACE_SHAPES },
  { key: "skin" as keyof AvatarConfig, label: "البشرة", count: SKIN_COLORS.length, type: "color", colors: SKIN_COLORS },
  { key: "hair" as keyof AvatarConfig, label: "الشعر", count: HAIR_STYLE_LABELS.length, type: "labels", labels: HAIR_STYLE_LABELS },
  { key: "hairColor" as keyof AvatarConfig, label: "لون الشعر", count: HAIR_COLORS.length, type: "color", colors: HAIR_COLORS },
  { key: "eyes" as keyof AvatarConfig, label: "العيون", count: EYES_LABELS.length, type: "labels", labels: EYES_LABELS },
  { key: "brows" as keyof AvatarConfig, label: "الحواجب", count: BROWS_LABELS.length, type: "labels", labels: BROWS_LABELS },
  { key: "mouth" as keyof AvatarConfig, label: "الفم", count: MOUTH_LABELS.length, type: "labels", labels: MOUTH_LABELS },
  { key: "acc" as keyof AvatarConfig, label: "إكسسوار", count: ACC_LABELS.length, type: "labels", labels: ACC_LABELS },
];

interface AvatarBuilderProps {
  config: AvatarConfig;
  onChange: (cfg: AvatarConfig) => void;
  onSave?: () => void;
  saving?: boolean;
}

export default function AvatarBuilder({ config, onChange, onSave, saving }: AvatarBuilderProps) {
  const [activeTab, setActiveTab] = useState(0);

  const randomize = () => {
    const rand = (max: number) => Math.floor(Math.random() * max);
    onChange({
      bg: rand(BG_GRADIENTS.length),
      skin: rand(SKIN_COLORS.length),
      hair: rand(HAIR_STYLE_LABELS.length),
      hairColor: rand(HAIR_COLORS.length),
      eyes: rand(EYES_LABELS.length),
      brows: rand(BROWS_LABELS.length),
      mouth: rand(MOUTH_LABELS.length),
      acc: rand(ACC_LABELS.length),
      faceShape: rand(FACE_SHAPES.length),
    });
  };

  const cat = CATEGORIES[activeTab];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          key={JSON.stringify(config)}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-32 h-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/30 dark:ring-white/10"
          dangerouslySetInnerHTML={{ __html: renderAvatarSVG(config, 128) }}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={randomize}
            className="gap-1.5 text-xs border-black/10 dark:border-white/10 dark:text-white"
            data-testid="btn-randomize-avatar"
          >
            <Shuffle className="w-3.5 h-3.5" />
            عشوائي
          </Button>
          {onSave && (
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving}
              className="gap-1.5 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-none"
              data-testid="btn-save-avatar"
            >
              {saving ? <span className="animate-spin">⏳</span> : <Check className="w-3.5 h-3.5" />}
              حفظ الأفاتار
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((c, i) => (
          <button
            key={c.key}
            onClick={() => setActiveTab(i)}
            data-testid={`tab-avatar-${c.key}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === activeTab
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg scale-105"
                : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="grid gap-2"
          style={{ gridTemplateColumns: cat.type === "labels" ? "repeat(auto-fill, minmax(90px, 1fr))" : "repeat(auto-fill, minmax(42px, 1fr))" }}
        >
          {cat.type === "gradient" && BG_GRADIENTS.map((g, i) => (
            <button
              key={i}
              onClick={() => onChange({ ...config, [cat.key]: i })}
              data-testid={`avatar-option-${cat.key}-${i}`}
              className={`h-10 rounded-xl transition-all ${config[cat.key] === i ? "ring-3 ring-offset-2 ring-violet-500 scale-110 shadow-lg" : "hover:scale-105"}`}
              style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}
            />
          ))}

          {cat.type === "color" && (cat.colors ?? []).map((col, i) => (
            <button
              key={i}
              onClick={() => onChange({ ...config, [cat.key]: i })}
              data-testid={`avatar-option-${cat.key}-${i}`}
              className={`h-10 w-10 rounded-full transition-all border-2 ${config[cat.key] === i ? "ring-3 ring-offset-2 ring-violet-500 scale-110 shadow-lg border-white" : "border-transparent hover:scale-105"}`}
              style={{ background: col }}
            />
          ))}

          {cat.type === "labels" && (cat.labels ?? []).map((label, i) => (
            <button
              key={i}
              onClick={() => onChange({ ...config, [cat.key]: i })}
              data-testid={`avatar-option-${cat.key}-${i}`}
              className={`py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                config[cat.key] === i
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md scale-105"
                  : "bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
