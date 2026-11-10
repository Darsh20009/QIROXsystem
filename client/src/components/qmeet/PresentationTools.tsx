import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft, Circle, Eraser, MousePointer2, PenLine, PictureInPicture2, Undo2, X,
} from "lucide-react";
import type { PresentationMark, PresentationModel } from "@/lib/qmeet-presentation";

interface PresentationToolsProps {
  stream: MediaStream;
  model: PresentationModel;
  onClose: () => void;
  onStop: () => void;
}

const COLORS = ["#f4f2e9", "#29c7b7", "#ff6b68", "#f5c451", "#8ba8ff"];
const MAX_MARKS = 200;
const MAX_POINTS = 2000;
const MAX_TEXT = 300;

type PipApi = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
};

function isTypingTarget(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;
  return !!element && (
    element.isContentEditable ||
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "SELECT"
  );
}

function PreviewStage({
  stream,
  model,
  redraw,
}: {
  stream: MediaStream;
  model: PresentationModel;
  redraw: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [videoRect, setVideoRect] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const drawingRef = useRef<PresentationMark | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    void video.play().catch(() => {});
    return () => {
      if (video.srcObject === stream) video.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!stage || !video) return;
    const measure = () => {
      const box = stage.getBoundingClientRect();
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!box.width || !box.height || !vw || !vh) {
        setVideoRect({ left: 0, top: 0, width: 0, height: 0 });
        return;
      }
      const scale = Math.min(box.width / vw, box.height / vh);
      const width = vw * scale;
      const height = vh * scale;
      setVideoRect({
        left: (box.width - width) / 2,
        top: (box.height - height) / 2,
        width,
        height,
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    video.addEventListener("loadedmetadata", measure);
    measure();
    return () => {
      observer.disconnect();
      video.removeEventListener("loadedmetadata", measure);
    };
  }, [stream]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  };

  const startStroke = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (model.tool !== "pen" || (event.button !== 0 && event.pointerType !== "touch")) return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = {
      id: `mark-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "pen",
      points: [point],
      color: model.color,
      width: model.width,
    };
    model.draft = drawingRef.current;
    redraw();
  };

  const moveStroke = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drawing = drawingRef.current;
    if (!drawing || drawing.points.length >= MAX_POINTS) return;
    const point = pointFromEvent(event);
    if (!point) return;
    const last = drawing.points[drawing.points.length - 1];
    if (last && Math.hypot(last.x - point.x, last.y - point.y) < 0.001) return;
    drawing.points.push(point);
    redraw();
  };

  const finishStroke = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drawing = drawingRef.current;
    if (!drawing) return;
    drawingRef.current = null;
    model.draft = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
    if (model.marks.length < MAX_MARKS) model.marks.push(drawing);
    redraw();
  };

  const placeText = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (model.tool !== "text" || !model.text.trim()) return;
    const point = pointFromEvent(event);
    if (!point || model.marks.length >= MAX_MARKS) return;
    const mark: PresentationMark = {
      id: `mark-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "text",
      points: [point],
      color: model.color,
      width: model.width,
      text: model.text.slice(0, MAX_TEXT),
    };
    model.marks.push(mark);
    redraw();
  };

  // The live preview already includes committed marks from the outgoing compositor.
  const marks = drawingRef.current ? [drawingRef.current] : [];

  return (
    <div ref={stageRef} className="qmeet-preview-stage">
      <video ref={videoRef} autoPlay playsInline muted className="qmeet-preview-video" aria-label="معاينة الشاشة المشتركة" />
      {videoRect.width > 0 && (
        <div
          className="qmeet-annotation-layer"
          style={{
            left: videoRect.left,
            top: videoRect.top,
            width: videoRect.width,
            height: videoRect.height,
            cursor: model.tool === "pen" ? "crosshair" : model.tool === "text" ? "text" : "default",
            pointerEvents: model.tool === "pointer" ? "none" : "auto",
            touchAction: "none",
          }}
          onPointerDown={startStroke}
          onPointerMove={moveStroke}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onClick={placeText}
          aria-label={model.tool === "text" ? "انقر لوضع النص على المعاينة" : "ارسم على معاينة الشاشة"}
        >
          <svg className="qmeet-annotation-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
            {marks.filter(mark => mark.kind === "pen" && mark.points.length > 0).map(mark => {
              const path = mark.points.map((point, index) =>
                `${index === 0 ? "M" : "L"} ${point.x * 1000} ${point.y * 1000}`,
              ).join(" ");
              return (
                <path
                  key={mark.id}
                  d={path}
                  fill="none"
                  stroke={mark.color}
                  strokeWidth={mark.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          {marks.filter(mark => mark.kind === "text" && mark.points[0]).map(mark => (
            <span
              key={mark.id}
              className="qmeet-annotation-text"
              style={{ left: `${mark.points[0].x * 100}%`, top: `${mark.points[0].y * 100}%`, color: mark.color }}
            >
              {mark.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PresentationTools({ stream, model, onClose, onStop }: PresentationToolsProps) {
  const [, setRevision] = useState(0);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [pipMessage, setPipMessage] = useState("");
  const pipRootRef = useRef<HTMLDivElement | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const redraw = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "p") { model.tool = "pen"; redraw(); }
      else if (key === "t") { model.tool = "text"; redraw(); }
      else if (key === "v") { model.tool = "pointer"; redraw(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [model, redraw]);

  useEffect(() => {
    return () => {
      const win = pipWindowRef.current;
      pipWindowRef.current = null;
      if (win) {
        win.removeEventListener("pagehide", onPipPageHideRef.current);
        if (!win.closed) win.close();
      }
    };
  }, []);

  const onPipPageHideRef = useRef<() => void>(() => {});
  const onPipPageHide = useCallback(() => {
    const win = pipWindowRef.current;
    if (win) {
      win.removeEventListener("pagehide", onPipPageHideRef.current);
      pipWindowRef.current = null;
    }
    setPipWindow(null);
    pipRootRef.current = null;
  }, []);
  onPipPageHideRef.current = onPipPageHide;

  const openPip = async () => {
    setPipMessage("");
    const pip = (window as Window & { documentPictureInPicture?: PipApi }).documentPictureInPicture;
    if (!pip?.requestWindow) {
      setPipMessage("ميزة نافذة العرض غير مدعومة في هذا المتصفح.");
      return;
    }
    try {
      const win = await pip.requestWindow({ width: 900, height: 600 });
      const root = win.document.createElement("div");
      root.id = "qmeet-presentation-pip";
      root.style.cssText = "height:100%;";
      win.document.body.style.cssText = "margin:0;height:100%;overflow:hidden;background:#111c25;";
      win.document.documentElement.style.height = "100%";
      win.document.body.appendChild(root);
      document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const copy = link.cloneNode(true) as HTMLLinkElement;
        win.document.head.appendChild(copy);
      });
      const inlineTheme = win.document.createElement("style");
      inlineTheme.textContent = `
        :root{color-scheme:dark;font-family:ui-sans-serif,system-ui,sans-serif}
        *{box-sizing:border-box}
        body{color:#e8f0f1}
        button,input{font:inherit}
        .qmeet-pip-shell{height:100dvh!important}
      `;
      win.document.head.appendChild(inlineTheme);
      pipRootRef.current = root;
      pipWindowRef.current = win;
      win.addEventListener("pagehide", onPipPageHide);
      setPipWindow(win);
    } catch {
      setPipMessage("تعذّر فتح نافذة العرض. تحقق من صلاحيات المتصفح.");
    }
  };

  const setTool = (tool: PresentationModel["tool"]) => {
    model.tool = tool;
    redraw();
  };
  const undo = () => {
    model.marks.pop();
    redraw();
  };
  const clearMarks = () => {
    model.marks.splice(0, model.marks.length);
    redraw();
  };

  const renderTools = (isPip = false) => (
    <section className={`qmeet-presentation-shell${isPip ? " qmeet-pip-shell" : ""}`} dir="rtl">
      <header className="qmeet-presentation-header">
        <div className="qmeet-presentation-title">
          <span className="qmeet-live-dot" aria-hidden="true" />
          <div>
            <strong>أدوات العرض</strong>
            <p>التعليقات تظهر على المعاينة المباشرة فقط، لا على نوافذ النظام.</p>
          </div>
        </div>
        <button className="qmeet-icon-button" type="button" onClick={onClose} title="إغلاق الأدوات" aria-label="إغلاق الأدوات">
          <X size={18} />
        </button>
      </header>
      <div className="qmeet-presentation-body">
        <div className="qmeet-preview-well">
          <PreviewStage stream={stream} model={model} redraw={redraw} />
          <span className="qmeet-preview-badge">معاينة البث</span>
        </div>
        <div className="qmeet-tool-dock">
          <div className="qmeet-tool-group" aria-label="أداة المؤشر">
            <button type="button" className={`qmeet-tool-button${model.tool === "pointer" ? " active" : ""}`} onClick={() => setTool("pointer")} title="مؤشر (V)" aria-label="وضع المؤشر">
              <MousePointer2 size={17} /><span>مؤشر</span>
            </button>
            <button type="button" className={`qmeet-tool-button${model.tool === "pen" ? " active" : ""}`} onClick={() => setTool("pen")} title="قلم (P)" aria-label="وضع القلم">
              <PenLine size={17} /><span>قلم</span>
            </button>
            <button type="button" className={`qmeet-tool-button${model.tool === "text" ? " active" : ""}`} onClick={() => setTool("text")} title="نص (T)" aria-label="وضع النص">
              <span className="qmeet-text-glyph">T</span><span>نص</span>
            </button>
          </div>
          <div className="qmeet-tool-divider" />
          <div className="qmeet-color-row" role="group" aria-label="لون التعليق">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`qmeet-color-swatch${model.color === color ? " selected" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => { model.color = color; redraw(); }}
                title={`اختيار اللون ${color}`}
                aria-label={`اختيار اللون ${color}`}
                aria-pressed={model.color === color}
              />
            ))}
          </div>
          <div className="qmeet-width-control">
            <label htmlFor={isPip ? "qmeet-pip-width" : "qmeet-width"}>السُمك</label>
            <input
              id={isPip ? "qmeet-pip-width" : "qmeet-width"}
              type="range"
              min="2"
              max="12"
              value={model.width}
              onChange={event => { model.width = Number(event.currentTarget.value); redraw(); }}
              aria-label="سُمك القلم"
            />
          </div>
          <div className="qmeet-text-entry">
            <input
              type="text"
              maxLength={MAX_TEXT}
              value={model.text}
              onChange={event => { model.text = event.currentTarget.value.slice(0, MAX_TEXT); redraw(); }}
              placeholder="اكتب نصاً ثم انقر على المعاينة"
              aria-label="النص المراد إضافته"
            />
          </div>
          <div className="qmeet-tool-actions">
            <button type="button" className="qmeet-tool-button compact" onClick={undo} disabled={!model.marks.length} title="تراجع" aria-label="تراجع عن آخر تعليق">
              <Undo2 size={17} /><span>تراجع</span>
            </button>
            <button type="button" className="qmeet-tool-button compact" onClick={clearMarks} disabled={!model.marks.length} title="مسح الكل" aria-label="مسح كل التعليقات">
              <Eraser size={17} /><span>مسح</span>
            </button>
            {!isPip && (
              <button type="button" className="qmeet-tool-button compact" onClick={openPip} title="فتح نافذة صورة داخل صورة" aria-label="فتح نافذة صورة داخل صورة">
                <PictureInPicture2 size={17} /><span>نافذة عائمة</span>
              </button>
            )}
            {isPip && (
              <button type="button" className="qmeet-tool-button compact" onClick={() => pipWindow?.close()} title="إغلاق النافذة العائمة" aria-label="إغلاق النافذة العائمة">
                <X size={17} /><span>إغلاق النافذة</span>
              </button>
            )}
            <button type="button" className="qmeet-stop-button" onClick={onStop} title="إيقاف مشاركة الشاشة">
              <Circle size={12} fill="currentColor" /> إيقاف المشاركة
            </button>
          </div>
        </div>
      </div>
      {!isPip && pipMessage && <p className="qmeet-pip-message" role="status">{pipMessage}</p>}
      <footer className="qmeet-presentation-footer">
        <span>اختصارات: P قلم · T نص · V مؤشر</span>
        <button type="button" onClick={onClose} className="qmeet-footer-close"><ChevronLeft size={15} /> رجوع للاجتماع</button>
      </footer>
    </section>
  );

  const style = `
    .qmeet-presentation-shell{--q-bg:#111c25;--q-panel:#182630;--q-raised:#22343d;--q-border:#30434a;--q-text:#e8f0f1;--q-muted:#95a9ad;--q-teal:#29c7b7;display:flex;flex-direction:column;min-height:0;height:100%;color:var(--q-text);background:var(--q-bg);font-family:ui-sans-serif,system-ui,sans-serif}
    .qmeet-presentation-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;border-bottom:1px solid var(--q-border);flex:none}
    .qmeet-presentation-title{display:flex;align-items:flex-start;gap:12px}.qmeet-presentation-title strong{font-size:15px;font-weight:700;letter-spacing:.01em}.qmeet-presentation-title p{margin:4px 0 0;font-size:12px;line-height:1.5;color:var(--q-muted)}
    .qmeet-live-dot{width:9px;height:9px;margin-top:5px;border-radius:50%;background:#ef746c;box-shadow:0 0 0 4px #ef746c22;flex:none}
    .qmeet-icon-button{display:grid;place-items:center;width:34px;height:34px;border:1px solid var(--q-border);border-radius:10px;background:transparent;color:var(--q-muted);cursor:pointer}.qmeet-icon-button:hover{color:var(--q-text);background:var(--q-raised)}
    .qmeet-presentation-body{display:flex;flex:1;min-height:0;gap:14px;padding:14px}
    .qmeet-preview-well{position:relative;display:grid;place-items:center;flex:1;min-width:0;min-height:220px;overflow:hidden;border:1px solid var(--q-border);border-radius:14px;background:#0b1319}
    .qmeet-preview-stage{position:absolute;inset:0;overflow:hidden}.qmeet-preview-video{width:100%;height:100%;object-fit:contain;background:transparent}
    .qmeet-annotation-layer{position:absolute;overflow:hidden}.qmeet-annotation-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
    .qmeet-annotation-text{position:absolute;transform:translateY(-100%);font-weight:700;font-size:20px;line-height:1.15;white-space:pre-wrap;overflow-wrap:anywhere;text-shadow:0 1px 5px #000b;max-width:90%;pointer-events:none}
    .qmeet-preview-badge{position:absolute;top:12px;right:12px;padding:5px 9px;border:1px solid #ffffff20;border-radius:999px;background:#111c25d9;color:#d8e4e5;font-size:10px;letter-spacing:.02em;pointer-events:none}
    .qmeet-tool-dock{display:flex;flex-direction:column;gap:12px;width:230px;flex:none;padding:13px;border:1px solid var(--q-border);border-radius:14px;background:var(--q-panel)}
    .qmeet-tool-group{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.qmeet-tool-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:37px;padding:7px 9px;border:1px solid transparent;border-radius:9px;background:transparent;color:#bdcacc;font-size:12px;cursor:pointer;transition:background .15s,color .15s,transform .15s}
    .qmeet-tool-button:hover:not(:disabled){background:var(--q-raised);color:var(--q-text)}.qmeet-tool-button:active:not(:disabled){transform:scale(.97)}.qmeet-tool-button.active{background:#29c7b71a;border-color:#29c7b74d;color:var(--q-teal)}.qmeet-tool-button:disabled{opacity:.38;cursor:not-allowed}
    .qmeet-text-glyph{width:17px;font-family:Georgia,serif;font-size:17px;font-weight:700;text-align:center}.qmeet-tool-divider{height:1px;background:var(--q-border)}
    .qmeet-color-row{display:flex;align-items:center;gap:11px;padding:0 4px}.qmeet-color-swatch{width:20px;height:20px;border:2px solid transparent;border-radius:50%;cursor:pointer}.qmeet-color-swatch.selected{outline:2px solid var(--q-teal);outline-offset:3px}
    .qmeet-width-control{display:flex;align-items:center;gap:10px;color:var(--q-muted);font-size:11px}.qmeet-width-control input{width:100%;accent-color:var(--q-teal)}
    .qmeet-text-entry input{width:100%;height:36px;padding:0 10px;border:1px solid var(--q-border);border-radius:8px;outline:none;background:#111c25;color:var(--q-text);font-size:11px}.qmeet-text-entry input:focus{border-color:var(--q-teal)}.qmeet-text-entry input::placeholder{color:#71868a}
    .qmeet-tool-actions{display:flex;flex-direction:column;gap:4px;margin-top:auto}.qmeet-tool-button.compact{justify-content:flex-start;min-height:34px}
    .qmeet-stop-button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:39px;margin-top:6px;border:1px solid #da655a55;border-radius:9px;background:#da655a1a;color:#ff9386;font-size:12px;font-weight:650;cursor:pointer}.qmeet-stop-button:hover{background:#da655a2b}
    .qmeet-pip-message{margin:0 18px 8px;color:#f3bd77;font-size:12px}.qmeet-presentation-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 18px;border-top:1px solid var(--q-border);color:var(--q-muted);font-size:11px;flex:none}
    .qmeet-footer-close{display:flex;align-items:center;gap:4px;padding:5px 0;border:0;background:transparent;color:#b8c9ca;font-size:11px;cursor:pointer}.qmeet-footer-close:hover{color:var(--q-teal)}
    @media(max-width:700px){.qmeet-presentation-header{padding:12px 14px}.qmeet-presentation-body{flex-direction:column;padding:10px;overflow:auto}.qmeet-preview-well{flex:none;height:min(48vh,360px);min-height:190px}.qmeet-tool-dock{width:100%;flex:none}.qmeet-tool-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.qmeet-stop-button{grid-column:1/-1}.qmeet-presentation-footer{padding:9px 12px}}
  `;

  return (
    <>
      <style>{style}</style>
      {renderTools()}
      {pipWindow && pipRootRef.current && createPortal(
        <>
          <style>{style}</style>
          {renderTools(true)}
        </>,
        pipRootRef.current,
      )}
    </>
  );
}