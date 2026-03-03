import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface SingleProps {
  multiple?: false;
  value: string;
  onChange: (url: string) => void;
}

interface MultiProps {
  multiple: true;
  value: string[];
  onChange: (urls: string[]) => void;
}

type Props = (SingleProps | MultiProps) & {
  label?: string;
  accept?: string;
};

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("فشل رفع الصورة");
  const data = await res.json();
  return data.url as string;
}

export function ImageUpload(props: Props) {
  const { label, accept = "image/*" } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const urls: string[] = props.multiple
    ? (props.value as string[]).filter(Boolean)
    : props.value
    ? [props.value as string]
    : [];

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setLoading(true);
    setError("");
    try {
      if (props.multiple) {
        const uploaded: string[] = [];
        for (const file of Array.from(files)) {
          const url = await uploadFile(file);
          uploaded.push(url);
        }
        props.onChange([...urls, ...uploaded]);
      } else {
        const url = await uploadFile(files[0]);
        (props as SingleProps).onChange(url);
      }
    } catch (e: any) {
      setError(e.message || "حدث خطأ أثناء الرفع");
    } finally {
      setLoading(false);
    }
  }

  function removeUrl(idx: number) {
    if (props.multiple) {
      const next = urls.filter((_, i) => i !== idx);
      props.onChange(next);
    } else {
      (props as SingleProps).onChange("");
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">
          {label}
        </label>
      )}

      <div
        className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl p-4 hover:border-black/20 dark:hover:border-white/20 transition-colors cursor-pointer group"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={!!props.multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2 py-2">
          {loading ? (
            <Loader2 className="w-6 h-6 text-black/30 dark:text-white/30 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-black/30 dark:text-white/30 group-hover:text-black/50 dark:group-hover:text-white/50 transition-colors" />
          )}
          <p className="text-xs text-black/40 dark:text-white/40 text-center">
            {loading
              ? "جارٍ الرفع..."
              : "اضغط لاختيار صورة أو اسحب وأفلت هنا"}
          </p>
          {props.multiple && (
            <p className="text-[10px] text-black/30 dark:text-white/30">
              يمكنك اختيار أكثر من صورة
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {urls.length > 0 && (
        <div className={`grid gap-2 ${props.multiple ? "grid-cols-3" : "grid-cols-1"}`}>
          {urls.map((url, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-black/08 dark:border-white/08 aspect-video bg-black/[0.02] dark:bg-white/[0.02]">
              {url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-6 h-6 text-black/20 dark:text-white/20" />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeUrl(idx); }}
                className="absolute top-1 left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
