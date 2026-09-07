import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, CircleDot, ExternalLink, Globe2, Loader2,
  Rocket, Server, ShieldCheck, Sparkles, TerminalSquare, Wifi,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeploymentPanelProps {
  projectId: string;
  onDownload: () => void;
}

interface SandboxProject {
  name?: string;
  githubRepo?: string;
  githubBranch?: string;
  buildCmd?: string;
  startCmd?: string;
  logoUrl?: string;
}

function parseRepo(value: string) {
  const match = value.match(/github\.com[/:]([^/]+)\/([^/#]+?)(?:\.git)?$/i);
  return match ? { owner: match[1], repo: match[2] } : null;
}

function statusLabel(status: string | undefined, ar: boolean) {
  const labels: Record<string, string> = {
    idle: ar ? "جاهز للنشر" : "Ready to deploy",
    building: ar ? "جارٍ البناء" : "Building",
    deploying: ar ? "جارٍ النشر" : "Deploying",
    live: ar ? "نشط" : "Live",
    failed: ar ? "فشل النشر" : "Failed",
    suspended: ar ? "متوقف" : "Suspended",
  };
  return labels[status || "idle"] || status || (ar ? "جاهز" : "Ready");
}

export function DeploymentPanel({ projectId, onDownload }: DeploymentPanelProps) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customDomain, setCustomDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const { data: project } = useQuery<SandboxProject>({
    queryKey: ["/api/sandbox/projects", projectId],
  });
  const { data: config } = useQuery<any>({
    queryKey: ["/api/deploy/config"],
  });
  const { data: deploymentProjects, isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ["/api/deploy/projects"],
    retry: false,
  });

  const repo = useMemo(() => parseRepo(String(project?.githubRepo || "")), [project?.githubRepo]);
  const deployment = useMemo(() => {
    if (!repo || !Array.isArray(deploymentProjects)) return null;
    return deploymentProjects.find(
      (item) => String(item.githubOwner).toLowerCase() === repo.owner.toLowerCase()
        && String(item.githubRepo).toLowerCase() === repo.repo.toLowerCase(),
    ) || null;
  }, [deploymentProjects, repo]);

  const { data: deploymentDetails } = useQuery<any>({
    queryKey: ["/api/deploy/projects", deployment?.id],
    enabled: Boolean(deployment?.id),
  });
  const activeDeployment = deploymentDetails || deployment;
  const { data: runs } = useQuery<any[]>({
    queryKey: ["/api/deploy/projects", activeDeployment?.id, "runs"],
    enabled: Boolean(activeDeployment?.id),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!repo) throw new Error(ar ? "اربط مستودع GitHub أولاً" : "Connect a GitHub repository first");
      const res = await apiRequest("POST", "/api/deploy/projects", {
        name: project?.name || repo.repo,
        description: ar ? "نشر مشروع من بيئة QIROX" : "Deployment from QIROX Workspace",
        githubOwner: repo.owner,
        githubRepo: repo.repo,
        githubBranch: project?.githubBranch || "main",
        buildCommand: project?.buildCmd || "npm run build",
        startCommand: project?.startCmd || "npm start",
        outputDir: "dist",
        provider: config?.mode === "vercel" ? "vercel" : "simulation",
        logoUrl: logoUrl.trim(),
        envVars: [],
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Deployment project could not be created");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deploy/projects"] });
      toast({ title: ar ? "تم تجهيز مشروع النشر" : "Deployment project is ready" });
    },
    onError: (error: Error) => toast({ title: ar ? "تعذر تجهيز النشر" : "Deployment setup failed", description: error.message, variant: "destructive" }),
  });

  const logoMutation = useMutation({
    mutationFn: async () => {
      const nextLogo = logoUrl.trim();
      await apiRequest("PATCH", `/api/sandbox/projects/${projectId}`, { logoUrl: nextLogo });
      if (activeDeployment?.id) {
        await apiRequest("PATCH", `/api/deploy/projects/${activeDeployment.id}/logo`, { logoUrl: nextLogo });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/deploy/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deploy/projects", activeDeployment?.id] });
      toast({ title: ar ? "تم تحديث هوية المشروع" : "Project identity updated" });
    },
    onError: (error: Error) => toast({ title: ar ? "تعذر تحديث الشعار" : "Could not update logo", description: error.message, variant: "destructive" }),
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/deploy/projects/${activeDeployment?.id}/deploy`, {});
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Deployment failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deploy/projects", activeDeployment?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/deploy/projects", activeDeployment?.id, "runs"] });
      toast({ title: ar ? "بدأ النشر" : "Deployment started" });
    },
    onError: (error: Error) => toast({ title: ar ? "تعذر بدء النشر" : "Could not start deployment", description: error.message, variant: "destructive" }),
  });

  const domainMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/deploy/projects/${activeDeployment?.id}`, {
        customDomain: customDomain.trim().toLowerCase(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Domain could not be saved");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deploy/projects", activeDeployment?.id] });
      toast({ title: ar ? "تم حفظ النطاق" : "Domain saved" });
    },
    onError: (error: Error) => toast({ title: ar ? "تعذر حفظ النطاق" : "Could not save domain", description: error.message, variant: "destructive" }),
  });

  const status = activeDeployment?.status || "idle";
  const liveUrl = activeDeployment?.customDomain
    ? `https://${activeDeployment.customDomain}`
    : activeDeployment?.domain
      ? `https://${activeDeployment.domain}`
      : "";
  const latestRun = runs?.[0];

  useEffect(() => {
    if (project?.logoUrl && !logoUrl) setLogoUrl(project.logoUrl);
  }, [project?.logoUrl, logoUrl]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background text-foreground">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
            <Rocket className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{ar ? "النشر" : "Deploy"}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {ar ? "انقل مشروعك إلى رابط حي" : "Ship your project to a live URL"}
            </div>
          </div>
          <span className="ms-auto rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground">
            {config?.mode === "vercel" ? "Vercel" : "QIROX Cloud"}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold">{ar ? "هوية المشروع" : "Project identity"}</div>
              <div className="text-[10px] text-muted-foreground">{ar ? "يظهر خارجياً وفي صفحة المشروع المنشورة" : "Shown on external cards and the published project page"}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
              {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-contain" /> : <span className="text-sm font-bold text-foreground">{(project?.name || "Q").charAt(0).toUpperCase()}</span>}
            </div>
            <Input
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="https://example.com/logo.png"
              className="h-9 border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
              dir="ltr"
              data-testid="input-project-logo-url"
            />
            <Button
              className="h-9 shrink-0 bg-foreground px-3 text-xs text-background hover:bg-foreground/80"
              onClick={() => logoMutation.mutate()}
              disabled={logoMutation.isPending || !logoUrl.trim()}
              data-testid="button-save-project-logo"
            >
              {logoMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (ar ? "حفظ" : "Save")}
            </Button>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
            {ar ? "استخدم رابط صورة HTTPS. لن يتم تغيير شعار QIROX العام، هذا الشعار خاص بهذا المشروع فقط." : "Use an HTTPS image URL. This changes only this project identity, not the global QIROX logo."}
          </p>
        </div>

        {!repo ? (
          <div className="rounded-xl border border-border bg-muted p-4 text-xs leading-5 text-foreground">
            {ar ? "لا يوجد مستودع GitHub مرتبط بهذا الـWorkspace. اربط المستودع أولاً من تبويب Git." : "This workspace has no linked GitHub repository. Connect one from Git first."}
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Server className="h-3.5 w-3.5" />
                {ar ? "مصدر النشر" : "Deployment source"}
              </div>
              <div className="truncate font-mono text-xs text-foreground" dir="ltr">
                {repo.owner}/{repo.repo}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground" dir="ltr">
                {project?.githubBranch || "main"}
              </div>
            </div>

            {!activeDeployment ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-4">
                <div className="mb-3 flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-foreground" />
                  <div>
                    <div className="text-xs font-semibold">{ar ? "جهّز أول نشر" : "Prepare your first deployment"}</div>
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                      {ar ? "سيتم إنشاء مشروع نشر مرتبط بنفس مستودع GitHub، مع رابط QIROX Cloud تلقائياً." : "Create a deployment project linked to this GitHub repository with a QIROX Cloud URL."}
                    </p>
                  </div>
                </div>
                <Button
                  className="h-9 w-full bg-foreground text-xs font-semibold text-background hover:bg-foreground/80"
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || projectsLoading}
                  data-testid="button-create-deployment"
                >
                  {createMutation.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Rocket className="me-2 h-4 w-4" />}
                  {ar ? "تجهيز النشر" : "Prepare deployment"}
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {status === "live" ? <CheckCircle2 className="h-4 w-4 text-foreground" /> : <CircleDot className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-xs font-semibold">{statusLabel(status, ar)}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground" dir="ltr">{activeDeployment.provider || "simulation"}</span>
                  </div>
                  {liveUrl && (
                    <a href={liveUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-2.5 py-2 text-[11px] text-foreground hover:bg-accent" dir="ltr">
                      <Globe2 className="h-3.5 w-3.5" />
                      <span className="truncate">{liveUrl.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="ms-auto h-3 w-3 shrink-0" />
                    </a>
                  )}
                </div>

                <Button
                  className="h-10 w-full bg-foreground text-xs font-semibold text-background hover:bg-foreground/80"
                  onClick={() => deployMutation.mutate()}
                  disabled={deployMutation.isPending || ["building", "deploying"].includes(status)}
                  data-testid="button-deploy-project"
                >
                  {deployMutation.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Rocket className="me-2 h-4 w-4" />}
                  {status === "live" ? (ar ? "نشر نسخة جديدة" : "Deploy new version") : (ar ? "نشر الآن" : "Deploy now")}
                </Button>

                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                    <Globe2 className="h-4 w-4 text-foreground" />
                    {ar ? "النطاق الخاص" : "Custom domain"}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={customDomain || activeDeployment.customDomain || ""}
                      onChange={(event) => setCustomDomain(event.target.value)}
                      placeholder="app.example.com"
                      className="h-8 border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                      dir="ltr"
                      data-testid="input-custom-domain"
                    />
                    <Button
                      className="h-8 shrink-0 bg-foreground px-3 text-xs text-background hover:bg-foreground/80"
                      onClick={() => domainMutation.mutate()}
                      disabled={!customDomain.trim() || domainMutation.isPending}
                      data-testid="button-save-custom-domain"
                    >
                      {domainMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (ar ? "ربط" : "Connect")}
                    </Button>
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-[10px] leading-4 text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
                    <span>{ar ? `أضف CNAME إلى ${activeDeployment.domain || "رابط QIROX Cloud"} ثم انتظر التحقق.` : `Add a CNAME pointing to ${activeDeployment.domain || "your QIROX Cloud URL"} and wait for verification.`}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                    <TerminalSquare className="h-4 w-4 text-muted-foreground" />
                    {ar ? "آخر عملية نشر" : "Latest deployment"}
                  </div>
                  {latestRun ? (
                    <div className="space-y-1 text-[10px] text-muted-foreground">
                      <div className="flex justify-between gap-3"><span>{latestRun.commitMsg || "Manual deployment"}</span><span dir="ltr">{latestRun.status}</span></div>
                      <div dir="ltr">{latestRun.commitSha?.slice(0, 10) || "—"}</div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground">{ar ? "لا توجد عمليات نشر بعد." : "No deployments yet."}</div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Wifi className="h-3.5 w-3.5 text-foreground" />
            {ar ? "بيئة النشر متاحة" : "Deployment environment available"}
          </div>
          <Button variant="ghost" className="h-7 px-2 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground" onClick={onDownload} data-testid="button-download-deployment-zip">
            {ar ? "تنزيل ZIP" : "Download ZIP"}
          </Button>
        </div>
      </div>
    </div>
  );
}