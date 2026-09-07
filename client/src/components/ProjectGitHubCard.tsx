import { ExternalLink, Github, LockKeyhole, Globe2, CircleCheck, Clock3, CircleAlert } from "lucide-react";

type ProjectGitHubCardProps = {
  project: any;
  lang: "ar" | "en";
  compact?: boolean;
};

export default function ProjectGitHubCard({ project, lang, compact = false }: ProjectGitHubCardProps) {
  const L = lang === "ar";
  const status = project?.githubProvisioningStatus || "not_configured";
  const repoUrl = project?.repoUrl || project?.githubRepoUrl;
  const isReady = status === "ready" && !!repoUrl;
  const isFailed = status === "failed";
  const visibility = project?.githubVisibility === "public" ? "public" : "private";

  return (
    <div className={`rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-gray-900 ${compact ? "p-3" : "p-4"}`} data-testid={`project-github-card-${project?.id || "unknown"}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center shrink-0">
          <Github className="w-5 h-5 text-black dark:text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-sm text-black dark:text-white">{L ? "مستودع GitHub" : "GitHub repository"}</p>
            {isReady ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                <CircleCheck className="w-3.5 h-3.5" /> {L ? "جاهز" : "Ready"}
              </span>
            ) : isFailed ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-400">
                <CircleAlert className="w-3.5 h-3.5" /> {L ? "تعذّر التجهيز" : "Setup failed"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-black/45 dark:text-white/45">
                <Clock3 className="w-3.5 h-3.5" /> {L ? "قيد التجهيز" : "Preparing"}
              </span>
            )}
          </div>
          {isReady ? (
            <>
              <p className="font-mono text-xs text-black/60 dark:text-white/60 truncate mt-1" dir="ltr">
                {project.githubRepoOwner}/{project.githubRepoName}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-black/45 dark:text-white/45">
                <span className="inline-flex items-center gap-1">
                  {visibility === "public" ? <Globe2 className="w-3 h-3" /> : <LockKeyhole className="w-3 h-3" />}
                  {visibility === "public" ? (L ? "عام" : "Public") : (L ? "خاص" : "Private")}
                </span>
                <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-black dark:text-white hover:underline font-bold" dir="ltr">
                  {L ? "فتح المستودع" : "Open repository"} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          ) : (
            <p className="text-xs text-black/50 dark:text-white/50 mt-1">
              {isFailed
                ? (L ? "سيحاول الفريق التجهيز مرة أخرى." : "The team will retry the repository setup.")
                : (L ? "سيظهر الرابط هنا بعد اكتمال تجهيز المشروع." : "The repository link will appear here once setup is complete.")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}