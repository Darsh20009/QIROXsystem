import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-auth";
import { QiroxIcon } from "./qirox-brand";

export function Logo({ 
  className, 
  variant = "horizontal", 
  mode = "light" 
}: { 
  className?: string; 
  variant?: "horizontal" | "square" | "icon";
  mode?: "light" | "dark" | "monochrome";
}) {
  const { data: user } = useUser();
  const isDark = mode === "dark";
  const isMono = mode === "monochrome";
  
  if (user?.logoUrl) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <img src={user.logoUrl} alt="Logo" className={cn(variant === "icon" ? "w-12 h-12" : "w-8 h-8", "object-contain")} />
        {variant !== "icon" && (
          <span className={cn(
            "font-heading font-extrabold tracking-tighter text-xl",
            isDark ? "text-slate-50" : "text-slate-900",
            isMono && "text-current"
          )}>
            QIROX
          </span>
        )}
      </div>
    );
  }

  const primaryColor = isMono ? "currentColor" : (isDark ? "#f8fafc" : "#0f172a");
  const accentColor = isMono ? "currentColor" : "#06b6d4";

  const Icon = () => (
    <div className="relative">
      <QiroxIcon className={cn(variant === "icon" ? "w-12 h-12" : "w-8 h-8", className)} />
    </div>
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
