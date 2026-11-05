interface SARIconProps {
  className?: string;
  size?: number;
}

export default function SARIcon({ className = "", size = 14 }: SARIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-label="ريال سعودي"
      className={`inline-block flex-shrink-0 fill-current ${className}`}
      style={{ width: size, height: size, verticalAlign: "middle" }}
    >
      {/* Saudi Riyal symbol — simplified geometric mark */}
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontSize="13"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
      >
        ﷼
      </text>
    </svg>
  );
}
