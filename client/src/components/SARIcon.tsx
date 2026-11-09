interface SARIconProps {
  className?: string;
  size?: number;
}

export default function SARIcon({ className = "", size = 14 }: SARIconProps) {
  return (
    <span
      aria-label="ريال سعودي"
      role="img"
      className={`inline-block flex-shrink-0 fill-current ${className}`}
      style={{
        width: size,
        height: size,
        verticalAlign: "middle",
        backgroundColor: "currentColor",
        WebkitMaskImage: 'url("/sar.png")',
        maskImage: 'url("/sar.png")',
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
