import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play, Square, RotateCcw, Download, Eye, ArrowLeft,
  Terminal, PanelRightClose, PanelRightOpen, Hammer,
  Sparkles, Settings, Upload, Loader2, ExternalLink, RefreshCw,
  FolderTree, Search, GitBranch, KeyRound, Rocket, Command,
  MoreHorizontal, Check, Circle, ChevronDown, ScrollText, TerminalSquare,
  MousePointer2
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import { FileTree } from "./FileTree";
import { CodeEditor } from "./CodeEditor";
import { AIPanel, type SelectedElement } from "./AIPanel";
import { EnvVarsPanel } from "./EnvVarsPanel";
import { GitHubPanel } from "./GitHubPanel";
import { DeploymentPanel } from "./DeploymentPanel";

interface OpenTab {
  path: string;
  content: string;
  dirty: boolean;
}

interface SandboxIDEProps {
  projectId: string;
  adminOrderId?: string;
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
  logoUrl?: string;
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
  ts?: number;
}

function flattenFiles(entries: FileEntry[], output: FileEntry[] = []) {
  for (const entry of entries) {
    if (entry.type === "file") output.push(entry);
    if (entry.children) flattenFiles(entry.children, output);
  }
  return output;
}

function escapeCssIdentifier(value: string): string {
  if (typeof window !== "undefined" && window.CSS?.escape) return window.CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
}

function getElementSelector(element: Element): string {
  const segments: string[] = [];
  let current: Element | null = element;
  while (current && current.nodeType === 1 && current.tagName.toLowerCase() !== "html") {
    const id = current.getAttribute("id");
    if (id) {
      segments.unshift(`#${escapeCssIdentifier(id)}`);
      break;
    }

    let segment = current.tagName.toLowerCase();
    const classes = Array.from(current.classList)
      .filter(Boolean)
      .slice(0, 2)
      .map((className) => `.${escapeCssIdentifier(className)}`)
      .join("");
    segment += classes;

    const parent = current.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter(
        (child) => child.tagName === current?.tagName,
      );
      if (sameTag.length > 1) {
        segment += `:nth-of-type(${sameTag.indexOf(current) + 1})`;
      }
    }
    segments.unshift(segment);
    current = current.parentElement;
  }
  return segments.join(" > ") || element.tagName.toLowerCase();
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

export function SandboxIDE({ projectId, adminOrderId }: SandboxIDEProps) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState(adminOrderId ? "deploy" : "ai");
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsPanelTab, setLogsPanelTab] = useState<"shell" | "logs">("shell");
  const [showPreview, setShowPreview] = useState(false);
  const [activityView, setActivityView] = useState<"files" | "search">("files");
  const [searchQuery, setSearchQuery] = useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [shellCommand, setShellCommand] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const selectionCleanupRef = useRef<(() => void) | null>(null);
  const importedDeploymentEnvRef = useRef(false);
  const { data: user } = useUser();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  const leftPanel = useResizer(240, "horizontal", 150, 400);
  const rightPanel = useResizer(320, "horizontal", 200, 500);
  const logsPanel = useResizer(200, "vertical", 100, 400);

  const installPreviewSelection = useCallback(() => {
    selectionCleanupRef.current?.();
    selectionCleanupRef.current = null;
    if (!selectionMode) return;

    const iframe = previewRef.current;
    let documentNode: Document;
    try {
      if (!iframe?.contentDocument) throw new Error("preview-document-unavailable");
      documentNode = iframe.contentDocument;
    } catch {
      toast({
        title: ar ? "تعذر تفعيل التحديد" : "Selection is unavailable",
        description: ar ? "افتح المعاينة داخل نفس النافذة ثم حاول مرة أخرى." : "Open the preview in this window and try again.",
        variant: "destructive",
      });
      return;
    }

    const style = documentNode.createElement("style");
    style.id = "qirox-preview-selection-style";
    style.textContent = `
      .qirox-preview-selection-hover {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
        cursor: crosshair !important;
      }
    `;
    documentNode.head?.appendChild(style);

    let hovered: Element | null = null;
    const isSelectable = (target: EventTarget | null): target is Element => {
      if (!(target instanceof Element)) return false;
      const tag = target.tagName.toLowerCase();
      return tag !== "html" && tag !== "head" && tag !== "body" && tag !== "script" && tag !== "style";
    };
    const setHovered = (next: Element | null) => {
      if (hovered === next) return;
      hovered?.classList.remove("qirox-preview-selection-hover");
      hovered = next;
      hovered?.classList.add("qirox-preview-selection-hover");
    };
    const onMouseOver = (event: MouseEvent) => {
      if (isSelectable(event.target)) setHovered(event.target);
    };
    const onMouseOut = (event: MouseEvent) => {
      const related = event.relatedTarget;
      if (related instanceof Node && hovered?.contains(related)) return;
      setHovered(null);
    };
    const onClick = (event: MouseEvent) => {
      if (!isSelectable(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      const target = event.target;
      const text = (target.textContent || "").replace(/\s+/g, " ").trim().slice(0, 500);
      setSelectedElement({
        tagName: target.tagName.toLowerCase(),
        selector: getElementSelector(target),
        text,
        className: typeof target.className === "string" ? target.className.slice(0, 500) : "",
        ariaLabel: target.getAttribute("aria-label") || "",
      });
      setSelectionMode(false);
      setRightPanelOpen(true);
      setRightPanelTab("ai");
      toast({ title: ar ? "تم تحديد العنصر" : "Element selected" });
    };

    documentNode.addEventListener("mouseover", onMouseOver, true);
    documentNode.addEventListener("mouseout", onMouseOut, true);
    documentNode.addEventListener("click", onClick, true);
    selectionCleanupRef.current = () => {
      hovered?.classList.remove("qirox-preview-selection-hover");
      documentNode.removeEventListener("mouseover", onMouseOver, true);
      documentNode.removeEventListener("mouseout", onMouseOut, true);
      documentNode.removeEventListener("click", onClick, true);
      style.remove();
    };
  }, [ar, selectionMode, toast]);

  useEffect(() => {
    installPreviewSelection();
    return () => {
      selectionCleanupRef.current?.();
      selectionCleanupRef.current = null;
    };
  }, [installPreviewSelection]);

  useEffect(() => {
    if (!showPreview && selectionMode) setSelectionMode(false);
  }, [showPreview, selectionMode]);

  const { data: project, isLoading: projectLoading } = useQuery<SandboxProjectDetail>({
    queryKey: ["/api/sandbox/projects", projectId],
  });

  const { data: fileTree, isLoading: filesLoading } = useQuery<FileEntry[]>({
    queryKey: ["/api/sandbox/projects", projectId, "files"],
  });

  const { data: persistedLogs } = useQuery<{ logs: LogEntry[] }>({
    queryKey: ["/api/sandbox/projects", projectId, "logs"],
    enabled: logsOpen,
    refetchInterval: logsOpen ? 2000 : false,
  });

  const { data: runtimeStatus } = useQuery<{ isRunning: boolean; port: number | null }>({
    queryKey: ["/api/sandbox/projects", projectId, "status"],
    enabled: Boolean(projectId),
    refetchInterval: 2000,
    staleTime: 0,
  });

  useEffect(() => {
    if (!projectId || !user?._id || importedDeploymentEnvRef.current) return;
    importedDeploymentEnvRef.current = true;
    apiRequest("POST", `/api/sandbox/projects/${projectId}/env/import-deployment`, {})
      .then((res) => {
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "env"] });
        }
      })
      .catch(() => {
        // A standalone sandbox has no deployment record; that is expected.
      });
  }, [projectId, user?._id, queryClient]);

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
            const next = [
              ...prev,
              {
                text: data.text,
                stream: data.stream,
                ts: typeof data.ts === "number" ? data.ts : Date.now(),
              },
            ];
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

  useEffect(() => {
    if (!persistedLogs?.logs?.length) return;
    setLogs((previous) => {
      const merged = [...persistedLogs.logs, ...previous];
      const unique = new Map<string, LogEntry>();
      for (const entry of merged) {
        const key = `${entry.ts || 0}:${entry.stream}:${entry.text}`;
        unique.set(key, entry);
      }
      return Array.from(unique.values())
        .sort((a, b) => (a.ts || 0) - (b.ts || 0))
        .slice(-500);
    });
  }, [persistedLogs]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const startMutation = useMutation({
    mutationFn: async (): Promise<StartResult> => {
      const res = await apiRequest("POST", `/api/sandbox/projects/${projectId}/start`, {});
      return res.json();
    },
    onMutate: () => {
      setLogsPanelTab("logs");
      setLogsOpen(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects"] });
      toast({ title: ar ? "تم التشغيل" : "Started" });
      setLogsOpen(true);
    },
    onError: (err: Error) => {
      setLogsOpen(true);
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

  useEffect(() => {
    if (!fileTree || tabs.length > 0 || activeTab) return;
    const files = flattenFiles(fileTree);
    if (!files.length) return;

    const entryFile = project?.entryFile?.replace(/^\.?\//, "");
    const preferred =
      (entryFile && files.find((file) => file.path === entryFile)) ||
      files.find((file) => /\.(tsx?|jsx?|vue|svelte|py|rb|go|rs|java|php|html|css|scss|json|md)$/i.test(file.path)) ||
      files[0];

    if (preferred) handleFileSelect(preferred.path);
  }, [fileTree, project?.entryFile, tabs.length, activeTab, handleFileSelect]);

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

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/sandbox/projects/${projectId}/download`, { credentials: "include" });
      if (!res.ok) throw new Error("فشل التحميل");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `project-${projectId}.zip`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: ar ? "خطأ في التحميل" : "Download error", description: err.message, variant: "destructive" });
    }
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

  const shellMutation = useMutation({
    mutationFn: async (command: string) => {
      const res = await apiRequest("POST", `/api/sandbox/projects/${projectId}/command`, { command });
      return res.json();
    },
    onSuccess: () => {
      setShellCommand("");
      setLogsOpen(true);
    },
    onError: (err: Error) => {
      setLogsOpen(true);
      toast({ title: ar ? "خطأ في Shell" : "Shell error", description: err.message, variant: "destructive" });
    },
  });

  const isRunning = runtimeStatus?.isRunning ?? project?.isRunning ?? project?.status === "running";
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
    <div className="h-dvh min-h-[620px] flex flex-col overflow-hidden bg-background text-foreground" dir={ar ? "rtl" : "ltr"}>
      <header className="z-20 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-2 shadow-[0_1px_0_rgba(0,0,0,0.12)]">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => navigate("/employee/system-builder")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-foreground text-[11px] font-black text-background">
          {project?.logoUrl ? (
            <img
              src={project.logoUrl}
              alt={project.name || "Project logo"}
              className="h-full w-full object-contain bg-background"
            />
          ) : (
            "Q"
          )}
        </div>
        <div className="min-w-0 max-w-[260px]">
          <div className="truncate text-xs font-semibold text-foreground">{project?.name}</div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <GitBranch className="h-3 w-3" />
            <span dir="ltr">{project?.githubBranch || "main"}</span>
            <span>·</span>
            <span>{ar ? "Workspace" : "Workspace"}</span>
          </div>
        </div>
        <button
          type="button"
          className="ms-2 hidden h-7 min-w-[180px] items-center gap-2 rounded-md border border-border bg-background px-2.5 text-start text-[11px] text-muted-foreground transition hover:border-foreground hover:text-foreground sm:flex"
          onClick={() => setCommandPaletteOpen(true)}
          data-testid="button-command-search"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">{ar ? "بحث في المشروع أو تشغيل أمر" : "Search files or run a command"}</span>
          <kbd className="rounded border border-border px-1 text-[9px] text-muted-foreground">⌘ K</kbd>
        </button>
        <div className="flex-1" />
        <div className="hidden items-center gap-1.5 text-[10px] text-muted-foreground md:flex">
          <span className={`h-2 w-2 rounded-full ${isRunning ? "bg-foreground" : "bg-muted-foreground"}`} />
          {isRunning ? (ar ? "يعمل الآن" : "Running") : (ar ? "متوقف" : "Stopped")}
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 bg-foreground px-3 text-xs font-semibold text-background hover:bg-foreground/80"
          onClick={() => (isRunning ? stopMutation.mutate() : startMutation.mutate())}
          disabled={isProcessing}
          data-testid="button-primary-run"
        >
          {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isRunning ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{isRunning ? (ar ? "إيقاف" : "Stop") : (ar ? "تشغيل" : "Run")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
           className={`h-8 gap-1.5 border-border px-2.5 text-xs ${showPreview ? "bg-accent text-foreground" : "bg-transparent text-foreground"} hover:bg-accent`}
           onClick={() => {
             const next = !showPreview;
             setShowPreview(next);
             if (next && !isRunning && !isProcessing) startMutation.mutate();
           }}
          data-testid="button-toggle-preview"
        >
          <Eye className="h-3.5 w-3.5" />
           <span className="hidden md:inline">{ar ? "معاينة" : "Preview"}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-border bg-transparent px-2.5 text-xs text-foreground hover:bg-accent"
          onClick={() => { setRightPanelOpen(true); setRightPanelTab("deploy"); }}
          data-testid="button-open-deploy"
        >
          <Rocket className="h-3.5 w-3.5 text-foreground" />
           <span className="hidden md:inline">{ar ? "نشر" : "Deploy"}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
           className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          data-testid="button-toggle-panel"
        >
          {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
           className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => setCommandPaletteOpen(true)}
          data-testid="button-workspace-menu"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </header>

      <div className="relative flex min-h-0 flex-1 pb-6">
         <nav className="flex w-12 shrink-0 flex-col items-center border-e border-border bg-background py-2 md:w-40 md:items-stretch md:px-2" aria-label={ar ? "أدوات المشروع" : "Project tools"}>
           <div className="mb-2 hidden px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:block">
             {ar ? "أدوات المشروع" : "Project tools"}
           </div>
          <button
            type="button"
             className={`mb-1 flex h-10 w-10 items-center justify-center rounded-md border-s-2 transition md:w-full md:justify-start md:gap-2 md:px-2 ${activityView === "files" ? "border-foreground bg-accent text-foreground" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            onClick={() => setActivityView("files")}
            title={ar ? "المستكشف" : "Explorer"}
             aria-label={ar ? "المستكشف" : "Explorer"}
            data-testid="button-activity-files"
          >
            <FolderTree className="h-5 w-5" />
             <span className="hidden text-xs md:inline">{ar ? "الملفات" : "Files"}</span>
          </button>
          <button
            type="button"
             className={`mb-1 flex h-10 w-10 items-center justify-center rounded-md border-s-2 transition md:w-full md:justify-start md:gap-2 md:px-2 ${activityView === "search" ? "border-foreground bg-accent text-foreground" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            onClick={() => setActivityView("search")}
            title={ar ? "بحث" : "Search"}
             aria-label={ar ? "بحث" : "Search"}
            data-testid="button-activity-search"
          >
            <Search className="h-5 w-5" />
             <span className="hidden text-xs md:inline">{ar ? "بحث" : "Search"}</span>
          </button>
           <button
             type="button"
             className="mb-1 flex h-10 w-10 items-center justify-center rounded-md border-s-2 border-transparent text-muted-foreground transition hover:bg-accent hover:text-foreground md:w-full md:justify-start md:gap-2 md:px-2"
             onClick={() => {
               setShowPreview(true);
               if (!isRunning && !isProcessing) startMutation.mutate();
             }}
             title={ar ? "المعاينة" : "Preview"}
             aria-label={ar ? "المعاينة" : "Preview"}
             data-testid="button-activity-preview"
           >
             <Eye className="h-5 w-5" />
             <span className="hidden text-xs md:inline">{ar ? "المعاينة" : "Preview"}</span>
           </button>
          <button
            type="button"
             className="mb-1 flex h-10 w-10 items-center justify-center rounded-md border-s-2 border-transparent text-muted-foreground transition hover:bg-accent hover:text-foreground md:w-full md:justify-start md:gap-2 md:px-2"
            onClick={() => { setRightPanelOpen(true); setRightPanelTab("github"); }}
            title={ar ? "GitHub" : "Source control"}
             aria-label={ar ? "GitHub" : "Source control"}
            data-testid="button-activity-git"
          >
            <GitBranch className="h-5 w-5" />
             <span className="hidden text-xs md:inline">Git</span>
          </button>
          <button
            type="button"
             className="mb-1 flex h-10 w-10 items-center justify-center rounded-md border-s-2 border-transparent text-muted-foreground transition hover:bg-accent hover:text-foreground md:w-full md:justify-start md:gap-2 md:px-2"
            onClick={() => { setRightPanelOpen(true); setRightPanelTab("env"); }}
            title={ar ? "أسرار المشروع" : "Project secrets"}
             aria-label={ar ? "أسرار المشروع" : "Project secrets"}
            data-testid="button-activity-secrets"
          >
            <KeyRound className="h-5 w-5" />
             <span className="hidden text-xs md:inline">{ar ? "الأسرار" : "Secrets"}</span>
          </button>
          <button
            type="button"
             className="mb-1 flex h-10 w-10 items-center justify-center rounded-md border-s-2 border-transparent text-muted-foreground transition hover:bg-accent hover:text-foreground md:w-full md:justify-start md:gap-2 md:px-2"
            onClick={() => { setRightPanelOpen(true); setRightPanelTab("deploy"); }}
            title={ar ? "النشر" : "Deploy"}
             aria-label={ar ? "النشر" : "Deploy"}
            data-testid="button-activity-deploy"
          >
            <Rocket className="h-5 w-5" />
             <span className="hidden text-xs md:inline">{ar ? "النشر والدومين" : "Deploy & domain"}</span>
          </button>
          <div className="mt-auto">
            <button
              type="button"
               className={`flex h-10 w-10 items-center justify-center rounded-md border-s-2 transition md:w-full md:justify-start md:gap-2 md:px-2 ${logsOpen ? "border-foreground bg-accent text-foreground" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"}`}
               onClick={() => {
                 setLogsPanelTab("shell");
                 setLogsOpen(true);
               }}
               title={ar ? "Shell والكونسول والسجلات" : "Shell & console logs"}
               aria-label={ar ? "Shell والكونسول والسجلات" : "Shell & console logs"}
              data-testid="button-activity-terminal"
            >
              <Terminal className="h-5 w-5" />
               <span className="hidden text-xs md:inline">{ar ? "Shell والكونسول" : "Shell & console"}</span>
            </button>
             <button
               type="button"
               className={`mt-1 flex h-10 w-10 items-center justify-center rounded-md border-s-2 transition md:w-full md:justify-start md:gap-2 md:px-2 ${logsOpen && logsPanelTab === "logs" ? "border-foreground bg-accent text-foreground" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"}`}
               onClick={() => {
                 setLogsPanelTab("logs");
                 setLogsOpen(true);
               }}
               title={ar ? "سجلات التشغيل" : "Runtime logs"}
               aria-label={ar ? "سجلات التشغيل" : "Runtime logs"}
               data-testid="button-activity-logs"
             >
               <ScrollText className="h-5 w-5" />
               <span className="hidden text-xs md:inline">{ar ? "السجلات" : "Logs"}</span>
             </button>
          </div>
        </nav>

        <div style={{ width: leftPanel.size }} className="flex-shrink-0 overflow-hidden border-e border-border bg-card">
          {activityView === "files" ? (
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
          ) : (
            <div className="flex h-full flex-col bg-card">
              <div className="border-b border-border px-3 py-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{ar ? "بحث" : "Search"}</div>
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={ar ? "ابحث في أسماء الملفات" : "Search file names"}
                  className="h-8 border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                  data-testid="input-workspace-search"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {flattenFiles(fileTree || [])
                  .filter((entry) => !searchQuery || entry.path.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((entry) => (
                    <button
                      type="button"
                      key={entry.path}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-start text-xs text-foreground hover:bg-accent"
                      onClick={() => handleFileSelect(entry.path)}
                      dir="ltr"
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{entry.path}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <ResizeHandle direction="horizontal" onMouseDown={leftPanel.onMouseDown} />

        <div className="flex min-w-0 flex-1 flex-col bg-background">
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
                <div className="flex w-1/2 flex-col border-s border-border bg-background">
                <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate font-mono text-[10px] text-muted-foreground">
                    /sandbox/{projectId}/preview/
                  </span>
                   {isRunning && (
                     <Button
                       variant={selectionMode ? "default" : "ghost"}
                       size="sm"
                       className={`h-6 gap-1 px-2 text-[10px] ${selectionMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                       onClick={() => {
                         setSelectedElement(null);
                         setSelectionMode((active) => !active);
                       }}
                       title={ar ? "حدد عنصراً من المعاينة ليعدله الوكيل" : "Select an element for the agent to edit"}
                       data-testid="button-select-preview-element"
                     >
                       <MousePointer2 className="h-3 w-3" />
                       {ar ? "تحديد" : "Select"}
                     </Button>
                   )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-foreground"
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
                    className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => window.open(`/sandbox/${projectId}/preview/`, "_blank")}
                    data-testid="button-external-preview"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
                {isRunning ? (
                  <iframe
                    id="sandbox-preview"
                     ref={previewRef}
                    src={`/sandbox/${projectId}/preview/`}
                    className="flex-1 w-full bg-white"
                    title="Preview"
                     onLoad={installPreviewSelection}
                  />
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-muted text-muted-foreground">
                      <Eye className="h-8 w-8 opacity-30" />
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
              <div style={{ height: logsPanel.size }} className="flex flex-col border-t border-border bg-background">
                <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
                   <div className="flex items-center gap-1">
                     <button
                       type="button"
                       className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold ${logsPanelTab === "shell" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                       onClick={() => setLogsPanelTab("shell")}
                     >
                       <TerminalSquare className="h-3.5 w-3.5" />
                       {ar ? "Shell" : "Shell"}
                     </button>
                     <button
                       type="button"
                       className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold ${logsPanelTab === "logs" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                       onClick={() => setLogsPanelTab("logs")}
                     >
                       <ScrollText className="h-3.5 w-3.5" />
                       {ar ? "السجلات" : "Logs"}
                     </button>
                   </div>
                   <div className="flex items-center gap-1">
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-6 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                       onClick={() => setLogs([])}
                       data-testid="button-clear-logs"
                     >
                       {ar ? "مسح العرض" : "Clear view"}
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-6 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                       onClick={() => setLogsOpen(false)}
                       data-testid="button-close-logs"
                     >
                       {ar ? "إغلاق" : "Close"}
                     </Button>
                   </div>
                </div>
                {logsPanelTab === "shell" && (
                  <form
                    className="flex items-center gap-2 border-b border-border bg-background px-3 py-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (shellCommand.trim() && !shellMutation.isPending) shellMutation.mutate(shellCommand.trim());
                    }}
                  >
                     <span className="font-mono text-xs text-foreground">$</span>
                      <Input
                      value={shellCommand}
                      onChange={(event) => setShellCommand(event.target.value)}
                      placeholder={ar ? "أمر آمن مثل npm install أو git status" : "Safe command, e.g. npm install or git status"}
                         className="h-8 flex-1 border-border bg-card font-mono text-xs text-foreground placeholder:text-muted-foreground"
                      dir="ltr"
                      disabled={shellMutation.isPending}
                      data-testid="input-sandbox-shell-command"
                    />
                    <Button
                      type="submit"
                      size="sm"
                         className="h-8 bg-foreground px-3 text-xs text-background hover:bg-foreground/80"
                      disabled={!shellCommand.trim() || shellMutation.isPending}
                      data-testid="button-run-sandbox-shell-command"
                    >
                      {shellMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                  </form>
                )}
                  <div className="flex-1 overflow-y-auto bg-background p-3 font-mono text-xs text-foreground">
                  {logs.length === 0 ? (
                    <span className="text-muted-foreground">{ar ? "لا توجد سجلات بعد..." : "No logs yet..."}</span>
                  ) : (
                    logs.map((log, i) => (
                      <div
                        key={i}
                         className="text-foreground"
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
            <div style={{ width: rightPanel.size }} className="flex flex-shrink-0 flex-col border-s border-border bg-background">
              <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex flex-col h-full">
                <TabsList className="h-10 w-full rounded-none border-b border-border bg-background p-0">
                  <TabsTrigger value="ai" className="h-10 flex-1 rounded-none text-[10px] text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground" data-testid="tab-trigger-ai">
                    <Sparkles className="me-1 h-3.5 w-3.5" />
                    AI
                  </TabsTrigger>
                  <TabsTrigger value="env" className="h-10 flex-1 rounded-none text-[10px] text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground" data-testid="tab-trigger-env">
                    <KeyRound className="me-1 h-3.5 w-3.5" />
                    {ar ? "أسرار" : "Secrets"}
                  </TabsTrigger>
                  <TabsTrigger value="github" className="h-10 flex-1 rounded-none text-[10px] text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground" data-testid="tab-trigger-github">
                    <SiGithub className="me-1 h-3.5 w-3.5" />
                    Git
                  </TabsTrigger>
                  <TabsTrigger value="deploy" className="h-10 flex-1 rounded-none text-[10px] text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground" data-testid="tab-trigger-deploy">
                    <Rocket className="me-1 h-3.5 w-3.5" />
                    {ar ? "نشر" : "Deploy"}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="ai" className="m-0 flex-1 overflow-hidden">
                  <AIPanel
                    projectId={projectId}
                    activeFile={activeTab}
                    selectedElement={selectedElement}
                    onApplyToEditor={handleApplyToEditor}
                    onCreateFile={handleCreateFileFromAI}
                  />
                </TabsContent>
                <TabsContent value="env" className="m-0 flex-1 overflow-hidden">
                  <EnvVarsPanel projectId={projectId} />
                </TabsContent>
                <TabsContent value="github" className="m-0 flex-1 overflow-hidden">
                  <GitHubPanel projectId={projectId} adminOrderId={adminOrderId} />
                </TabsContent>
                <TabsContent value="deploy" className="m-0 flex-1 overflow-hidden">
                  <DeploymentPanel projectId={projectId} onDownload={handleDownload} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}

        <div className="pointer-events-none absolute bottom-0 start-12 end-0 z-10 flex h-6 items-center justify-between border-t border-border bg-card px-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-foreground">
              <Check className="h-3 w-3" />
              {ar ? "تم الحفظ تلقائياً" : "Auto-saved"}
            </span>
            <span dir="ltr">{project?.runtime || "node"} · {project?.githubBranch || "main"}</span>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span>{ar ? "الأوامر الآمنة مفعلة" : "Safe commands enabled"}</span>
            <span>UTF-8</span>
            <span>Ln 1, Col 1</span>
          </div>
        </div>
      </div>

      {commandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={() => setCommandPaletteOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={ar ? "أوامر المشروع" : "Workspace commands"}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Command className="h-4 w-4 text-foreground" />
              <input
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                placeholder={ar ? "ابحث عن ملف أو إجراء..." : "Search files or actions..."}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setCommandPaletteOpen(false);
                }}
                data-testid="input-command-palette"
              />
              <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
            </div>
            <div className="space-y-1 p-2">
              {[
                { label: ar ? "تشغيل المشروع" : "Run project", icon: Play, action: () => { startMutation.mutate(); setCommandPaletteOpen(false); } },
                { label: ar ? "إعادة تشغيل المشروع" : "Restart project", icon: RotateCcw, action: () => { restartMutation.mutate(); setCommandPaletteOpen(false); } },
                { label: ar ? "بناء المشروع" : "Build project", icon: Hammer, action: () => { buildMutation.mutate(); setCommandPaletteOpen(false); } },
                { label: ar ? "تحميل ملفات المشروع" : "Download project", icon: Download, action: () => { handleDownload(); setCommandPaletteOpen(false); } },
                { label: ar ? "فتح المعاينة" : "Open preview", icon: Eye, action: () => { setShowPreview(true); setCommandPaletteOpen(false); } },
                { label: ar ? "فتح الأسرار" : "Open project secrets", icon: KeyRound, action: () => { setRightPanelOpen(true); setRightPanelTab("env"); setCommandPaletteOpen(false); } },
                { label: ar ? "فتح النشر" : "Open deployment", icon: Rocket, action: () => { setRightPanelOpen(true); setRightPanelTab("deploy"); setCommandPaletteOpen(false); } },
                 { label: ar ? "فتح Shell والكونسول" : "Open Shell & console", icon: Terminal, action: () => { setLogsPanelTab("shell"); setLogsOpen(true); setCommandPaletteOpen(false); } },
                 { label: ar ? "فتح السجلات" : "Open logs", icon: ScrollText, action: () => { setLogsPanelTab("logs"); setLogsOpen(true); setCommandPaletteOpen(false); } },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.label}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-xs text-foreground transition hover:bg-accent"
                    onPointerDown={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={item.action}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
