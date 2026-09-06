import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Eye, EyeOff, Loader2, KeyRound, Pencil, Check, X, ShieldCheck } from "lucide-react";

interface EnvVar {
  id: string;
  key: string;
  value: string;
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

  const { data: envVars, isLoading } = useQuery<EnvVar[]>({
    queryKey: ["/api/sandbox/projects", projectId, "env"],
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
    <div className="flex h-full flex-col gap-3 bg-[#101318] p-4 text-[#e6edf3]">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
          <KeyRound className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">{ar ? "أسرار المشروع" : "Project secrets"}</div>
          <div className="text-[10px] text-[#8b949e]">{ar ? "قيم خاصة لا تظهر في الكود أو السجلات" : "Private values kept outside your source code"}</div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-[10px] leading-4 text-emerald-200">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{ar ? "يتم حقن الأسرار عند التشغيل فقط ولا تُحفظ داخل ملفات المشروع." : "Secrets are injected at runtime and are never written into project files."}</span>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={ar ? "المفتاح" : "KEY"}
          value={newKey}
          onChange={(e) => setNewKey(e.target.value.toUpperCase())}
          className="h-8 border-[#30363d] bg-[#0d1117] text-xs font-mono text-white placeholder:text-[#6e7681]"
          data-testid="input-env-key"
        />
        <Input
          placeholder={ar ? "القيمة" : "VALUE"}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="h-8 border-[#30363d] bg-[#0d1117] text-xs text-white placeholder:text-[#6e7681]"
          type="password"
          data-testid="input-env-value"
        />
        <Button
          size="sm"
           className="h-8 bg-orange-500 px-3 text-black hover:bg-orange-400"
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
              className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#171b21] px-2.5 py-2 text-xs"
              data-testid={`env-var-${v.key}`}
            >
              <span className="font-mono font-medium min-w-0 truncate flex-shrink-0">{v.key}</span>
              <span className="text-muted-foreground">=</span>
              {editingKey === v.key ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                     className="h-7 min-w-0 flex-1 border-[#30363d] bg-[#0d1117] text-xs font-mono text-white"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(v.key);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    data-testid={`input-edit-env-${v.key}`}
                  />
                  <button
                     className="rounded p-0.5 text-emerald-400 hover:bg-[#21262d]"
                    onClick={() => saveEdit(v.key)}
                    disabled={updateMutation.isPending}
                    data-testid={`button-save-env-${v.key}`}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                     className="rounded p-0.5 text-[#8b949e] hover:bg-[#21262d] hover:text-white"
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
                     className="rounded p-0.5 text-[#8b949e] hover:bg-[#21262d] hover:text-white"
                    onClick={() => startEdit(v)}
                    data-testid={`button-edit-env-${v.key}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button className="p-0.5 hover:bg-accent rounded" onClick={() => toggleVisible(v.key)} data-testid={`button-toggle-env-${v.key}`}>
                    {visibleKeys.has(v.key) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                     className="rounded p-0.5 text-red-300 hover:bg-[#21262d]"
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
