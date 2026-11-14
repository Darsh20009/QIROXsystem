import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { AudioLines, Download, FileAudio, FileText, Loader2, Upload, Video } from "lucide-react";

type Action = "transcribe" | "extract";

const MAX_FILE_BYTES = 100 * 1024 * 1024;

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AudioTranscriptionPanel() {
  const { lang, dir } = useI18n();
  const isArabic = lang === "ar";
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [action, setAction] = useState<Action>("transcribe");
  const [language, setLanguage] = useState<"auto" | "ar" | "en">("auto");
  const [transcript, setTranscript] = useState("");
  const [vocabulary, setVocabulary] = useState("");
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState("");

  const isVideo = file?.type.startsWith("video/") || /\.(mp4|mov|mkv|avi)$/i.test(file?.name || "");

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("action", action);
      body.append("language", language);
      body.append("prompt", vocabulary.slice(0, 1000));
      const response = await fetch("/api/tools/media-process", { method: "POST", body });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || (isArabic ? "تعذر معالجة الملف" : "Could not process this file"));
      }

      if (action === "extract") {
        const audioBlob = await response.blob();
        const filename = file.name.replace(/\.[^.]+$/, "") || "audio";
        saveBlob(audioBlob, `${filename}-audio.mp3`);
        toast({ title: isArabic ? "تم استخراج الصوت وتنزيله" : "Audio extracted and downloaded" });
      } else {
        const data = await response.json();
        setTranscript(data.text || "");
        if (!data.text) throw new Error(isArabic ? "لم يتم العثور على كلام واضح في الملف" : "No clear speech was found in this file");
        toast({ title: isArabic ? "اكتمل تفريغ التسجيل" : "Transcription complete" });
      }
    } catch (cause: any) {
      const message = cause?.message || (isArabic ? "حدث خطأ أثناء المعالجة" : "Processing failed");
      setError(message);
      toast({ title: message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    if (!transcript.trim()) return;
    setPdfBusy(true);
    try {
      const response = await fetch("/api/tools/transcription-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript, language }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || (isArabic ? "تعذر إنشاء PDF" : "Could not create the PDF"));
      }
      saveBlob(await response.blob(), "transcription.pdf");
      toast({ title: isArabic ? "تم تنزيل ملف PDF" : "PDF downloaded" });
    } catch (cause: any) {
      toast({ title: cause?.message || (isArabic ? "تعذر إنشاء PDF" : "Could not create the PDF"), variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="space-y-5" dir={dir}>
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-100">
        {isArabic
          ? "ارفع ملفاً صوتياً أو فيديو لتفريغه إلى نص بالعربية أو الإنجليزية. يمكنك أيضاً استخراج الصوت من الفيديو كملف MP3. تتم المعالجة عبر خدمة صوتية خارجية."
          : "Upload audio or video to transcribe it in Arabic or English, or extract an MP3 audio track from a video. Processing uses an external speech service."}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.05]">
        <button onClick={() => setAction("transcribe")} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${action === "transcribe" ? "bg-white text-black shadow dark:bg-gray-800 dark:text-white" : "text-black/60 dark:text-white/60"}`}>
          <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" />{isArabic ? "تحويل إلى نص" : "Transcribe"}</span>
        </button>
        <button onClick={() => setAction("extract")} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${action === "extract" ? "bg-white text-black shadow dark:bg-gray-800 dark:text-white" : "text-black/60 dark:text-white/60"}`}>
          <span className="inline-flex items-center gap-2"><AudioLines className="h-4 w-4" />{isArabic ? "استخراج الصوت" : "Extract audio"}</span>
        </button>
      </div>

      {action === "transcribe" && (
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-xs font-semibold text-black/50 dark:text-white/50">{isArabic ? "لغة التسجيل" : "Recording language"}</label>
            <select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-black dark:border-white/10 dark:bg-gray-900 dark:text-white">
              <option value="auto">{isArabic ? "تحديد تلقائي" : "Auto-detect"}</option>
              <option value="ar">{isArabic ? "العربية" : "Arabic"}</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-black/50 dark:text-white/50">{isArabic ? "أسماء أو مصطلحات خاصة (اختياري)" : "Names or special terms (optional)"}</label>
            <Input value={vocabulary} onChange={(event) => setVocabulary(event.target.value.slice(0, 1000))} maxLength={1000} placeholder={isArabic ? "مثال: أسماء الأشخاص، الشركات، أو المصطلحات" : "Names, companies, or technical terms"} />
            <p className="mt-1 text-[11px] text-black/40 dark:text-white/40">{isArabic ? "تساعد هذه الكلمات على تحسين كتابة الأسماء والمصطلحات في التفريغ." : "These hints can improve spelling of names and technical terms."}</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.webm,.mp4,.mov,.mkv,.avi"
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0] || null;
          setTranscript("");
          setError("");
          if (selected && selected.size > MAX_FILE_BYTES) {
            setFile(null);
            setError(isArabic ? "الحد الأقصى لحجم الملف 100 ميجابايت" : "Maximum file size is 100 MB");
            event.target.value = "";
            return;
          }
          setFile(selected);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-2xl border-2 border-dashed border-black/15 p-8 text-center transition-colors hover:border-violet-500 hover:bg-violet-50/50 dark:border-white/15 dark:hover:bg-violet-950/20"
        data-testid="button-select-media"
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            {isVideo ? <Video className="h-6 w-6 text-violet-600" /> : <FileAudio className="h-6 w-6 text-violet-600" />}
            <span className="max-w-[75%] truncate text-sm font-semibold text-black dark:text-white">{file.name}</span>
            <span className="text-xs text-black/40 dark:text-white/40">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        ) : (
          <>
            <Upload className="mx-auto mb-3 h-9 w-9 text-black/30 dark:text-white/30" />
            <p className="text-sm font-semibold text-black/70 dark:text-white/70">{isArabic ? "اضغط لاختيار ملف صوت أو فيديو" : "Choose an audio or video file"}</p>
            <p className="mt-1 text-xs text-black/40 dark:text-white/40">{isArabic ? "الحد الأقصى 100 ميجابايت" : "Up to 100 MB"}</p>
          </>
        )}
      </button>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <Button onClick={run} disabled={!file || busy} className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700" data-testid="button-process-media">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : action === "extract" ? <Download className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        {busy
          ? (isArabic ? "جارٍ المعالجة..." : "Processing...")
          : action === "extract"
            ? (isArabic ? "استخراج وتنزيل MP3" : "Extract and download MP3")
            : (isArabic ? "تحويل التسجيل إلى نص" : "Transcribe recording")}
      </Button>

      {transcript && (
        <div className="space-y-3 border-t border-black/10 pt-4 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-black dark:text-white">{isArabic ? "النص المستخرج" : "Transcript"}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => saveBlob(new Blob([transcript], { type: "text/plain;charset=utf-8" }), "transcription.txt")}>
                <Download className="me-1 h-4 w-4" />TXT
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPdf} disabled={pdfBusy}>
                {pdfBusy ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Download className="me-1 h-4 w-4" />}{pdfBusy ? (isArabic ? "جارٍ الإنشاء" : "Creating") : "PDF"}
              </Button>
            </div>
          </div>
          <Textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} rows={12} className="min-h-48 leading-7" dir="auto" aria-label={isArabic ? "النص المستخرج" : "Transcript text"} />
          <p className="text-xs text-black/40 dark:text-white/40">{isArabic ? "يمكنك تعديل النص قبل تنزيله." : "You can edit the transcript before downloading it."}</p>
        </div>
      )}
    </div>
  );
}
