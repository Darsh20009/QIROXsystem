export interface PresentationMark {
  id: string; kind: "pen" | "text"; points: { x: number; y: number }[];
  color: string; width: number; text?: string;
}
export interface PresentationModel {
  tool: "pointer" | "pen" | "text"; color: string; width: number;
  text: string; marks: PresentationMark[]; draft?: PresentationMark | null; enabled: boolean;
}
export function createPresentationModel(): PresentationModel {
  return { tool: "pointer", color: "#ef4444", width: 3, text: "", marks: [], enabled: true };
}
export function paintPresentation(context: CanvasRenderingContext2D, model: PresentationModel, width: number, height: number) {
  for (const mark of [...model.marks, ...(model.draft ? [model.draft] : [])].slice(-201)) {
    const first = mark.points[0];
    if (!first) continue;
    context.save();
    context.strokeStyle = context.fillStyle = mark.color;
    context.lineWidth = mark.width * width / 1000;
    context.lineJoin = context.lineCap = "round";
    if (mark.kind === "text") {
      context.font = `bold ${Math.max(18, width / 45)}px sans-serif`;
      context.textAlign = "start";
      context.fillText((mark.text || "").slice(0, 300), first.x * width, first.y * height);
    } else {
      context.beginPath();
      context.moveTo(first.x * width, first.y * height);
      for (const point of mark.points.slice(1, 2000)) context.lineTo(point.x * width, point.y * height);
      if (mark.points.length === 1) context.lineTo(first.x * width + 0.1, first.y * height);
      context.stroke();
    }
    context.restore();
  }
}

/** One outgoing video track works on mesh, native SFU and LiveKit alike.
 * Keep the camera alive separately, and burn annotations into actual shared pixels. */
export async function createPresentation(
  display: MediaStream, camera: () => MediaStream | null, model: PresentationModel,
) {
  const screenVideo = document.createElement("video");
  screenVideo.muted = true; screenVideo.playsInline = true; screenVideo.srcObject = display;
  await screenVideo.play();
  const canvas = document.createElement("canvas");
  const settings = display.getVideoTracks()[0].getSettings();
  const scale = Math.min(1, 1920 / (settings.width || 1280));
  canvas.width = Math.round((settings.width || 1280) * scale);
  canvas.height = Math.round((settings.height || 720) * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("تعذّر تجهيز مشاركة الشاشة");
  const cameraVideo = document.createElement("video");
  cameraVideo.muted = true; cameraVideo.playsInline = true;
  let stopped = false;
  const render = () => {
    if (stopped) return;
    context.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
    paintPresentation(context, model, canvas.width, canvas.height);
    const stream = camera();
    if (cameraVideo.srcObject !== stream) {
      cameraVideo.srcObject = stream;
      if (stream) void cameraVideo.play().catch(() => {});
    }
    if (stream?.getVideoTracks().some(track => track.enabled && track.readyState === "live") && cameraVideo.readyState >= 2) {
      const aspect = cameraVideo.videoHeight / (cameraVideo.videoWidth || 1);
      const width = Math.min(canvas.width * 0.19, canvas.height * 0.3 / aspect);
      const height = width * aspect;
      context.fillStyle = "#14b8a6";
      context.fillRect(canvas.width - width - 18, canvas.height - height - 18, width + 4, height + 4);
      context.drawImage(cameraVideo, canvas.width - width - 16, canvas.height - height - 16, width, height);
    }
  };
  render();
  // Unlike requestAnimationFrame, a timer does not completely pause when the tab is hidden.
  const timer = window.setInterval(render, 1000 / 25);
  let ticker: Worker | null = null;
  let tickerUrl: string | null = null;
  try {
    tickerUrl = URL.createObjectURL(new Blob(["setInterval(() => postMessage('frame'), 40);"], { type: "text/javascript" }));
    ticker = new Worker(tickerUrl);
    ticker.onmessage = () => { if (document.hidden) render(); };
  } catch { /* visible-page timer remains available on browsers without workers */ }
  const stream = canvas.captureStream(25);
  const stop = () => {
    if (stopped) return;
    stopped = true; clearInterval(timer);
    ticker?.terminate();
    if (tickerUrl) URL.revokeObjectURL(tickerUrl);
    stream.getTracks().forEach(track => track.stop());
    display.getTracks().forEach(track => { track.onended = null; track.stop(); });
    screenVideo.pause(); cameraVideo.pause();
    screenVideo.srcObject = cameraVideo.srcObject = null;
  };
  return { stream, display, model, stop };
}