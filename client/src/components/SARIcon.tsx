interface SARIconProps {
  className?: string;
  size?: number;
}

export default function SARIcon({ className = "", size = 14 }: SARIconProps) {
  return (
    <img
      src="/sar.png"
      alt="ر.س"
      width={size}
      height={size}
      className={`inline-block object-contain dark:invert ${className}`}
      style={{ verticalAlign: "middle" }}
    />
  );
}
