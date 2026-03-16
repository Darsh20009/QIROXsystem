import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Code2, Globe, Server, FileCode, Trash2, Play, Square,
  MoreVertical, Loader2, FolderOpen, Pencil, type LucideIcon
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SandboxProject {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  template: string;
  runtime: string;
  isRunning: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TemplateMeta {
  icon: LucideIcon;
  label: string;
  labelAr: string;
  color: string;
}

const TEMPLATE_META: Record<string, TemplateMeta> = {
  blank: { icon: Server, label: "Node.js API", labelAr: "Node.js API", color: "bg-green-600" },
  express: { icon: Server, label: "Express", labelAr: "Express", color: "bg-gray-600" },
  static: { icon: Globe, label: "HTML/CSS/JS", labelAr: "HTML/CSS/JS", color: "bg-blue-600" },
  react: { icon: Code2, label: "React", labelAr: "React", color: "bg-cyan-600" },
  vue: { icon: Code2, label: "Vue", labelAr: "Vue", color: "bg-emerald-600" },
  nextjs: { icon: FileCode, label: "Next.js", labelAr: "Next.js", color: "bg-black" },
};

export default function SystemBuilder() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTemplate, setNewTemplate] = useState("blank");
  const [renameDialog, setRenameDialog] = useState<{ id: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState("");

  const { data: projects, isLoading } = useQuery<SandboxProject[]>({
    queryKey: ["/api/sandbox/projects"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sandbox/projects", {
        name: newName,
        description: newDesc,
        template: newTemplate,
      });
      return res.json();
    },
    onSuccess: (data: SandboxProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects"] });
      setDialogOpen(false);
      setNewName("");
      setNewDesc("");
      setNewTemplate("blank");
      toast({ title: ar ? "تم إنشاء المشروع" : "Project created" });
      navigate(`/employee/system-builder/${data.id}`);
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiRequest("PATCH", `/api/sandbox/projects/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects"] });
      setRenameDialog(null);
      toast({ title: ar ? "تم التعديل" : "Renamed" });
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sandbox/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects"] });
      toast({ title: ar ? "تم حذف المشروع" : "Project deleted" });
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background p-6" dir={ar ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              {ar ? "صانع الأنظمة" : "System Builder"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {ar ? "أنشئ وأدر مشاريعك البرمجية" : "Create and manage your coding projects"}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-project">
                <Plus className="w-4 h-4 me-2" />
                {ar ? "مشروع جديد" : "New Project"}
              </Button>
            </DialogTrigger>
            <DialogContent dir={ar ? "rtl" : "ltr"}>
              <DialogHeader>
                <DialogTitle>{ar ? "إنشاء مشروع جديد" : "Create New Project"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder={ar ? "اسم المشروع" : "Project name"}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  data-testid="input-project-name"
                />
                <Textarea
                  placeholder={ar ? "وصف المشروع (اختياري)" : "Description (optional)"}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  data-testid="input-project-description"
                />
                <Select value={newTemplate} onValueChange={setNewTemplate}>
                  <SelectTrigger data-testid="select-template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">HTML/CSS/JS</SelectItem>
                    <SelectItem value="blank">Node.js API</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue</SelectItem>
                    <SelectItem value="nextjs">Next.js</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  onClick={() => createMutation.mutate()}
                  disabled={!newName.trim() || createMutation.isPending}
                  data-testid="button-create-project"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                  {ar ? "إنشاء" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !projects?.length ? (
          <div className="text-center py-20">
            <FileCode className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">
              {ar ? "لا توجد مشاريع بعد" : "No projects yet"}
            </p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              {ar ? "أنشئ مشروعك الأول للبدء" : "Create your first project to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const meta = TEMPLATE_META[p.template] || TEMPLATE_META.blank;
              const Icon = meta.icon;
              return (
                <Card
                  key={p.id}
                  className="group cursor-pointer hover:border-primary/50 transition-colors"
                  data-testid={`card-project-${p.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="flex items-center gap-3 flex-1 min-w-0"
                        onClick={() => navigate(`/employee/system-builder/${p.id}`)}
                      >
                        <div className={`w-10 h-10 rounded-lg ${meta.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{p.name}</h3>
                          <p className="text-xs text-muted-foreground">{meta.label}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-menu-${p.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={ar ? "start" : "end"}>
                          <DropdownMenuItem
                            onClick={() => navigate(`/employee/system-builder/${p.id}`)}
                            data-testid={`button-open-${p.id}`}
                          >
                            <FolderOpen className="w-4 h-4 me-2" />
                            {ar ? "فتح" : "Open"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setRenameDialog({ id: p.id, name: p.name });
                              setRenameName(p.name);
                            }}
                            data-testid={`button-rename-${p.id}`}
                          >
                            <Pencil className="w-4 h-4 me-2" />
                            {ar ? "إعادة تسمية" : "Rename"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(ar ? "هل تريد حذف هذا المشروع؟" : "Delete this project?")) {
                                deleteMutation.mutate(p.id);
                              }
                            }}
                            data-testid={`button-delete-${p.id}`}
                          >
                            <Trash2 className="w-4 h-4 me-2" />
                            {ar ? "حذف" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant={p.isRunning ? "default" : "secondary"} className="text-xs">
                        {p.isRunning ? (
                          <><Play className="w-3 h-3 me-1" /> {ar ? "يعمل" : "Running"}</>
                        ) : (
                          <><Square className="w-3 h-3 me-1" /> {ar ? "متوقف" : "Stopped"}</>
                        )}
                      </Badge>
                      {p.updatedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.updatedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!renameDialog} onOpenChange={(open) => { if (!open) setRenameDialog(null); }}>
        <DialogContent dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{ar ? "إعادة تسمية المشروع" : "Rename Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              data-testid="input-rename-project"
            />
            <Button
              className="w-full"
              onClick={() => {
                if (renameDialog && renameName.trim()) {
                  renameMutation.mutate({ id: renameDialog.id, name: renameName.trim() });
                }
              }}
              disabled={!renameName.trim() || renameMutation.isPending}
              data-testid="button-rename-submit"
            >
              {renameMutation.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {ar ? "حفظ" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
