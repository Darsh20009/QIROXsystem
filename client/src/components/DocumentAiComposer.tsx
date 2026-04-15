import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Loader2, Copy, FileText, RefreshCw, Check } from "lucide-react";

type DocumentAiComposerProps = {
  documentType: "contract" | "invoice";
  L: boolean;
  initialText?: string;
  defaultContext?: string;
  onUseText: (text: string) => void;
};

export function DocumentAiComposer({ documentType, L, initialText = "", defaultContext = "", onUseText }: DocumentAiComposerProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"create" | "improve">(initialText ? "improve" : "create");
  const [text, setText] = useState(initialText);
  const [instructions, setInstructions] = useState(defaultContext);
  const [partyA, setPartyA] = useState("منصة كيروكس التقنية");
  const [partyB, setPartyB] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const title = documentType === "contract"
    ? (L ? "مساعد صياغة العقود" : "Contract AI Assistant")
    : (L ? "مساعد صياغة الفواتير" : "Invoice AI Assistant");

  const generate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/document-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          documentType,
          mode,
          text,
          instructions,
          partyA,
          partyB,
          amount,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || (L ? "فشل توليد النص" : "Generation failed"));
      setResult(data.text || "");
    } catch (error: any) {
      toast({ title: L ? "تعذر تشغيل الذكاء الاصطناعي" : "AI failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const finalText = result || text;

  return (
    <div className="space-y-4" data-testid={`ai-composer-${documentType}`}>
      <div className="rounded-2xl border border-violet-200 bg-violet-50/70 dark:bg-violet-950/20 dark:border-violet-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-violet-900 dark:text-violet-100">{title}</h3>
            <p className="text-xs text-violet-700/70 dark:text-violet-200/60">
              {L ? "اكتب نصاً لتعديله أو اطلب إنشاء مستند من الصفر." : "Paste text to improve or create a document from scratch."}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            size="sm"
            variant={mode === "create" ? "default" : "outline"}
            onClick={() => setMode("create")}
            className={mode === "create" ? "bg-violet-600 hover:bg-violet-700 text-white" : "border-violet-200 text-violet-700"}
            data-testid={`button-ai-mode-create-${documentType}`}
          >
            {L ? "إنشاء من الصفر" : "Create"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "improve" ? "default" : "outline"}
            onClick={() => setMode("improve")}
            className={mode === "improve" ? "bg-violet-600 hover:bg-violet-700 text-white" : "border-violet-200 text-violet-700"}
            data-testid={`button-ai-mode-improve-${documentType}`}
          >
            {L ? "تعديل نص موجود" : "Improve"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <Label className="text-xs text-violet-900/70 dark:text-violet-100/70">{L ? "الطرف الأول" : "First party"}</Label>
            <Input value={partyA} onChange={e => setPartyA(e.target.value)} className="h-9 bg-white dark:bg-gray-950 border-violet-200" data-testid={`input-ai-party-a-${documentType}`} />
          </div>
          <div>
            <Label className="text-xs text-violet-900/70 dark:text-violet-100/70">{L ? "الطرف الثاني / العميل" : "Second party / client"}</Label>
            <Input value={partyB} onChange={e => setPartyB(e.target.value)} placeholder={L ? "اسم العميل أو الشركة" : "Client/company name"} className="h-9 bg-white dark:bg-gray-950 border-violet-200" data-testid={`input-ai-party-b-${documentType}`} />
          </div>
          <div>
            <Label className="text-xs text-violet-900/70 dark:text-violet-100/70">{L ? "المبلغ" : "Amount"}</Label>
            <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder={L ? "مثال: 5000 ريال" : "e.g. 5000 SAR"} className="h-9 bg-white dark:bg-gray-950 border-violet-200" data-testid={`input-ai-amount-${documentType}`} />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-violet-900/70 dark:text-violet-100/70">{L ? "تعليمات للذكاء الاصطناعي" : "Instructions"}</Label>
            <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={3} placeholder={L ? "مثال: اجعله عقد سرية وعدم منافسة، أضف مدة 12 شهر..." : "Example: make it an NDA, add 12 months duration..."} className="bg-white dark:bg-gray-950 border-violet-200 resize-none" data-testid={`textarea-ai-instructions-${documentType}`} />
          </div>
          {mode === "improve" && (
            <div>
              <Label className="text-xs text-violet-900/70 dark:text-violet-100/70">{L ? "النص الحالي" : "Current text"}</Label>
              <Textarea value={text} onChange={e => setText(e.target.value)} rows={6} placeholder={L ? "الصق نص العقد أو الفاتورة هنا..." : "Paste document text here..."} className="bg-white dark:bg-gray-950 border-violet-200" data-testid={`textarea-ai-source-${documentType}`} />
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={generate}
          disabled={loading || (mode === "improve" && !text.trim())}
          className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white gap-2"
          data-testid={`button-ai-generate-${documentType}`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {mode === "create" ? (L ? "إنشاء المستند" : "Create document") : (L ? "تحسين النص" : "Improve text")}
        </Button>
      </div>

      {finalText && (
        <div className="space-y-3">
          <div className="bg-[#f7f3ea] dark:bg-[#18140e] border border-[#d6c7aa] rounded-2xl p-4 shadow-inner" data-testid={`preview-ai-frame-${documentType}`}>
            <div className="bg-white dark:bg-[#0f1115] min-h-[420px] border border-[#1f2937]/20 dark:border-white/10 shadow-xl rounded-sm mx-auto max-w-2xl p-8 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-2 bg-black" />
              <div className="absolute inset-x-8 top-6 border-t border-black/20" />
              <div className="text-center mb-7">
                <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] text-black/40 dark:text-white/40 uppercase">
                  <FileText className="w-3.5 h-3.5" /> QIROX
                </div>
                <h4 className="mt-3 text-lg font-black text-black dark:text-white">
                  {documentType === "contract" ? (L ? "إطار العقد الرسمي" : "Official contract frame") : (L ? "إطار الفاتورة الرسمي" : "Official invoice frame")}
                </h4>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-8 text-black/80 dark:text-white/80 text-right" dir="rtl" data-testid={`text-ai-result-${documentType}`}>{finalText}</pre>
              {documentType === "contract" && (
                <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t border-black/10 text-sm text-black/70 dark:text-white/70">
                  <div className="space-y-8">
                    <p className="font-bold">الطرف الأول</p>
                    <div className="border-t border-black/30 pt-2">التوقيع</div>
                  </div>
                  <div className="space-y-8">
                    <p className="font-bold">الطرف الثاني</p>
                    <div className="border-t border-black/30 pt-2">التوقيع</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="outline" onClick={() => { navigator.clipboard.writeText(finalText); toast({ title: L ? "تم نسخ النص" : "Copied" }); }} className="gap-2" data-testid={`button-copy-ai-${documentType}`}>
              <Copy className="w-4 h-4" /> {L ? "نسخ النص" : "Copy"}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setResult(""); setText(""); }} className="gap-2" data-testid={`button-reset-ai-${documentType}`}>
              <RefreshCw className="w-4 h-4" /> {L ? "بدء جديد" : "Reset"}
            </Button>
            <Button type="button" onClick={() => onUseText(finalText)} className="gap-2 bg-black text-white hover:bg-black/80" data-testid={`button-use-ai-${documentType}`}>
              <Check className="w-4 h-4" /> {L ? "استخدام هذا النص" : "Use this text"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}