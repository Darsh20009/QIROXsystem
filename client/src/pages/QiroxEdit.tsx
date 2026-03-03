import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import * as fabric from "fabric";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import {
  Square, Circle, Triangle, Minus, Type, ImageIcon, Download,
  Undo2, Redo2, Trash2, Copy, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Layers, ChevronDown, ChevronUp,
  Lock, Unlock, Eye, EyeOff, ZoomIn, ZoomOut, Monitor,
  Palette, Grid3x3, RotateCcw, FlipHorizontal, FlipVertical,
  Star, Hexagon, ArrowRight, Pen, X, Plus, Save, Share2,
  MoveHorizontal, MoveVertical, PanelLeft, PanelRight, Home,
  Sparkles, Wand2, MousePointer2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

// ── Types ────────────────────────────────────────────────────────────────────
interface CanvasSize { label: string; width: number; height: number; icon: string }
interface LayerItem { id: string; name: string; type: string; visible: boolean; locked: boolean; obj: fabric.FabricObject }

const CANVAS_SIZES: CanvasSize[] = [
  { label: "مربع (1:1)", width: 1080, height: 1080, icon: "□" },
  { label: "إنستقرام Story", width: 1080, height: 1920, icon: "▯" },
  { label: "تغريدة", width: 1200, height: 675, icon: "▭" },
  { label: "بوستر Facebook", width: 1200, height: 628, icon: "▭" },
  { label: "يوتيوب Thumbnail", width: 1280, height: 720, icon: "▭" },
  { label: "A4 طولي", width: 794, height: 1123, icon: "▯" },
  { label: "A4 عرضي", width: 1123, height: 794, icon: "▭" },
  { label: "بطاقة عمل", width: 1050, height: 600, icon: "▭" },
  { label: "إعلان Banner", width: 1920, height: 1080, icon: "▭" },
];

const GOOGLE_FONTS = [
  "Cairo", "Tajawal", "Noto Sans Arabic", "Amiri", "Scheherazade New",
  "Arial", "Helvetica", "Georgia", "Times New Roman", "Verdana",
  "Roboto", "Open Sans", "Montserrat", "Poppins", "Inter",
  "Playfair Display", "Lora", "Merriweather", "Dancing Script", "Pacifico"
];

const PRESET_COLORS = [
  "#000000", "#ffffff", "#1e293b", "#0f172a", "#334155",
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b",
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2",
];

const GRADIENT_PRESETS = [
  { label: "غروب", colors: ["#f97316", "#ec4899"] },
  { label: "محيط", colors: ["#06b6d4", "#3b82f6"] },
  { label: "غابة", colors: ["#22c55e", "#14b8a6"] },
  { label: "ليل", colors: ["#1e293b", "#7c3aed"] },
  { label: "فجر", colors: ["#fbbf24", "#f97316"] },
  { label: "وردي", colors: ["#ec4899", "#8b5cf6"] },
];

function loadGoogleFont(fontName: string) {
  const id = `gfont-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  const encoded = encodeURIComponent(fontName + ":400,700");
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
  document.head.appendChild(link);
}

GOOGLE_FONTS.forEach(loadGoogleFont);

// ── Scale helpers ────────────────────────────────────────────────────────────
const DISPLAY_MAX = 700;

function getScale(canvasW: number, canvasH: number, containerW: number): number {
  const maxW = Math.min(containerW - 80, DISPLAY_MAX);
  const maxH = window.innerHeight - 180;
  return Math.min(maxW / canvasW, maxH / canvasH, 1);
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function QiroxEdit() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyPosRef = useRef<number>(-1);

  const [canvasSize, setCanvasSize] = useState(CANVAS_SIZES[0]);
  const [zoom, setZoom] = useState(1);
  const [scale, setScale] = useState(1);
  const [activeTool, setActiveTool] = useState<"select" | "rect" | "circle" | "triangle" | "line" | "text" | "pen">("select");
  const [selectedObj, setSelectedObj] = useState<fabric.FabricObject | null>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [projectName, setProjectName] = useState("تصميم جديد");
  const [leftTab, setLeftTab] = useState<"elements" | "text" | "images" | "background" | "templates">("elements");
  const [rightTab, setRightTab] = useState<"properties" | "layers">("properties");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // ── Object properties state ──────────────────────────────────────────────
  const [objProps, setObjProps] = useState({
    x: 0, y: 0, w: 100, h: 100,
    angle: 0, opacity: 100,
    fill: "#000000", stroke: "transparent", strokeWidth: 0,
    fontSize: 32, fontFamily: "Cairo", fontWeight: "normal",
    fontStyle: "normal", textDecoration: "",
    textAlign: "right",
  });

  // ── Canvas init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasEl.current) return;
    const s = getScale(canvasSize.width, canvasSize.height, containerRef.current?.clientWidth || 800);
    setScale(s);

    const canvas = new fabric.Canvas(canvasEl.current, {
      width: canvasSize.width * s,
      height: canvasSize.height * s,
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
    });

    canvas.setZoom(s);
    fabricRef.current = canvas;

    // Save initial state
    saveHistory(canvas);

    // Selection listener
    canvas.on("selection:created", onSelect);
    canvas.on("selection:updated", onSelect);
    canvas.on("selection:cleared", () => { setSelectedObj(null); refreshLayers(canvas); });
    canvas.on("object:modified", () => { saveHistory(canvas); refreshLayers(canvas); syncObjProps(canvas.getActiveObject() as fabric.FabricObject); });
    canvas.on("object:added", () => { saveHistory(canvas); refreshLayers(canvas); });
    canvas.on("object:removed", () => { saveHistory(canvas); refreshLayers(canvas); });

    return () => { canvas.dispose(); fabricRef.current = null; };
  }, [canvasSize]);

  function onSelect(e: any) {
    const obj = e.selected?.[0] || (fabricRef.current?.getActiveObject() as fabric.FabricObject);
    setSelectedObj(obj || null);
    if (obj) syncObjProps(obj);
    refreshLayers(fabricRef.current!);
  }

  function syncObjProps(obj: fabric.FabricObject | null | undefined) {
    if (!obj) return;
    const s = scale;
    setObjProps({
      x: Math.round((obj.left || 0) / s),
      y: Math.round((obj.top || 0) / s),
      w: Math.round(((obj.width || 100) * (obj.scaleX || 1)) / s),
      h: Math.round(((obj.height || 100) * (obj.scaleY || 1)) / s),
      angle: Math.round(obj.angle || 0),
      opacity: Math.round((obj.opacity ?? 1) * 100),
      fill: typeof obj.fill === "string" ? obj.fill : "#000000",
      stroke: typeof obj.stroke === "string" ? obj.stroke : "transparent",
      strokeWidth: obj.strokeWidth || 0,
      fontSize: (obj as any).fontSize || 32,
      fontFamily: (obj as any).fontFamily || "Cairo",
      fontWeight: (obj as any).fontWeight || "normal",
      fontStyle: (obj as any).fontStyle || "normal",
      textDecoration: (obj as any).textDecoration || "",
      textAlign: (obj as any).textAlign || "right",
    });
  }

  function refreshLayers(canvas: fabric.Canvas) {
    const objs = canvas.getObjects();
    setLayers(objs.map((o, i) => ({
      id: (o as any).__id || String(i),
      name: getObjName(o, i),
      type: o.type || "object",
      visible: o.visible !== false,
      locked: !(o.selectable !== false),
      obj: o,
    })).reverse());
  }

  function getObjName(o: fabric.FabricObject, i: number): string {
    const t = o.type;
    if (t === "i-text" || t === "text" || t === "textbox") return `نص: ${((o as any).text || "").slice(0, 15)}`;
    if (t === "rect") return `مستطيل ${i + 1}`;
    if (t === "circle") return `دائرة ${i + 1}`;
    if (t === "triangle") return `مثلث ${i + 1}`;
    if (t === "line") return `خط ${i + 1}`;
    if (t === "image") return `صورة ${i + 1}`;
    if (t === "path") return `رسم ${i + 1}`;
    if (t === "polygon") return `شكل ${i + 1}`;
    return `عنصر ${i + 1}`;
  }

  // ── History ──────────────────────────────────────────────────────────────
  function saveHistory(canvas: fabric.Canvas) {
    const json = JSON.stringify(canvas.toJSON());
    const pos = historyPosRef.current;
    historyRef.current = historyRef.current.slice(0, pos + 1);
    historyRef.current.push(json);
    historyPosRef.current = historyRef.current.length - 1;
    setCanUndo(historyPosRef.current > 0);
    setCanRedo(false);
  }

  const undo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || historyPosRef.current <= 0) return;
    historyPosRef.current--;
    const json = historyRef.current[historyPosRef.current];
    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.renderAll();
      setCanUndo(historyPosRef.current > 0);
      setCanRedo(historyPosRef.current < historyRef.current.length - 1);
      refreshLayers(canvas);
    });
  }, []);

  const redo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || historyPosRef.current >= historyRef.current.length - 1) return;
    historyPosRef.current++;
    const json = historyRef.current[historyPosRef.current];
    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.renderAll();
      setCanUndo(historyPosRef.current > 0);
      setCanRedo(historyPosRef.current < historyRef.current.length - 1);
      refreshLayers(canvas);
    });
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
        if ((e.key === "y") || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
        if (e.key === "c") duplicateSelected();
        if (e.key === "d") { e.preventDefault(); duplicateSelected(); }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") deleteSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // ── Add Objects ──────────────────────────────────────────────────────────
  function addRect() {
    const canvas = fabricRef.current; if (!canvas) return;
    const s = scale;
    const r = new fabric.Rect({
      left: 100 * s, top: 100 * s,
      width: 200 * s, height: 120 * s,
      fill: "#3b82f6", stroke: "transparent", strokeWidth: 0,
      rx: 0, ry: 0,
    });
    canvas.add(r); canvas.setActiveObject(r); canvas.renderAll();
    setActiveTool("select");
  }

  function addCircle() {
    const canvas = fabricRef.current; if (!canvas) return;
    const s = scale;
    const c = new fabric.Circle({
      left: 150 * s, top: 150 * s,
      radius: 80 * s,
      fill: "#22c55e", stroke: "transparent", strokeWidth: 0,
    });
    canvas.add(c); canvas.setActiveObject(c); canvas.renderAll();
    setActiveTool("select");
  }

  function addTriangle() {
    const canvas = fabricRef.current; if (!canvas) return;
    const s = scale;
    const t = new fabric.Triangle({
      left: 150 * s, top: 150 * s,
      width: 160 * s, height: 140 * s,
      fill: "#f97316", stroke: "transparent", strokeWidth: 0,
    });
    canvas.add(t); canvas.setActiveObject(t); canvas.renderAll();
    setActiveTool("select");
  }

  function addLine() {
    const canvas = fabricRef.current; if (!canvas) return;
    const s = scale;
    const l = new fabric.Line([100 * s, 200 * s, 400 * s, 200 * s], {
      stroke: "#000000", strokeWidth: 3 * s,
      selectable: true,
    });
    canvas.add(l); canvas.setActiveObject(l); canvas.renderAll();
    setActiveTool("select");
  }

  function addStar() {
    const canvas = fabricRef.current; if (!canvas) return;
    const s = scale;
    const pts: { x: number; y: number }[] = [];
    const R = 80 * s, r = 35 * s, cx = 150 * s, cy = 150 * s;
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? R : r;
      pts.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
    }
    const star = new fabric.Polygon(pts, { fill: "#eab308", left: 100 * s, top: 100 * s });
    canvas.add(star); canvas.setActiveObject(star); canvas.renderAll();
    setActiveTool("select");
  }

  function addHexagon() {
    const canvas = fabricRef.current; if (!canvas) return;
    const s = scale;
    const pts: { x: number; y: number }[] = [];
    const R = 80 * s;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      pts.push({ x: R * Math.cos(angle), y: R * Math.sin(angle) });
    }
    const hex = new fabric.Polygon(pts, { fill: "#8b5cf6", left: 150 * s, top: 150 * s });
    canvas.add(hex); canvas.setActiveObject(hex); canvas.renderAll();
    setActiveTool("select");
  }

  function addText(sample = "أضف نصاً هنا") {
    const canvas = fabricRef.current; if (!canvas) return;
    const s = scale;
    const t = new fabric.IText(sample, {
      left: 120 * s, top: 150 * s,
      fontSize: 32 * s,
      fontFamily: "Cairo",
      fill: "#000000",
      textAlign: "right",
    });
    canvas.add(t); canvas.setActiveObject(t); canvas.renderAll();
    setActiveTool("select");
  }

  function addHeading() { addText("عنوان التصميم"); }
  function addSubheading() {
    const canvas = fabricRef.current; if (!canvas) return;
    const s = scale;
    const t = new fabric.IText("عنوان فرعي", {
      left: 120 * s, top: 220 * s,
      fontSize: 22 * s,
      fontFamily: "Cairo",
      fill: "#374151",
      textAlign: "right",
    });
    canvas.add(t); canvas.setActiveObject(t); canvas.renderAll();
    setActiveTool("select");
  }

  // ── Image Upload ─────────────────────────────────────────────────────────
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !fabricRef.current) return;
    const canvas = fabricRef.current;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const imgEl = new Image();
      imgEl.src = dataUrl;
      imgEl.onload = () => {
        const s = scale;
        const img = new fabric.FabricImage(imgEl);
        const maxW = 400 * s, maxH = 400 * s;
        const scaleX = maxW / img.width!;
        const scaleY = maxH / img.height!;
        const sc = Math.min(scaleX, scaleY, 1);
        img.scale(sc);
        img.set({ left: 100 * s, top: 100 * s });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      };
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // ── Background ───────────────────────────────────────────────────────────
  function setBackground(color: string) {
    const canvas = fabricRef.current; if (!canvas) return;
    setBgColor(color);
    canvas.backgroundColor = color;
    canvas.renderAll();
    saveHistory(canvas);
  }

  function setGradientBackground(colors: string[]) {
    const canvas = fabricRef.current; if (!canvas) return;
    const gradient = new fabric.Gradient({
      type: "linear",
      coords: { x1: 0, y1: 0, x2: canvas.width!, y2: canvas.height! },
      colorStops: [
        { offset: 0, color: colors[0] },
        { offset: 1, color: colors[1] },
      ],
    });
    canvas.backgroundColor = gradient as any;
    canvas.renderAll();
    saveHistory(canvas);
  }

  // ── Object manipulation ──────────────────────────────────────────────────
  function deleteSelected() {
    const canvas = fabricRef.current; if (!canvas) return;
    const active = canvas.getActiveObjects();
    active.forEach(o => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.renderAll();
    setSelectedObj(null);
  }

  function duplicateSelected() {
    const canvas = fabricRef.current; if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone().then((cloned: fabric.FabricObject) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  }

  function bringForward() {
    const canvas = fabricRef.current; if (!canvas) return;
    const obj = canvas.getActiveObject(); if (!obj) return;
    canvas.bringObjectForward(obj);
    canvas.renderAll();
    refreshLayers(canvas);
  }

  function sendBackward() {
    const canvas = fabricRef.current; if (!canvas) return;
    const obj = canvas.getActiveObject(); if (!obj) return;
    canvas.sendObjectBackwards(obj);
    canvas.renderAll();
    refreshLayers(canvas);
  }

  function flipH() {
    const canvas = fabricRef.current; if (!canvas) return;
    const obj = canvas.getActiveObject(); if (!obj) return;
    obj.set("flipX", !obj.flipX);
    canvas.renderAll();
  }

  function flipV() {
    const canvas = fabricRef.current; if (!canvas) return;
    const obj = canvas.getActiveObject(); if (!obj) return;
    obj.set("flipY", !obj.flipY);
    canvas.renderAll();
  }

  function updateObjProp(key: string, value: any) {
    const canvas = fabricRef.current; if (!canvas) return;
    const obj = canvas.getActiveObject(); if (!obj) return;
    const s = scale;

    if (key === "x") obj.set("left", value * s);
    else if (key === "y") obj.set("top", value * s);
    else if (key === "w") obj.scaleToWidth(value * s);
    else if (key === "h") obj.scaleToHeight(value * s);
    else if (key === "angle") obj.set("angle", value);
    else if (key === "opacity") obj.set("opacity", value / 100);
    else if (key === "fill") obj.set("fill", value);
    else if (key === "stroke") obj.set("stroke", value);
    else if (key === "strokeWidth") obj.set("strokeWidth", value * s);
    else if (key === "fontSize") (obj as any).set("fontSize", value * s);
    else if (key === "fontFamily") { (obj as any).set("fontFamily", value); loadGoogleFont(value); }
    else if (key === "fontWeight") (obj as any).set("fontWeight", value);
    else if (key === "fontStyle") (obj as any).set("fontStyle", value);
    else if (key === "textDecoration") (obj as any).set("textDecoration", value);
    else if (key === "textAlign") (obj as any).set("textAlign", value);

    canvas.renderAll();
    setObjProps(p => ({ ...p, [key]: value }));
  }

  // ── Export ───────────────────────────────────────────────────────────────
  function exportPNG() {
    const canvas = fabricRef.current; if (!canvas) return;
    const s = scale;
    const dataUrl = canvas.toDataURL({ multiplier: 1 / s, format: "png" as any });
    saveAs(dataUrl, `${projectName}.png`);
    setShowExportMenu(false);
  }

  function exportJPEG() {
    const canvas = fabricRef.current; if (!canvas) return;
    const s = scale;
    const dataUrl = canvas.toDataURL({ multiplier: 1 / s, format: "jpeg" as any, quality: 0.95 });
    saveAs(dataUrl, `${projectName}.jpg`);
    setShowExportMenu(false);
  }

  function exportPDF() {
    const canvas = fabricRef.current; if (!canvas) return;
    const s = scale;
    const dataUrl = canvas.toDataURL({ multiplier: 1 / s, format: "png" as any });
    const pdf = new jsPDF({
      orientation: canvasSize.width > canvasSize.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvasSize.width, canvasSize.height],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, canvasSize.width, canvasSize.height);
    pdf.save(`${projectName}.pdf`);
    setShowExportMenu(false);
  }

  function exportSVG() {
    const canvas = fabricRef.current; if (!canvas) return;
    const svg = canvas.toSVG();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    saveAs(blob, `${projectName}.svg`);
    setShowExportMenu(false);
  }

  // ── Templates ────────────────────────────────────────────────────────────
  function applyTemplate(type: string) {
    const canvas = fabricRef.current; if (!canvas) return;
    canvas.clear();
    const s = scale;
    const W = canvasSize.width * s;
    const H = canvasSize.height * s;

    if (type === "blank") {
      canvas.backgroundColor = "#ffffff";
    } else if (type === "gradient-dark") {
      setGradientBackground(["#0f172a", "#1e293b"]);
      const t1 = new fabric.IText("عنوان التصميم", {
        left: W / 2, top: H * 0.35, originX: "center", originY: "center",
        fontSize: 52 * s, fontFamily: "Cairo", fill: "#ffffff", fontWeight: "700", textAlign: "center",
      });
      const t2 = new fabric.IText("نص وصفي هنا", {
        left: W / 2, top: H * 0.55, originX: "center", originY: "center",
        fontSize: 22 * s, fontFamily: "Cairo", fill: "#94a3b8", textAlign: "center",
      });
      canvas.add(t1, t2);
    } else if (type === "modern-blue") {
      canvas.backgroundColor = "#eff6ff";
      const rect = new fabric.Rect({ left: 0, top: 0, width: W * 0.5, height: H, fill: "#2563eb", selectable: true });
      const t1 = new fabric.IText("عنوانك هنا", {
        left: W * 0.25, top: H * 0.4, originX: "center", originY: "center",
        fontSize: 42 * s, fontFamily: "Cairo", fill: "#ffffff", fontWeight: "700", textAlign: "center",
      });
      const t2 = new fabric.IText("وصف مختصر", {
        left: W * 0.75, top: H * 0.45, originX: "center", originY: "center",
        fontSize: 24 * s, fontFamily: "Cairo", fill: "#1e40af", textAlign: "center",
      });
      canvas.add(rect, t1, t2);
    } else if (type === "minimal") {
      canvas.backgroundColor = "#fafafa";
      const line = new fabric.Rect({ left: W * 0.15, top: H * 0.4, width: 6 * s, height: 80 * s, fill: "#000000" });
      const t1 = new fabric.IText("عنوان رئيسي", {
        left: W * 0.2, top: H * 0.38,
        fontSize: 38 * s, fontFamily: "Cairo", fill: "#000000", fontWeight: "700",
      });
      const t2 = new fabric.IText("وصف أو شعار", {
        left: W * 0.2, top: H * 0.52,
        fontSize: 18 * s, fontFamily: "Cairo", fill: "#6b7280",
      });
      canvas.add(line, t1, t2);
    } else if (type === "sunset") {
      setGradientBackground(["#f97316", "#ec4899"]);
      const circ = new fabric.Circle({
        left: W * 0.7, top: -60 * s, radius: 200 * s,
        fill: "rgba(255,255,255,0.1)", stroke: "rgba(255,255,255,0.2)", strokeWidth: 2 * s,
      });
      const t1 = new fabric.IText("تصميم إبداعي", {
        left: W / 2, top: H * 0.42, originX: "center", originY: "center",
        fontSize: 48 * s, fontFamily: "Cairo", fill: "#ffffff", fontWeight: "700", textAlign: "center",
      });
      canvas.add(circ, t1);
    }
    canvas.renderAll();
    saveHistory(canvas);
    refreshLayers(canvas);
  }

  // ── Layer actions ────────────────────────────────────────────────────────
  function toggleLayerVisibility(obj: fabric.FabricObject) {
    const canvas = fabricRef.current; if (!canvas) return;
    obj.visible = !obj.visible;
    canvas.renderAll();
    refreshLayers(canvas);
  }

  function selectLayerObj(obj: fabric.FabricObject) {
    const canvas = fabricRef.current; if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.renderAll();
    setSelectedObj(obj);
    syncObjProps(obj);
  }

  const isText = selectedObj?.type === "i-text" || selectedObj?.type === "text" || selectedObj?.type === "textbox";

  // ── Left panel tools ─────────────────────────────────────────────────────
  const leftTools = [
    { key: "elements", label: "عناصر", icon: Square },
    { key: "text", label: "نص", icon: Type },
    { key: "images", label: "صور", icon: ImageIcon },
    { key: "background", label: "خلفية", icon: Palette },
    { key: "templates", label: "قوالب", icon: Grid3x3 },
  ] as const;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-screen text-white overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0f0f2a 100%)" }} dir="rtl">

        {/* ── Accent line ─────────────────────────────────────────────── */}
        <div className="h-[2px] flex-shrink-0" style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />

        {/* ── Top Bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0 z-20" style={{ background: "rgba(15,15,35,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>

          {/* Back button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => navigate("/my-tools")}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all text-white/50 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 flex-shrink-0"
                data-testid="button-back-to-website">
                <Home className="w-3.5 h-3.5" />
                <span className="hidden md:block">العودة</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>العودة إلى أدواتي</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black relative overflow-hidden" style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", boxShadow: "0 0 12px rgba(6,182,212,0.4)" }}>
              <span className="relative z-10">Q</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-black leading-none" style={{ background: "linear-gradient(90deg, #06b6d4, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Qirox Edit</div>
              <div className="text-[9px] text-white/30 leading-none">Design Studio</div>
            </div>
          </div>

          <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Project name */}
          <input value={projectName} onChange={e => setProjectName(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium w-32 md:w-48 text-center text-white/80 hover:text-white transition-colors placeholder-white/20"
            data-testid="input-project-name" placeholder="اسم المشروع" />

          <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Canvas size */}
          <div className="relative">
            <button onClick={() => { setShowSizeMenu(s => !s); setShowExportMenu(false); }}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/8"
              style={{ background: "rgba(255,255,255,0.05)" }}
              data-testid="button-canvas-size">
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:block">{canvasSize.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showSizeMenu && (
              <div className="absolute top-full right-0 mt-1 w-52 rounded-xl shadow-2xl overflow-hidden z-50" style={{ background: "#0f0f2a", border: "1px solid rgba(255,255,255,0.1)" }}>
                {CANVAS_SIZES.map(s => (
                  <button key={s.label} onClick={() => { setCanvasSize(s); setShowSizeMenu(false); }}
                    className={`w-full text-right text-xs px-3 py-2.5 transition-colors flex items-center gap-2 ${canvasSize.label === s.label ? "text-cyan-400" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                    style={canvasSize.label === s.label ? { background: "rgba(6,182,212,0.1)" } : {}}
                    data-testid={`size-${s.label}`}>
                    <span className="text-sm">{s.icon}</span>
                    <div>
                      <div>{s.label}</div>
                      <div className="text-white/30">{s.width} × {s.height}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Undo / Redo */}
          <Tooltip><TooltipTrigger asChild>
            <button onClick={undo} disabled={!canUndo}
              className="p-1.5 rounded-lg transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white/10 text-white/60 hover:text-white"
              data-testid="button-undo">
              <Undo2 className="w-4 h-4" />
            </button>
          </TooltipTrigger><TooltipContent>تراجع (Ctrl+Z)</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <button onClick={redo} disabled={!canRedo}
              className="p-1.5 rounded-lg transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white/10 text-white/60 hover:text-white"
              data-testid="button-redo">
              <Redo2 className="w-4 h-4" />
            </button>
          </TooltipTrigger><TooltipContent>إعادة (Ctrl+Y)</TooltipContent></Tooltip>

          <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Export */}
          <div className="relative">
            <button onClick={() => { setShowExportMenu(s => !s); setShowSizeMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
              style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", boxShadow: "0 0 16px rgba(6,182,212,0.3)" }}
              data-testid="button-export">
              <Download className="w-4 h-4" />
              تصدير
              <ChevronDown className="w-3 h-3" />
            </button>
            {showExportMenu && (
              <div className="absolute top-full left-0 mt-1 w-40 rounded-xl shadow-2xl overflow-hidden z-50" style={{ background: "#0f0f2a", border: "1px solid rgba(255,255,255,0.1)" }}>
                {[
                  { label: "PNG عالي الجودة", fn: exportPNG },
                  { label: "JPEG", fn: exportJPEG },
                  { label: "PDF", fn: exportPDF },
                  { label: "SVG", fn: exportSVG },
                ].map(e => (
                  <button key={e.label} onClick={e.fn}
                    className="w-full text-right text-sm px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    data-testid={`export-${e.label}`}>
                    {e.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Main area ───────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left Panel ──────────────────────────────────────────── */}
          <div className="flex flex-shrink-0" style={{ background: "rgba(12,12,28,0.98)", borderLeft: "1px solid rgba(255,255,255,0.06)", direction: "ltr" }}>
            {/* Icon tabs */}
            <div className="flex flex-col gap-1 p-1.5" style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
              {leftTools.map(({ key, label, icon: Icon }) => (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <button onClick={() => setLeftTab(key as any)}
                      className={`w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all text-xs gap-0.5 relative`}
                      style={leftTab === key
                        ? { background: "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(139,92,246,0.25))", color: "#06b6d4", boxShadow: "0 0 12px rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.3)" }
                        : { color: "rgba(255,255,255,0.35)", border: "1px solid transparent" }}
                      onMouseEnter={e => { if (leftTab !== key) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                      onMouseLeave={e => { if (leftTab !== key) (e.currentTarget as HTMLElement).style.background = ""; }}
                      data-testid={`tab-left-${key}`}>
                      <Icon className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Panel content */}
            <div className="w-52 overflow-y-auto p-2 space-y-2" style={{ direction: "rtl" }}>
              {/* ── Elements ── */}
              {leftTab === "elements" && (
                <>
                  <p className="text-xs text-white/40 font-bold px-1 pt-1">أشكال أساسية</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: "مستطيل", fn: addRect, icon: Square },
                      { label: "دائرة", fn: addCircle, icon: Circle },
                      { label: "مثلث", fn: addTriangle, icon: Triangle },
                      { label: "خط", fn: addLine, icon: Minus },
                      { label: "نجمة", fn: addStar, icon: Star },
                      { label: "سداسي", fn: addHexagon, icon: Hexagon },
                    ].map(({ label, fn, icon: Icon }) => (
                      <Tooltip key={label}>
                        <TooltipTrigger asChild>
                          <button onClick={fn}
                            className="aspect-square flex flex-col items-center justify-center bg-white/5 hover:bg-white/15 rounded-xl transition-colors text-xs gap-1 p-2"
                            data-testid={`add-${label}`}>
                            <Icon className="w-5 h-5 text-white/70" />
                            <span className="text-white/50 text-[10px]">{label}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>إضافة {label}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>

                  <p className="text-xs text-white/40 font-bold px-1 pt-2">الترتيب والتحويل</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "للأمام", fn: bringForward, icon: ChevronUp },
                      { label: "للخلف", fn: sendBackward, icon: ChevronDown },
                      { label: "قلب أفقي", fn: flipH, icon: FlipHorizontal },
                      { label: "قلب عمودي", fn: flipV, icon: FlipVertical },
                      { label: "تكرار", fn: duplicateSelected, icon: Copy },
                      { label: "حذف", fn: deleteSelected, icon: Trash2 },
                    ].map(({ label, fn, icon: Icon }) => (
                      <button key={label} onClick={fn}
                        className="flex items-center gap-1.5 bg-white/5 hover:bg-white/15 rounded-lg p-2 text-xs text-white/70 hover:text-white transition-colors"
                        data-testid={`action-${label}`}>
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Text ── */}
              {leftTab === "text" && (
                <>
                  <p className="text-xs text-white/40 font-bold px-1 pt-1">أنماط النص</p>
                  <div className="space-y-2">
                    <button onClick={addHeading}
                      className="w-full text-right bg-white/5 hover:bg-white/15 rounded-xl px-3 py-3 transition-colors"
                      data-testid="add-heading">
                      <span className="text-lg font-black text-white">عنوان رئيسي</span>
                    </button>
                    <button onClick={addSubheading}
                      className="w-full text-right bg-white/5 hover:bg-white/15 rounded-xl px-3 py-3 transition-colors"
                      data-testid="add-subheading">
                      <span className="text-sm font-semibold text-white/70">عنوان فرعي</span>
                    </button>
                    <button onClick={() => addText("نص عادي هنا")}
                      className="w-full text-right bg-white/5 hover:bg-white/15 rounded-xl px-3 py-3 transition-colors"
                      data-testid="add-body">
                      <span className="text-xs text-white/50">نص عادي</span>
                    </button>
                  </div>
                  <p className="text-xs text-white/40 font-bold px-1 pt-2">نصوص جاهزة</p>
                  <div className="space-y-1.5">
                    {["مرحباً بكم!", "اتصل بنا الآن", "عرض محدود", "شركة كيروكس", "للتواصل: 05xxxxxxxx"].map(t => (
                      <button key={t} onClick={() => addText(t)}
                        className="w-full text-right text-xs bg-white/5 hover:bg-white/15 rounded-lg px-3 py-2 text-white/70 hover:text-white transition-colors"
                        data-testid={`quick-text-${t}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Images ── */}
              {leftTab === "images" && (
                <>
                  <p className="text-xs text-white/40 font-bold px-1 pt-1">رفع صورة</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl p-6 text-center transition-colors"
                    data-testid="button-upload-image">
                    <ImageIcon className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <p className="text-xs text-white/50">اضغط لرفع صورة</p>
                    <p className="text-[10px] text-white/30 mt-1">PNG, JPG, WEBP, GIF</p>
                  </button>
                  <p className="text-xs text-white/30 text-center py-2">أو اسحب الصورة مباشرة على الكانفاس</p>
                </>
              )}

              {/* ── Background ── */}
              {leftTab === "background" && (
                <>
                  <p className="text-xs text-white/40 font-bold px-1 pt-1">لون صلب</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_COLORS.map(c => (
                      <button key={c} onClick={() => setBackground(c)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${bgColor === c ? "border-blue-400 scale-110" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: c }}
                        data-testid={`bg-color-${c}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-xs text-white/50">مخصص:</label>
                    <input type="color" value={bgColor} onChange={e => setBackground(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                      data-testid="bg-custom-color" />
                  </div>

                  <p className="text-xs text-white/40 font-bold px-1 pt-3">تدرجات لونية</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {GRADIENT_PRESETS.map(g => (
                      <button key={g.label} onClick={() => setGradientBackground(g.colors)}
                        className="aspect-square rounded-xl hover:scale-105 transition-transform text-xs font-bold text-white/80 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }}
                        data-testid={`gradient-${g.label}`}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Templates ── */}
              {leftTab === "templates" && (
                <>
                  <p className="text-xs text-white/40 font-bold px-1 pt-1">قوالب جاهزة</p>
                  <div className="space-y-2">
                    {[
                      { key: "blank", label: "فارغ", desc: "ابدأ من الصفر", colors: ["#ffffff", "#f3f4f6"] },
                      { key: "gradient-dark", label: "داكن متدرج", desc: "تصميم احترافي", colors: ["#0f172a", "#1e293b"] },
                      { key: "modern-blue", label: "أزرق عصري", desc: "تصميم مقسّم", colors: ["#2563eb", "#eff6ff"] },
                      { key: "minimal", label: "مينيمال", desc: "بسيط وأنيق", colors: ["#fafafa", "#000000"] },
                      { key: "sunset", label: "غروب ملوّن", desc: "تصميم حيوي", colors: ["#f97316", "#ec4899"] },
                    ].map(t => (
                      <button key={t.key} onClick={() => applyTemplate(t.key)}
                        className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/15 rounded-xl p-3 transition-colors"
                        data-testid={`template-${t.key}`}>
                        <div className="w-12 h-9 rounded-lg flex-shrink-0 shadow"
                          style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }} />
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">{t.label}</p>
                          <p className="text-[10px] text-white/40">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Canvas Area ─────────────────────────────────────────── */}
          <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center overflow-hidden relative"
            style={{
              background: "radial-gradient(ellipse at center, #0d0d22 0%, #070710 100%)",
              backgroundImage: "radial-gradient(ellipse at center, #0d0d22 0%, #070710 100%), repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.025) 39px, rgba(255,255,255,0.025) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.025) 39px, rgba(255,255,255,0.025) 40px)",
            }}
            onClick={() => { setShowSizeMenu(false); setShowExportMenu(false); }}>
            {/* Zoom controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl px-3 py-1.5 z-10" style={{ background: "rgba(12,12,28,0.9)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
              <button onClick={() => { const c = fabricRef.current; if (!c) return; const z = Math.max(0.2, zoom - 0.1); setZoom(z); c.setZoom(scale * z); c.renderAll(); }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors" data-testid="button-zoom-out">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-white/60 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => { const c = fabricRef.current; if (!c) return; const z = Math.min(3, zoom + 0.1); setZoom(z); c.setZoom(scale * z); c.renderAll(); }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors" data-testid="button-zoom-in">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { const c = fabricRef.current; if (!c) return; setZoom(1); c.setZoom(scale); c.setViewportTransform([scale, 0, 0, scale, 0, 0]); c.renderAll(); }}
                className="text-xs text-white/40 hover:text-white px-2 py-0.5 rounded transition-colors">
                مطابقة
              </button>
            </div>

            <canvas ref={canvasEl}
              style={{
                boxShadow: "0 0 0 1px rgba(6,182,212,0.15), 0 8px 32px rgba(0,0,0,0.7), 0 0 60px rgba(6,182,212,0.06)",
                borderRadius: 4,
              }} />
          </div>

          {/* ── Right Panel ─────────────────────────────────────────── */}
          <div className="w-60 flex-shrink-0 flex flex-col overflow-hidden" style={{ background: "rgba(12,12,28,0.98)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Right tabs */}
            <div className="flex flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                { key: "properties", label: "خصائص" },
                { key: "layers", label: "طبقات" },
              ].map(t => (
                <button key={t.key} onClick={() => setRightTab(t.key as any)}
                  className={`flex-1 text-xs py-2.5 font-bold transition-all`}
                  style={rightTab === t.key ? { color: "#06b6d4", borderBottom: "2px solid #06b6d4" } : { color: "rgba(255,255,255,0.35)", borderBottom: "2px solid transparent" }}
                  data-testid={`tab-right-${t.key}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* ── Properties Panel ── */}
              {rightTab === "properties" && (
                <>
                  {!selectedObj ? (
                    <div className="text-center py-8 text-white/30">
                      <Square className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">اختر عنصراً لرؤية خصائصه</p>
                    </div>
                  ) : (
                    <>
                      {/* Position & Size */}
                      <div>
                        <p className="text-[10px] text-white/40 font-bold mb-2">الموضع والحجم</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "X", key: "x" }, { label: "Y", key: "y" },
                            { label: "W", key: "w" }, { label: "H", key: "h" },
                          ].map(({ label, key }) => (
                            <div key={key}>
                              <label className="text-[10px] text-white/30 block mb-0.5">{label}</label>
                              <input type="number" value={(objProps as any)[key]}
                                onChange={e => updateObjProp(key, parseFloat(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center outline-none focus:border-blue-500"
                                data-testid={`prop-${key}`} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rotation & Opacity */}
                      <div>
                        <p className="text-[10px] text-white/40 font-bold mb-2">التدوير والشفافية</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-white/30 block mb-0.5">دوران°</label>
                            <input type="number" value={objProps.angle}
                              onChange={e => updateObjProp("angle", parseFloat(e.target.value) || 0)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center outline-none focus:border-blue-500"
                              data-testid="prop-angle" />
                          </div>
                          <div>
                            <label className="text-[10px] text-white/30 block mb-0.5">شفافية%</label>
                            <input type="number" value={objProps.opacity} min={0} max={100}
                              onChange={e => updateObjProp("opacity", parseFloat(e.target.value) || 0)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center outline-none focus:border-blue-500"
                              data-testid="prop-opacity" />
                          </div>
                        </div>
                        <div className="mt-2">
                          <Slider value={[objProps.opacity]} min={0} max={100} step={1}
                            onValueChange={([v]) => updateObjProp("opacity", v)} className="mt-1" />
                        </div>
                      </div>

                      {/* Fill & Stroke */}
                      {selectedObj.type !== "i-text" && (
                        <div>
                          <p className="text-[10px] text-white/40 font-bold mb-2">الألوان</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input type="color" value={typeof objProps.fill === "string" ? objProps.fill : "#000000"}
                                onChange={e => updateObjProp("fill", e.target.value)}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/20"
                                data-testid="prop-fill" />
                              <div className="flex-1">
                                <label className="text-[10px] text-white/30 block">لون التعبئة</label>
                                <input type="text" value={typeof objProps.fill === "string" ? objProps.fill : "#000000"}
                                  onChange={e => updateObjProp("fill", e.target.value)}
                                  className="w-full bg-transparent text-xs text-white/70 outline-none" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="color" value={objProps.stroke === "transparent" ? "#000000" : objProps.stroke}
                                onChange={e => updateObjProp("stroke", e.target.value)}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/20"
                                data-testid="prop-stroke" />
                              <div className="flex-1">
                                <label className="text-[10px] text-white/30 block">حد الإطار</label>
                                <input type="number" value={objProps.strokeWidth} min={0} max={50}
                                  onChange={e => updateObjProp("strokeWidth", parseInt(e.target.value) || 0)}
                                  className="w-full bg-transparent text-xs text-white/70 outline-none" placeholder="سُمك الحد"
                                  data-testid="prop-stroke-width" />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-5 gap-1 mt-2">
                            {PRESET_COLORS.slice(0, 10).map(c => (
                              <button key={c} onClick={() => updateObjProp("fill", c)}
                                className="aspect-square rounded-md border border-white/10 hover:scale-110 transition-transform"
                                style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Text properties */}
                      {isText && (
                        <div>
                          <p className="text-[10px] text-white/40 font-bold mb-2">خصائص النص</p>
                          <div className="space-y-2">
                            {/* Color */}
                            <div className="flex items-center gap-2">
                              <input type="color" value={typeof objProps.fill === "string" ? objProps.fill : "#000000"}
                                onChange={e => updateObjProp("fill", e.target.value)}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/20"
                                data-testid="prop-text-color" />
                              <label className="text-[10px] text-white/30">لون النص</label>
                            </div>
                            {/* Font size */}
                            <div>
                              <label className="text-[10px] text-white/30 block mb-0.5">حجم الخط</label>
                              <input type="number" value={objProps.fontSize} min={8} max={300}
                                onChange={e => updateObjProp("fontSize", parseInt(e.target.value) || 16)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center outline-none focus:border-blue-500"
                                data-testid="prop-font-size" />
                            </div>
                            {/* Font family */}
                            <div>
                              <label className="text-[10px] text-white/30 block mb-0.5">نوع الخط</label>
                              <select value={objProps.fontFamily}
                                onChange={e => updateObjProp("fontFamily", e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                                data-testid="prop-font-family"
                                style={{ fontFamily: objProps.fontFamily }}>
                                {GOOGLE_FONTS.map(f => (
                                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                                ))}
                              </select>
                            </div>
                            {/* Style buttons */}
                            <div className="flex gap-1">
                              {[
                                { label: "B", key: "fontWeight", active: objProps.fontWeight === "bold", toggle: () => updateObjProp("fontWeight", objProps.fontWeight === "bold" ? "normal" : "bold"), style: "font-black" },
                                { label: "I", key: "fontStyle", active: objProps.fontStyle === "italic", toggle: () => updateObjProp("fontStyle", objProps.fontStyle === "italic" ? "normal" : "italic"), style: "italic" },
                                { label: "U", key: "textDecoration", active: objProps.textDecoration === "underline", toggle: () => updateObjProp("textDecoration", objProps.textDecoration === "underline" ? "" : "underline"), style: "underline" },
                              ].map(btn => (
                                <button key={btn.key} onClick={btn.toggle}
                                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${btn.style} ${btn.active ? "bg-blue-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/15"}`}
                                  data-testid={`prop-${btn.key}`}>
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                            {/* Alignment */}
                            <div className="flex gap-1">
                              {[
                                { val: "right", icon: AlignRight },
                                { val: "center", icon: AlignCenter },
                                { val: "left", icon: AlignLeft },
                              ].map(({ val, icon: Icon }) => (
                                <button key={val} onClick={() => updateObjProp("textAlign", val)}
                                  className={`flex-1 py-1.5 flex items-center justify-center rounded-lg transition-colors ${objProps.textAlign === val ? "bg-blue-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/15"}`}
                                  data-testid={`align-${val}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick actions */}
                      <div className="flex gap-2 pt-1">
                        <button onClick={duplicateSelected}
                          className="flex-1 flex items-center justify-center gap-1 bg-white/5 hover:bg-white/15 rounded-lg py-2 text-xs text-white/60 hover:text-white transition-colors"
                          data-testid="prop-duplicate">
                          <Copy className="w-3.5 h-3.5" /> تكرار
                        </button>
                        <button onClick={deleteSelected}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 rounded-lg py-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                          data-testid="prop-delete">
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── Layers Panel ── */}
              {rightTab === "layers" && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-white/40 font-bold">الطبقات ({layers.length})</p>
                  </div>
                  {layers.length === 0 ? (
                    <div className="text-center py-8 text-white/20">
                      <Layers className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">لا توجد عناصر</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {layers.map((layer, idx) => (
                        <div key={layer.id + idx}
                          onClick={() => selectLayerObj(layer.obj)}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${selectedObj === layer.obj ? "bg-blue-600/30 border border-blue-500/30" : "hover:bg-white/10 border border-transparent"}`}
                          data-testid={`layer-${idx}`}>
                          <button onClick={e => { e.stopPropagation(); toggleLayerVisibility(layer.obj); }}
                            className="text-white/30 hover:text-white flex-shrink-0">
                            {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/80 truncate">{layer.name}</p>
                            <p className="text-[10px] text-white/30">{layer.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
