import { cn } from "@/lib/utils";

export function Logo({ 
  className, 
  variant = "horizontal", 
  mode = "light" 
}: { 
  className?: string; 
  variant?: "horizontal" | "square" | "icon";
  mode?: "light" | "dark" | "monochrome";
}) {
  const isDark = mode === "dark";
  const isMono = mode === "monochrome";
  
  const primaryColor = isMono ? "currentColor" : (isDark ? "#f8fafc" : "#0f172a");
  const accentColor = isMono ? "currentColor" : "#06b6d4";

  const Icon = () => (
    <svg 
      viewBox="0 0 100 100" 
      className={cn(variant === "icon" ? "w-12 h-12" : "w-8 h-8", className)}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Q Circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="35" 
        stroke={primaryColor} 
        strokeWidth="8" 
        className="opacity-90"
      />
      {/* Connection Node 1 */}
      <circle cx="85" cy="50" r="6" fill={accentColor} />
      {/* Connection Node 2 */}
      <circle cx="50" cy="15" r="4" fill={accentColor} className="opacity-60" />
      {/* Q Tail / Link */}
      <path 
        d="M75 75L85 85" 
        stroke={primaryColor} 
        strokeWidth="8" 
        strokeLinecap="round" 
      />
      {/* Inner Node */}
      <circle cx="50" cy="50" r="12" stroke={accentColor} strokeWidth="2" strokeDasharray="4 2" />
    </svg>
  );

  if (variant === "icon") return <Icon />;

  return (
    <div className={cn("flex items-center gap-3", variant === "square" && "flex-col text-center", className)}>
      <Icon />
      {(variant === "horizontal" || variant === "square") && (
        <div className="flex flex-col items-start justify-center leading-tight">
          <span className={cn(
            "font-heading font-extrabold tracking-tighter text-xl",
            isDark ? "text-slate-50" : "text-slate-900",
            isMono && "text-current"
          )}>
            QIROX
          </span>
          <span className={cn(
            "text-[10px] font-medium tracking-[0.2em] uppercase opacity-70",
            isDark ? "text-cyan-400" : "text-cyan-600",
            isMono && "text-current"
          )}>
            Tech Solutions
          </span>
        </div>
      )}
    </div>
  );
}
