import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Download, Upload, GitBranch, GitCommit,
  FileWarning, CheckCircle, AlertCircle
} from "lucide-react";
import { SiGithub } from "react-icons/si";

interface GitHubPanelProps {
  projectId: string;
}

export function GitHubPanel({ projectId }: GitHubPanelProps) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importUrl, setImportUrl] = useState("");
  const [importPat, setImportPat] = useState("");
  const [importBranch, setImportBranch] = useState("main");
  const [pushPat, setPushPat] = useState("");
  const [pushRepo, setPushRepo] = useState("");
  const [pushBranch, setPushBranch] = useState("main");
  const [commitMsg, setCommitMsg] = useState("");

  const { data: gitStatus, isLoading: statusLoading } = useQuery<any>({
    queryKey: ["/api/sandbox/projects", projectId, "github", "status"],
    retry: false,
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/sandbox/projects/${projectId}/github/import`, {
        repoUrl: importUrl,
        pat: importPat || undefined,
        branch: importBranch,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "files"] });
      toast({ title: ar ? "تم استيراد المستودع" : "Repository imported" });
      setImportUrl("");
      setImportPat("");
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const pushMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/sandbox/projects/${projectId}/github/push`, {
        repoUrl: pushRepo || undefined,
        pat: pushPat || undefined,
        branch: pushBranch,
        commitMessage: commitMsg || "Update from QIROX Sandbox",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "github", "status"] });
      toast({ title: ar ? "تم الرفع بنجاح" : "Pushed successfully" });
      setCommitMsg("");
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col h-full p-3 gap-4 overflow-y-auto">
      <div className="flex items-center gap-2">
        <SiGithub className="w-4 h-4" />
        <span className="text-sm font-medium">GitHub</span>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">
          {ar ? "استيراد مستودع" : "Import Repository"}
        </h4>
        <Input
          placeholder="https://github.com/user/repo.git"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          className="h-7 text-xs font-mono"
          data-testid="input-import-url"
        />
        <Input
          placeholder={ar ? "Personal Access Token (اختياري)" : "PAT (optional)"}
          value={importPat}
          onChange={(e) => setImportPat(e.target.value)}
          type="password"
          className="h-7 text-xs"
          data-testid="input-import-pat"
        />
        <Input
          placeholder={ar ? "الفرع" : "Branch"}
          value={importBranch}
          onChange={(e) => setImportBranch(e.target.value)}
          className="h-7 text-xs"
        />
        <Button
          size="sm"
          className="w-full h-7 text-xs"
          onClick={() => importMutation.mutate()}
          disabled={!importUrl.trim() || importMutation.isPending}
          data-testid="button-import-repo"
        >
          {importMutation.isPending ? <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" /> : <Download className="w-3.5 h-3.5 me-1" />}
          {ar ? "استيراد" : "Import"}
        </Button>
      </div>

      <div className="border-t border-border" />

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">
          {ar ? "رفع إلى GitHub" : "Push to GitHub"}
        </h4>
        <Input
          placeholder="https://github.com/user/repo.git"
          value={pushRepo}
          onChange={(e) => setPushRepo(e.target.value)}
          className="h-7 text-xs font-mono"
          data-testid="input-push-url"
        />
        <Input
          placeholder="PAT"
          value={pushPat}
          onChange={(e) => setPushPat(e.target.value)}
          type="password"
          className="h-7 text-xs"
          data-testid="input-push-pat"
        />
        <Input
          placeholder={ar ? "الفرع" : "Branch"}
          value={pushBranch}
          onChange={(e) => setPushBranch(e.target.value)}
          className="h-7 text-xs"
        />
        <Textarea
          placeholder={ar ? "رسالة الـ Commit" : "Commit message"}
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          className="min-h-[50px] text-xs resize-none"
          data-testid="input-commit-message"
        />
        <Button
          size="sm"
          className="w-full h-7 text-xs"
          onClick={() => pushMutation.mutate()}
          disabled={pushMutation.isPending}
          data-testid="button-push-repo"
        >
          {pushMutation.isPending ? <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 me-1" />}
          {ar ? "رفع" : "Push"}
        </Button>
      </div>

      {(gitStatus || statusLoading) && (
        <>
          <div className="border-t border-border" />
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase">
              {ar ? "حالة Git" : "Git Status"}
            </h4>
            {statusLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : gitStatus ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-mono">{gitStatus.branch}</span>
                </div>
                {gitStatus.isClean ? (
                  <div className="flex items-center gap-1.5 text-green-500">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{ar ? "لا توجد تغييرات" : "Working tree clean"}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {gitStatus.modified?.length > 0 && (
                      <div className="flex items-center gap-1.5 text-yellow-500">
                        <FileWarning className="w-3.5 h-3.5" />
                        <span>{gitStatus.modified.length} {ar ? "ملف معدّل" : "modified"}</span>
                      </div>
                    )}
                    {gitStatus.created?.length > 0 && (
                      <div className="flex items-center gap-1.5 text-green-500">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{gitStatus.created.length} {ar ? "ملف جديد" : "new"}</span>
                      </div>
                    )}
                  </div>
                )}
                {gitStatus.lastCommits?.[0] && (
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                    <GitCommit className="w-3.5 h-3.5" />
                    <span className="truncate">{gitStatus.lastCommits[0].hash} — {gitStatus.lastCommits[0].message}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
