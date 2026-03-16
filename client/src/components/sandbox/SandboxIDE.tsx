import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play, Square, RotateCcw, Download, Eye, ArrowLeft,
  Terminal, PanelRightClose, PanelRightOpen, Hammer,
  Sparkles, Settings, Upload, Loader2, ExternalLink, RefreshCw
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import { FileTree } from "./FileTree";
import { CodeEditor } from "./CodeEditor";
import { AIPanel } from "./AIPanel";
import { EnvVarsPanel } from "./EnvVarsPanel";
import { GitHubPanel } from "./GitHubPanel";

interface OpenTab {
  path: string;
  content: string;
  dirty: boolean;
}

interface SandboxIDEProps {
  projectId: string;
}

interface SandboxProjectDetail {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  template: string;
  runtime: string;
  isRunning: boolean;
  status?: string;
  port?: number;
  entryFile?: string;
  startCmd?: string;
  installCmd?: string;
  buildCmd?: string;
}

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileEntry[];
}

interface LogEntry {
  text: string;
  stream: string;
}

interface StartResult {
  success: boolean;
  port: number;
  pid: number;
}

const BUILDABLE_TEMPLATES = ["react", "vue", "nextjs"];

function useResizer(initialSize: number, direction: "horizontal" | "vertical", min = 150, max = 600) {
  const [size, setSize] = useState(initialSize);
  const dragging = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startPos.current = direction === "horizontal" ? e.clientX : e.clientY;
      startSize.current = size;

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = (direction === "horizontal" ? ev.clientX : ev.clientY) - startPos.current;
        const newSize = Math.max(min, Math.min(max, startSize.current + delta));
        setSize(newSize);
      };

      const onMouseUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [size, direction, min, max]
  );

  return { size, onMouseDown };
}

function ResizeHandle({ direction, onMouseDown }: { direction: "horizontal" | "vertical"; onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      className={`${
        direction === "horizontal"
          ? "w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50"
          : "h-1 cursor-row-resize hover:bg-primary/30 active:bg-primary/50"
      } bg-border flex-shrink-0 transition-colors`}
      onMouseDown={onMouseDown}
    />
  );
}

export function SandboxIDE({ projectId }: SandboxIDEProps) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState("ai");
  const [logsOpen, setLogsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const { data: user } = useUser();

  const leftPanel = useResizer(220, "horizontal", 150, 400);
  const rightPanel = useResizer(300, "horizontal", 200, 500);
  const logsPanel = useResizer(200, "vertical", 100, 400);

  const { data: project, isLoading: projectLoading } = useQuery<SandboxProjectDetail>({
    queryKey: ["/api/sandbox/projects", projectId],
  });

  const { data: fileTree, isLoading: filesLoading } = useQuery<FileEntry[]>({
    queryKey: ["/api/sandbox/projects", projectId, "files"],
  });

  useEffect(() => {
    if (!user?._id) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: user._id }));
      ws.send(JSON.stringify({ type: "sandbox_subscribe", projectId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "sandbox-log" && data.projectId === projectId) {
          setLogs((prev) => {
            const next = [...prev, { text: data.text, stream: data.stream }];
            return next.length > 500 ? next.slice(-500) : next;
          });
        }
      } catch { /* ignore malformed WS messages */ }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "sandbox_unsubscribe", projectId }));
      }
      ws.close();
    };
  }, [projectId, user?._id]);

  useEffect(() => {
    if (logsOpen) logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, logsOpen]);

  const startMutation = useMutation({
    mutationFn: async (): Promise<StartResult> => {
      const res = await apiRequest("POST", `/api/sandbox/projects/${projectId}/start`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects"] });
      toast({ title: ar ? "تم التشغيل" : "Started" });
      setLogsOpen(true);
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/sandbox/projects/${projectId}/stop`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects"] });
      toast({ title: ar ? "تم الإيقاف" : "Stopped" });
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const restartMutation = useMutation({
    mutationFn: async (): Promise<StartResult> => {
      const res = await apiRequest("POST", `/api/sandbox/projects/${projectId}/restart`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects"] });
      toast({ title: ar ? "تم إعادة التشغيل" : "Restarted" });
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const saveFile = useCallback(
    async (path: string, content: string) => {
      try {
        await apiRequest("PUT", `/api/sandbox/projects/${projectId}/file`, { path, content });
        setTabs((prev) => prev.map((t) => (t.path === path ? { ...t, dirty: false } : t)));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        toast({ title: ar ? "خطأ في الحفظ" : "Save error", description: message, variant: "destructive" });
      }
    },
    [projectId, ar, toast]
  );

  const handleFileSelect = useCallback(
    async (path: string) => {
      const existing = tabs.find((t) => t.path === path);
      if (existing) {
        setActiveTab(path);
        return;
      }

      try {
        const res = await fetch(`/api/sandbox/projects/${projectId}/file?path=${encodeURIComponent(path)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load file");
        const data: { path: string; content: string } = await res.json();
        setTabs((prev) => [...prev, { path, content: data.content || "", dirty: false }]);
        setActiveTab(path);
      } catch {
        toast({ title: ar ? "خطأ في تحميل الملف" : "Failed to load file", variant: "destructive" });
      }
    },
    [tabs, projectId, ar, toast]
  );

  const handleTabClose = (path: string) => {
    setTabs((prev) => prev.filter((t) => t.path !== path));
    if (activeTab === path) {
      const remaining = tabs.filter((t) => t.path !== path);
      setActiveTab(remaining.length ? remaining[remaining.length - 1].path : null);
    }
  };

  const handleEditorChange = useCallback(
    (path: string, content: string) => {
      setTabs((prev) => prev.map((t) => (t.path === path ? { ...t, content, dirty: true } : t)));
      if (saveTimerRef.current[path]) clearTimeout(saveTimerRef.current[path]);
      saveTimerRef.current[path] = setTimeout(() => saveFile(path, content), 1000);
    },
    [saveFile]
  );

  const handleCreateFile = async (filePath: string) => {
    try {
      await apiRequest("PUT", `/api/sandbox/projects/${projectId}/file`, { path: filePath, content: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "files"] });
      handleFileSelect(filePath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: ar ? "خطأ" : "Error", description: message, variant: "destructive" });
    }
  };

  const handleCreateFolder = async (folderPath: string) => {
    try {
      await apiRequest("POST", `/api/sandbox/projects/${projectId}/folder`, { path: folderPath });
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "files"] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: ar ? "خطأ" : "Error", description: message, variant: "destructive" });
    }
  };

  const handleRename = async (oldPath: string, newPath: string) => {
    try {
      await apiRequest("POST", `/api/sandbox/projects/${projectId}/rename`, { oldPath, newPath });
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "files"] });
      setTabs((prev) =>
        prev.map((t) => (t.path === oldPath ? { ...t, path: newPath } : t))
      );
      if (activeTab === oldPath) setActiveTab(newPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: ar ? "خطأ" : "Error", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async (path: string) => {
    try {
      await apiRequest("DELETE", `/api/sandbox/projects/${projectId}/file?path=${encodeURIComponent(path)}`);
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "files"] });
      handleTabClose(path);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: ar ? "خطأ" : "Error", description: message, variant: "destructive" });
    }
  };

  const handleCreateFileFromAI = async (name: string, content: string) => {
    try {
      await apiRequest("PUT", `/api/sandbox/projects/${projectId}/file`, { path: name, content });
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "files"] });
      setTabs((prev) => {
        const exists = prev.find((t) => t.path === name);
        if (exists) return prev.map((t) => (t.path === name ? { ...t, content, dirty: false } : t));
        return [...prev, { path: name, content, dirty: false }];
      });
      setActiveTab(name);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: ar ? "خطأ" : "Error", description: message, variant: "destructive" });
    }
  };

  const handleApplyToEditor = (code: string) => {
    if (activeTab) {
      setTabs((prev) => prev.map((t) => (t.path === activeTab ? { ...t, content: code, dirty: true } : t)));
      saveFile(activeTab, code);
    }
  };

  const handleDownload = () => {
    window.open(`/api/sandbox/projects/${projectId}/download`, "_blank");
  };

  const buildMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sandbox/projects/${projectId}/build`, {});
      return res.json();
    },
    onSuccess: () => {
      setLogsOpen(true);
      toast({ title: ar ? "بدأ البناء" : "Build started" });
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ في البناء" : "Build error", description: err.message, variant: "destructive" });
    },
  });

  const isRunning = project?.isRunning || project?.status === "running";
  const isProcessing = startMutation.isPending || stopMutation.isPending || restartMutation.isPending;
  const showBuildButton = project && BUILDABLE_TEMPLATES.includes(project.template);

  if (projectLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => navigate("/employee/system-builder")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold truncate">{project?.name}</span>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          {isRunning ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => stopMutation.mutate()}
                disabled={isProcessing}
                data-testid="button-stop"
              >
                <Square className="w-3.5 h-3.5 me-1" />
                {ar ? "إيقاف" : "Stop"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => restartMutation.mutate()}
                disabled={isProcessing}
                data-testid="button-restart"
              >
                <RotateCcw className="w-3.5 h-3.5 me-1" />
                {ar ? "إعادة" : "Restart"}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => startMutation.mutate()}
              disabled={isProcessing}
              data-testid="button-start"
            >
              {startMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 me-1" />
              )}
              {ar ? "تشغيل" : "Start"}
            </Button>
          )}

          {showBuildButton && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => buildMutation.mutate()}
              disabled={buildMutation.isPending}
              data-testid="button-build"
            >
              {buildMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />
              ) : (
                <Hammer className="w-3.5 h-3.5 me-1" />
              )}
              {ar ? "بناء" : "Build"}
            </Button>
          )}

          <Button
            variant={showPreview ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowPreview(!showPreview)}
            data-testid="button-toggle-preview"
          >
            <Eye className="w-3.5 h-3.5 me-1" />
            {ar ? "معاينة" : "Preview"}
          </Button>

          <Button
            variant={logsOpen ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setLogsOpen(!logsOpen)}
            data-testid="button-toggle-logs"
          >
            <Terminal className="w-3.5 h-3.5 me-1" />
            {ar ? "السجلات" : "Logs"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleDownload}
            data-testid="button-download"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            data-testid="button-toggle-panel"
          >
            {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div style={{ width: leftPanel.size }} className="border-e border-border flex-shrink-0 overflow-hidden">
          <FileTree
            files={fileTree || []}
            activeFile={activeTab}
            onFileSelect={handleFileSelect}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onRename={handleRename}
            onDelete={handleDelete}
            isLoading={filesLoading}
          />
        </div>

        <ResizeHandle direction="horizontal" onMouseDown={leftPanel.onMouseDown} />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex min-h-0">
            <div className={`flex-1 min-w-0 ${showPreview ? "w-1/2" : ""}`}>
              <CodeEditor
                tabs={tabs}
                activeTab={activeTab}
                onTabSelect={setActiveTab}
                onTabClose={handleTabClose}
                onChange={handleEditorChange}
                onSave={saveFile}
              />
            </div>

            {showPreview && (
              <div className="w-1/2 border-s border-border flex flex-col">
                <div className="flex items-center gap-2 px-3 py-1 border-b border-border bg-muted/30">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground flex-1 truncate font-mono">
                    /sandbox/{projectId}/preview/
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      const iframe = document.getElementById("sandbox-preview") as HTMLIFrameElement;
                      if (iframe) iframe.src = iframe.src;
                    }}
                    data-testid="button-refresh-preview"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => window.open(`/sandbox/${projectId}/preview/`, "_blank")}
                    data-testid="button-external-preview"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
                {isRunning ? (
                  <iframe
                    id="sandbox-preview"
                    src={`/sandbox/${projectId}/preview/`}
                    className="flex-1 w-full bg-white"
                    title="Preview"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Eye className="w-8 h-8 opacity-30" />
                    <p className="text-sm">{ar ? "المشروع غير مشغّل" : "Project is not running"}</p>
                    <Button
                      size="sm"
                      onClick={() => startMutation.mutate()}
                      disabled={isProcessing}
                      data-testid="button-start-preview"
                    >
                      <Play className="w-3.5 h-3.5 me-1" />
                      {ar ? "تشغيل" : "Start"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {logsOpen && (
            <>
              <ResizeHandle direction="vertical" onMouseDown={logsPanel.onMouseDown} />
              <div style={{ height: logsPanel.size }} className="border-t border-border flex flex-col">
                <div className="flex items-center justify-between px-3 py-1 bg-muted/30 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground">{ar ? "السجلات" : "Logs"}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-xs"
                    onClick={() => setLogs([])}
                    data-testid="button-clear-logs"
                  >
                    {ar ? "مسح" : "Clear"}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 font-mono text-xs bg-black/90 text-green-400">
                  {logs.length === 0 ? (
                    <span className="text-muted-foreground">{ar ? "لا توجد سجلات بعد..." : "No logs yet..."}</span>
                  ) : (
                    logs.map((log, i) => (
                      <div
                        key={i}
                        className={log.stream === "stderr" ? "text-red-400" : "text-green-400"}
                      >
                        {log.text}
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </>
          )}
        </div>

        {rightPanelOpen && (
          <>
            <ResizeHandle direction="horizontal" onMouseDown={rightPanel.onMouseDown} />
            <div style={{ width: rightPanel.size }} className="border-s border-border flex-shrink-0 flex flex-col">
              <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex flex-col h-full">
                <TabsList className="w-full rounded-none border-b border-border bg-muted/30 h-auto p-0">
                  <TabsTrigger value="ai" className="flex-1 h-8 text-xs rounded-none data-[state=active]:bg-background" data-testid="tab-trigger-ai">
                    <Sparkles className="w-3.5 h-3.5 me-1" />
                    AI
                  </TabsTrigger>
                  <TabsTrigger value="env" className="flex-1 h-8 text-xs rounded-none data-[state=active]:bg-background" data-testid="tab-trigger-env">
                    <Settings className="w-3.5 h-3.5 me-1" />
                    {ar ? "بيئة" : "Env"}
                  </TabsTrigger>
                  <TabsTrigger value="github" className="flex-1 h-8 text-xs rounded-none data-[state=active]:bg-background" data-testid="tab-trigger-github">
                    <SiGithub className="w-3.5 h-3.5 me-1" />
                    Git
                  </TabsTrigger>
                  <TabsTrigger value="deploy" className="flex-1 h-8 text-xs rounded-none data-[state=active]:bg-background" data-testid="tab-trigger-deploy">
                    <Upload className="w-3.5 h-3.5 me-1" />
                    {ar ? "نشر" : "Deploy"}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="ai" className="flex-1 m-0 overflow-hidden">
                  <AIPanel
                    projectId={projectId}
                    activeFile={activeTab}
                    onApplyToEditor={handleApplyToEditor}
                    onCreateFile={handleCreateFileFromAI}
                  />
                </TabsContent>
                <TabsContent value="env" className="flex-1 m-0 overflow-hidden">
                  <EnvVarsPanel projectId={projectId} />
                </TabsContent>
                <TabsContent value="github" className="flex-1 m-0 overflow-hidden">
                  <GitHubPanel projectId={projectId} />
                </TabsContent>
                <TabsContent value="deploy" className="flex-1 m-0 overflow-y-auto p-3">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{ar ? "النشر والتصدير" : "Deploy & Export"}</span>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full text-xs"
                      onClick={handleDownload}
                      data-testid="button-download-zip"
                    >
                      <Download className="w-4 h-4 me-2" />
                      {ar ? "تحميل ZIP" : "Download ZIP"}
                    </Button>

                    <div className="text-xs text-muted-foreground space-y-2 bg-muted/50 rounded p-3">
                      <p className="font-medium">{ar ? "نشر الموقع:" : "Deploy your site:"}</p>
                      <p>{ar ? "١. حمّل ملف ZIP الخاص بمشروعك" : "1. Download your project ZIP"}</p>
                      <p>{ar ? "٢. ارفعه إلى إحدى منصات النشر:" : "2. Upload to a hosting platform:"}</p>
                      <div className="flex flex-col gap-1">
                        <a
                          href="https://vercel.com/new"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                          data-testid="link-vercel"
                        >
                          Vercel <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href="https://app.netlify.com/drop"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                          data-testid="link-netlify"
                        >
                          Netlify <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
