import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Copy, FilePlus, FileEdit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIPanelProps {
  projectId: string;
  activeFile: string | null;
  onApplyToEditor: (code: string) => void;
  onCreateFile: (path: string, content: string) => void;
}

export function AIPanel({ projectId, activeFile, onApplyToEditor, onCreateFile }: AIPanelProps) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("create");
  const [result, setResult] = useState<{ code?: string; explanation?: string; filesCreated?: number } | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sandbox/${projectId}/ai/generate`, {
        prompt,
        targetFile: activeFile || undefined,
        mode,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      setResult(data);
      if (data.mode === "full-project") {
        toast({ title: ar ? `تم إنشاء ${data.filesCreated} ملف` : `Created ${data.filesCreated} files` });
      }
    },
    onError: (err: Error) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{ar ? "مساعد الذكاء الاصطناعي" : "AI Assistant"}</span>
      </div>

      <Select value={mode} onValueChange={setMode}>
        <SelectTrigger className="h-8 text-xs" data-testid="select-ai-mode">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="create">{ar ? "إنشاء ملف" : "Generate File"}</SelectItem>
          <SelectItem value="edit">{ar ? "تعديل الملف الحالي" : "Edit Current File"}</SelectItem>
          <SelectItem value="explain">{ar ? "شرح الكود" : "Explain Code"}</SelectItem>
          <SelectItem value="full-project">{ar ? "مشروع كامل" : "Full Project"}</SelectItem>
        </SelectContent>
      </Select>

      {activeFile && (mode === "edit" || mode === "explain") && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
          {ar ? "الملف:" : "File:"} <span className="font-mono">{activeFile}</span>
        </div>
      )}

      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={
          mode === "full-project"
            ? (ar ? "صف المشروع الذي تريد إنشاءه..." : "Describe the project you want to build...")
            : (ar ? "اكتب الأمر هنا..." : "Type your prompt here...")
        }
        className="min-h-[80px] text-xs resize-none"
        data-testid="input-ai-prompt"
      />

      <Button
        size="sm"
        onClick={() => generateMutation.mutate()}
        disabled={!prompt.trim() || generateMutation.isPending}
        data-testid="button-ai-generate"
      >
        {generateMutation.isPending ? (
          <Loader2 className="w-4 h-4 me-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 me-2" />
        )}
        {ar ? "توليد" : "Generate"}
      </Button>

      {result && (
        <div className="flex-1 overflow-y-auto border border-border rounded bg-muted/20">
          {result.explanation ? (
            <div className="p-3 text-xs whitespace-pre-wrap">{result.explanation}</div>
          ) : result.code ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-1 p-2 border-b border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    onApplyToEditor(result.code!);
                    toast({ title: ar ? "تم التطبيق" : "Applied to editor" });
                  }}
                  data-testid="button-apply-to-editor"
                >
                  <FileEdit className="w-3 h-3 me-1" />
                  {ar ? "تطبيق" : "Apply"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    const name = window.prompt(ar ? "اسم الملف:" : "File name:");
                    if (name) onCreateFile(name, result.code!);
                  }}
                  data-testid="button-create-from-ai"
                >
                  <FilePlus className="w-3 h-3 me-1" />
                  {ar ? "ملف جديد" : "New File"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(result.code!);
                    toast({ title: ar ? "تم النسخ" : "Copied" });
                  }}
                  data-testid="button-copy-ai-code"
                >
                  <Copy className="w-3 h-3 me-1" />
                  {ar ? "نسخ" : "Copy"}
                </Button>
              </div>
              <pre className="p-3 text-xs overflow-x-auto font-mono">{result.code}</pre>
            </div>
          ) : result.filesCreated ? (
            <div className="p-3 text-xs text-center text-green-500">
              {ar ? `تم إنشاء ${result.filesCreated} ملف بنجاح` : `Successfully created ${result.filesCreated} files`}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
