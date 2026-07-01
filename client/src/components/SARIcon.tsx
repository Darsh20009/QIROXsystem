import sarImg from "@assets/Screenshot_2026-06-21_at_9.07.09_PM_1782594492809.png";

interface SARIconProps {
  className?: string;
  size?: number;
}

export default function SARIcon({ className = "", size = 14 }: SARIconProps) {
  return (
    <img
      src={sarImg}
      alt="ريال سعودي"
      aria-label="ريال سعودي"
      className={`inline-block flex-shrink-0 dark:invert ${className}`}
      style={{ width: size, height: size, verticalAlign: "middle", objectFit: "contain" }}
    />
  );
}
