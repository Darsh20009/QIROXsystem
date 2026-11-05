import { renderAvatarSVG, DEFAULT_AVATAR, type AvatarConfig } from "@/components/AvatarBuilder";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 20, sm: 28, md: 40, lg: 56, xl: 80, "2xl": 112,
};

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "w-5 h-5 text-[10px]",
  sm: "w-7 h-7 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
  "2xl": "w-28 h-28 text-3xl",
};

const ROLE_GRADIENTS: Record<string, string> = {
  admin:   "from-gray-800 to-gray-950",
  manager: "from-slate-600 to-slate-900",
  developer: "from-violet-600 to-indigo-700",
  designer: "from-pink-500 to-rose-600",
  support: "from-sky-500 to-cyan-600",
  sales:   "from-amber-500 to-orange-600",
  accountant: "from-emerald-500 to-teal-600",
  investor: "from-yellow-500 to-amber-700",
  client:  "from-blue-500 to-cyan-600",
  customer:"from-blue-400 to-indigo-600",
  default: "from-indigo-500 to-purple-600",
};

interface UserAvatarProps {
  profilePhotoUrl?: string;
  avatarConfig?: string;
  name?: string;
  role?: string;
  size?: AvatarSize;
  className?: string;
  showRing?: boolean;
}

export function UserAvatar({
  profilePhotoUrl,
  avatarConfig,
  name,
  role,
  size = "md",
  className = "",
  showRing = false,
}: UserAvatarProps) {
  const px = SIZE_PX[size];
  const sizeClass = SIZE_CLASS[size];
  const ring = showRing ? "ring-2 ring-offset-1 ring-violet-400/60" : "";
  const baseClass = `rounded-full overflow-hidden flex-shrink-0 ${sizeClass} ${ring} ${className}`;

  if (profilePhotoUrl && profilePhotoUrl.length > 10) {
    return (
      <div className={baseClass} style={{ width: px, height: px }}>
        <img
          src={profilePhotoUrl}
          alt={name ?? "user"}
          className="w-full h-full object-cover"
          style={{ display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
    );
  }

  if (avatarConfig) {
    try {
      const cfg: AvatarConfig = JSON.parse(avatarConfig);
      const svgStr = renderAvatarSVG(cfg, px);
      return (
        <div
          className={baseClass}
          style={{ width: px, height: px }}
          dangerouslySetInnerHTML={{ __html: svgStr }}
        />
      );
    } catch {
    }
  }

  const gradient = ROLE_GRADIENTS[role ?? ""] ?? ROLE_GRADIENTS.default;
  const initial = (name ?? "?").charAt(0).toUpperCase();

  return (
    <div
      className={`${baseClass} bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white select-none`}
      style={{ width: px, height: px }}
    >
      {initial}
    </div>
  );
}
