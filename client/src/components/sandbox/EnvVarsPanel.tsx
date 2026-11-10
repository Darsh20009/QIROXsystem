import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Eye, EyeOff, Loader2, KeyRound, Pencil, Check, X, Copy, ShieldCheck, ScanSearch, WandSparkles, LockKeyhole } from "lucide-react";

interface EnvVar {
  id: string;
  key: string;
  value: string;
}

interface SecretSuggestion {
  key: string;
  type: "local" | "external" | "config";
  files: string[];
  existing: boolean;
  canGenerate: boolean;
}

interface EnvVarsPanelProps {
  projectId: string;
}

export function EnvVarsPanel({ projectId }: EnvVarsPanelProps) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: ar ? `تم نسخ ${label}` : `${label} copied` });
    } catch {
      toast({ title: ar ? "تعذر النسخ" : "Copy failed", variant: "destructive" });
    }
  };

  const { data: envVars, isLoading } = useQuery<EnvVar[]>({
    queryKey: ["/api/sandbox/projects", projectId, "env"],
  });
  const { data: inspection, isFetching: isInspecting, refetch: inspectProject } = useQuery<{ suggestions: SecretSuggestion[] }>({
    queryKey: ["/api/sandbox/projects", projectId, "env", "inspect"],
    enabled: false,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/sandbox/projects/${projectId}/env`, {
        key: newKey,
        value: newValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "env"] });
      setNewKey("");
      setNewValue("");
      toast({ title: ar ? "تم الحفظ" : "Saved" });
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest("POST", `/api/sandbox/projects/${projectId}/env`, {
        key,
        value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "env"] });
      setEditingKey(null);
      toast({ title: ar ? "تم التعديل" : "Updated" });
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      await apiRequest("DELETE", `/api/sandbox/projects/${projectId}/env/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "env"] });
      toast({ title: ar ? "تم الحذف" : "Deleted" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (key: string) => {
      await apiRequest("POST", `/api/sandbox/projects/${projectId}/env/generate`, { key });
    },
    onSuccess: (_data, key) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "env"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects", projectId, "env", "inspect"] });
      toast({ title: ar ? `تم توليد ${key}` : `${key} generated` });
    },
    onError: (err: Error) => toast({ title: ar ? "تعذر التوليد" : "Could not generate secret", description: err.message, variant: "destructive" }),
  });

  const addDetectedKey = (key: string) => {
    setNewKey(key);
    setNewValue("");
    setShowSuggestions(false);
    toast({ title: ar ? "تم تجهيز اسم المفتاح" : "Key name ready", description: ar ? "أدخل قيمة المزود في الحقل السري." : "Enter the provider value in the secret field." });
  };

  const toggleVisible = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const startEdit = (v: EnvVar) => {
    setEditingKey(v.key);
    setEditValue(v.value);
    setVisibleKeys((prev) => new Set(prev).add(v.key));
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const saveEdit = (key: string) => {
    updateMutation.mutate({ key, value: editValue });
  };

  return (
    <div className="flex h-full flex-col gap-3 bg-background p-4 text-foreground">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
          <KeyRound className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">{ar ? "أسرار المشروع" : "Project secrets"}</div>
          <div className="text-[10px] text-muted-foreground">{ar ? "قيم خاصة لا تظهر في الكود أو السجلات" : "Private values kept outside your source code"}</div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[10px] leading-4 text-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{ar ? "يتم حقن الأسرار عند التشغيل فقط ولا تُحفظ داخل ملفات المشروع." : "Secrets are injected at runtime and are never written into project files."}</span>
      </div>

      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <div className="flex items-start gap-2">
          <ScanSearch className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-foreground">{ar ? "اكتشاف تجهيزات المشروع" : "Detect project requirements"}</div>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              {ar ? "يفحص أسماء المتغيرات فقط من الكود والإعدادات، بدون قراءة قيم الأسرار." : "Scan variable names from code and config without reading secret values."}
            </p>
          </div>
          <Button
            variant="ghost"
            className="h-7 shrink-0 px-2 text-[10px] text-foreground hover:bg-accent"
            onClick={() => { setShowSuggestions(true); inspectProject(); }}
            disabled={isInspecting}
            data-testid="button-scan-project-secrets"
          >
            {isInspecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />}
            <span className="ms-1">{ar ? "فحص" : "Scan"}</span>
          </Button>
        </div>
        {showSuggestions && (
          <div className="mt-3 space-y-1.5 border-t border-white/[0.07] pt-3">
            {!inspection && isInspecting ? (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{ar ? "يتم فحص المشروع..." : "Inspecting project..."}</div>
            ) : inspection?.suggestions?.length ? (
              inspection.suggestions.map((suggestion) => (
                <div key={suggestion.key} className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5">
                  {suggestion.canGenerate ? <WandSparkles className="h-3 w-3 text-foreground" /> : suggestion.type === "external" ? <LockKeyhole className="h-3 w-3 text-muted-foreground" /> : <KeyRound className="h-3 w-3 text-muted-foreground" />}
                  <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-foreground" dir="ltr">{suggestion.key}</span>
                  {suggestion.existing ? (
                    <span className="text-[9px] text-foreground">{ar ? "مضاف" : "Added"}</span>
                  ) : suggestion.canGenerate ? (
                    <Button
                      variant="ghost"
                      className="h-6 px-1.5 text-[9px] text-foreground hover:bg-accent"
                      onClick={() => generateMutation.mutate(suggestion.key)}
                      disabled={generateMutation.isPending}
                      data-testid={`button-generate-secret-${suggestion.key}`}
                    >
                      {ar ? "توليد" : "Generate"}
                    </Button>
                  ) : suggestion.type === "external" ? (
                    <Button
                      variant="ghost"
                      className="h-6 px-1.5 text-[9px] text-foreground hover:bg-accent"
                      onClick={() => addDetectedKey(suggestion.key)}
                      data-testid={`button-add-detected-secret-${suggestion.key}`}
                    >
                      {ar ? "إضافة" : "Add"}
                    </Button>
                  ) : (
                    <span className="text-[9px] text-muted-foreground">{ar ? "إعداد" : "Config"}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-[10px] text-muted-foreground">{ar ? "لم يتم العثور على متغيرات مطلوبة." : "No environment references found."}</div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={ar ? "المفتاح" : "KEY"}
          value={newKey}
          onChange={(e) => setNewKey(e.target.value.toUpperCase())}
          className="h-8 border-border bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground"
          data-testid="input-env-key"
        />
        <Input
          placeholder={ar ? "القيمة" : "VALUE"}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="h-8 border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
          type="password"
          data-testid="input-env-value"
        />
        <Button
          size="sm"
           className="h-8 bg-foreground px-3 text-background hover:bg-foreground/80"
          onClick={() => addMutation.mutate()}
          disabled={!newKey.trim() || addMutation.isPending}
          data-testid="button-add-env"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !envVars?.length ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {ar ? "لا توجد متغيرات" : "No variables yet"}
          </p>
        ) : (
          envVars.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-2 text-xs"
              dir="ltr"
              data-testid={`env-var-${v.key}`}
            >
              <span className="font-mono font-medium min-w-0 truncate flex-shrink-0">{v.key}</span>
              <button
                className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => copyText(v.key, ar ? "المفتاح" : "Key")}
                title={ar ? "نسخ المفتاح" : "Copy key"}
                type="button"
              >
                <Copy className="w-3 h-3" />
              </button>
              <span className="text-muted-foreground">=</span>
              {editingKey === v.key ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                     className="h-7 min-w-0 flex-1 border-border bg-background text-xs font-mono text-foreground"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(v.key);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    data-testid={`input-edit-env-${v.key}`}
                  />
                  <button
                     className="rounded p-0.5 text-foreground hover:bg-accent"
                    onClick={() => saveEdit(v.key)}
                    disabled={updateMutation.isPending}
                    data-testid={`button-save-env-${v.key}`}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                     className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={cancelEdit}
                    data-testid={`button-cancel-env-${v.key}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="font-mono flex-1 min-w-0 truncate">
                    {visibleKeys.has(v.key) ? v.value : "••••••••"}
                  </span>
                  <button
                    className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => copyText(v.value, ar ? "القيمة" : "Value")}
                    title={ar ? "نسخ القيمة" : "Copy value"}
                    type="button"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                     className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => startEdit(v)}
                    data-testid={`button-edit-env-${v.key}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button className="p-0.5 hover:bg-accent rounded" onClick={() => toggleVisible(v.key)} data-testid={`button-toggle-env-${v.key}`}>
                    {visibleKeys.has(v.key) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                     className="rounded p-0.5 text-muted-foreground hover:bg-accent"
                    onClick={() => {
                      if (confirm(ar ? `حذف ${v.key}؟` : `Delete ${v.key}?`)) deleteMutation.mutate(v.key);
                    }}
                    data-testid={`button-delete-env-${v.key}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
