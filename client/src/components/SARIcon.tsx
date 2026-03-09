interface SARIconProps {
  className?: string;
  size?: number;
}

export default function SARIcon({ className = "", size = 14 }: SARIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center font-bold flex-shrink-0 leading-none ${className}`}
      style={{ fontSize: size, lineHeight: 1, verticalAlign: "middle" }}
      aria-label="ريال سعودي"
    >
      ﷼
    </span>
  );
}
