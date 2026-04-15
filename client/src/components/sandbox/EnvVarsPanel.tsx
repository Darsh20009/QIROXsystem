import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Eye, EyeOff, Loader2, Settings, Pencil, Check, X } from "lucide-react";

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
    <div className="flex flex-col h-full p-3 gap-3">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{ar ? "متغيرات البيئة" : "Environment Variables"}</span>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
        {ar ? "التغييرات تسري عند إعادة تشغيل المشروع" : "Changes take effect on next project start"}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={ar ? "المفتاح" : "KEY"}
          value={newKey}
          onChange={(e) => setNewKey(e.target.value.toUpperCase())}
          className="h-7 text-xs font-mono"
          data-testid="input-env-key"
        />
        <Input
          placeholder={ar ? "القيمة" : "VALUE"}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="h-7 text-xs"
          type="password"
          data-testid="input-env-value"
        />
        <Button
          size="sm"
          className="h-7 px-2"
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
              className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/30 text-xs"
              data-testid={`env-var-${v.key}`}
            >
              <span className="font-mono font-medium min-w-0 truncate flex-shrink-0">{v.key}</span>
              <span className="text-muted-foreground">=</span>
              {editingKey === v.key ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-6 text-xs font-mono flex-1 min-w-0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(v.key);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    data-testid={`input-edit-env-${v.key}`}
                  />
                  <button
                    className="p-0.5 hover:bg-accent rounded text-green-500"
                    onClick={() => saveEdit(v.key)}
                    disabled={updateMutation.isPending}
                    data-testid={`button-save-env-${v.key}`}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    className="p-0.5 hover:bg-accent rounded"
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
                    className="p-0.5 hover:bg-accent rounded"
                    onClick={() => startEdit(v)}
                    data-testid={`button-edit-env-${v.key}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button className="p-0.5 hover:bg-accent rounded" onClick={() => toggleVisible(v.key)} data-testid={`button-toggle-env-${v.key}`}>
                    {visibleKeys.has(v.key) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                    className="p-0.5 hover:bg-accent rounded text-destructive"
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
