// ── FilesSection ──────────────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. Fully implemented with live data.
// Behind FEATURE_DASHBOARD_V2. Existing /dashboard untouched.

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, FileText, Image, File, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../../components/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";

interface FilesSectionProps {
  lang?: "ar" | "en";
}

function fileIcon(name: string) {
  if (!name) return File;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return Image;
  if (["pdf", "doc", "docx", "txt"].includes(ext)) return FileText;
  return File;
}

function fileSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesSection({ lang = "ar" }: FilesSectionProps) {
  const isAr = lang === "ar";

  const { data: dash, isLoading } = useQuery<any>({
    queryKey: ["/api/v2/client/dashboard"],
    queryFn: async () => {
      const r = await fetch("/api/v2/client/dashboard");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 60_000,
  });

  const files = (dash?.files ?? []).slice(0, 6);

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-black dark:text-white">
          {isAr ? "الملفات" : "Files"}
        </h3>
        {!isLoading && files.length > 0 && (
          <span className="text-[10px] font-bold bg-black/[0.06] dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
            {files.length}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <EmptyState
            icon="📁"
            titleAr="لا توجد ملفات بعد"
            titleEn="No Files Yet"
            subtitleAr="سيتم رفع ملفات مشروعك هنا"
            subtitleEn="Your project files will be uploaded here"
            lang={lang}
          />
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04] bg-white dark:bg-gray-900">
            {files.map((file: any, i: number) => {
              const Icon = fileIcon(file.name || file.filename || "");
              const ts = file.createdAt ? new Date(file.createdAt) : null;
              const timeAgo = ts
                ? formatDistanceToNow(ts, { addSuffix: true, locale: isAr ? arLocale : enUS })
                : "";
              const size = fileSize(file.size || 0);
              return (
                <motion.div
                  key={file.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-black dark:text-white truncate">
                      {file.name || file.filename || (isAr ? "ملف" : "File")}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {[size, timeAgo].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-black dark:hover:text-white transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
