type QiroxLoadingScreenProps = {
  compact?: boolean;
};

export default function QiroxLoadingScreen({ compact = false }: QiroxLoadingScreenProps) {
  const size = compact ? "h-12 w-12" : "h-16 w-16";
  const ringSize = compact ? "-inset-3" : "-inset-4";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-gray-950"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className={`relative ${size} flex items-center justify-center`}>
        <span
          className={`absolute ${ringSize} rounded-full border-[3px] border-black/[0.08] border-t-black/80 dark:border-white/[0.12] dark:border-t-white/85 animate-spin`}
          style={{ animationDuration: "1.35s" }}
          aria-hidden="true"
        />
        <span
          className={`absolute ${compact ? "-inset-1.5" : "-inset-2"} rounded-full border border-black/[0.06] dark:border-white/[0.08]`}
          aria-hidden="true"
        />
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-white dark:bg-gray-950">
          <img
            src="/qirox-icon-nobg.png"
            alt="QIROX"
            className={`${compact ? "h-7" : "h-9"} w-auto object-contain`}
          />
        </div>
      </div>
    </div>
  );
}