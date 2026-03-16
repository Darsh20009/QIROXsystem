import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Calculator, FileText, Globe, Heart, Users, TrendingUp,
  Share2, Video, Copy, Check, Loader2, AlertTriangle, ChevronRight,
  BarChart3, Clock, DollarSign, Zap, Shield, Star, Wand2, Bot, MessageSquare, Wrench
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AIPanel } from "@/components/QiroxAI";

type ToolId = "estimate" | "proposal" | "website" | "sentiment" | "assignment" | "delay" | "social" | "meeting";

interface Tool {
  id: ToolId;
  icon: any;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  color: string;
  gradient: string;
}

const TOOLS: Tool[] = [
  { id: "estimate", icon: Calculator, titleAr: "تقدير المشاريع", titleEn: "Project Estimator", descAr: "سعر وجدول زمني فوري", descEn: "Instant price & timeline", color: "text-blue-400", gradient: "from-blue-600/20 to-blue-500/5" },
  { id: "proposal", icon: FileText, titleAr: "كاتب العقود", titleEn: "Proposal Writer", descAr: "عروض أسعار احترافية", descEn: "Professional proposals", color: "text-purple-400", gradient: "from-purple-600/20 to-purple-500/5" },
  { id: "website", icon: Globe, titleAr: "محلل المواقع", titleEn: "Website Analyzer", descAr: "تقرير SEO وأداء", descEn: "SEO & performance report", color: "text-green-400", gradient: "from-green-600/20 to-green-500/5" },
  { id: "sentiment", icon: Heart, titleAr: "مشاعر العملاء", titleEn: "Sentiment Analysis", descAr: "كشف التذمر قبل الفقدان", descEn: "Detect frustration early", color: "text-rose-400", gradient: "from-rose-600/20 to-rose-500/5" },
  { id: "assignment", icon: Users, titleAr: "توزيع المهام", titleEn: "Smart Assignment", descAr: "أفضل موظف لكل مهمة", descEn: "Best employee per task", color: "text-amber-400", gradient: "from-amber-600/20 to-amber-500/5" },
  { id: "delay", icon: TrendingUp, titleAr: "توقع التأخير", titleEn: "Delay Predictor", descAr: "إنذار مبكر للمشاريع", descEn: "Early warning for projects", color: "text-orange-400", gradient: "from-orange-600/20 to-orange-500/5" },
  { id: "social", icon: Share2, titleAr: "محتوى السوشيال", titleEn: "Social Generator", descAr: "منشورات احتفالية تلقائية", descEn: "Auto celebration posts", color: "text-pink-400", gradient: "from-pink-600/20 to-pink-500/5" },
  { id: "meeting", icon: Video, titleAr: "ملخص الاجتماعات", titleEn: "Meeting Summary", descAr: "تلخيص ومهام تلقائية", descEn: "Summary & auto tasks", color: "text-cyan-400", gradient: "from-cyan-600/20 to-cyan-500/5" },
];

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return { copied, copy };
}

/* ────────────────── Tool Panels ────────────────── */

function EstimatePanel({ L }: { L: boolean }) {
  const [desc, setDesc] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const mut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/estimate-project", { description: desc }),
    onSuccess: (data: any) => setResult(data),
    onError: () => toast({ title: L ? "خطأ" : "Error", variant: "destructive" }),
  });

  const pkgLabel: Record<string, string> = { lite: "لايت", pro: "برو", infinite: "إنفينيت" };
  const complexityColor: Record<string, string> = { low: "bg-green-500/20 text-green-400", medium: "bg-amber-500/20 text-amber-400", high: "bg-red-500/20 text-red-400" };

  return (
    <div className="space-y-5">
      <Textarea
        placeholder={L ? "اصف مشروعك بالتفصيل... مثلاً: موقع لمطعم فاخر مع قائمة طعام، طلبات أون لاين، متابعة سائقين، وتطبيق جوال" : "Describe your project in detail..."}
        className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
        value={desc} onChange={e => setDesc(e.target.value)}
        data-testid="input-project-description"
      />
      <Button onClick={() => mut.mutate()} disabled={!desc.trim() || mut.isPending} className="w-full bg-blue-600 hover:bg-blue-500 h-11 font-bold" data-testid="button-estimate">
        {mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{L ? "جاري التقدير..." : "Estimating..."}</> : <><Calculator className="h-4 w-4 me-2" />{L ? "احسب التقدير الذكي" : "Calculate Smart Estimate"}</>}
      </Button>
      <AnimatePresence>
        {result && !result.error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                <DollarSign className="h-5 w-5 text-green-400 mx-auto mb-1" />
                <div className="text-xs text-white/50 mb-1">{L ? "نطاق السعر" : "Price Range"}</div>
                <div className="text-green-400 font-bold text-sm">{(result.minPrice || 0).toLocaleString()} - {(result.maxPrice || 0).toLocaleString()}</div>
                <div className="text-white/40 text-xs">{L ? "ريال" : "SAR"}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                <Clock className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                <div className="text-xs text-white/50 mb-1">{L ? "المدة" : "Duration"}</div>
                <div className="text-blue-400 font-bold text-sm">{result.duration}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                <Star className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <div className="text-xs text-white/50 mb-1">{L ? "الباقة" : "Package"}</div>
                <div className="text-purple-400 font-bold text-sm">{pkgLabel[result.package] || result.package}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                <Shield className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                <div className="text-xs text-white/50 mb-1">{L ? "الدقة" : "Confidence"}</div>
                <div className="text-amber-400 font-bold text-sm">{result.confidence}%</div>
              </div>
            </div>
            {result.team && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-sm font-semibold text-white/70 mb-3">{L ? "الفريق المقترح" : "Suggested Team"}</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.team).filter(([, v]) => (v as number) > 0).map(([role, count]) => (
                    <Badge key={role} className="bg-white/10 text-white border-white/10">{count as number} {role}</Badge>
                  ))}
                  {result.complexity && <Badge className={complexityColor[result.complexity] || ""}>{L ? "تعقيد" : "Complexity"}: {result.complexity}</Badge>}
                </div>
              </div>
            )}
            {result.breakdown && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-sm font-semibold text-white/70 mb-3">{L ? "توزيع الجهد" : "Effort Breakdown"}</div>
                <div className="space-y-2">
                  {Object.entries(result.breakdown).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3">
                      <div className="text-white/50 text-xs w-20">{k}</div>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: v as string }} />
                      </div>
                      <div className="text-white/60 text-xs w-10">{v as string}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.notes && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-200 text-sm">{result.notes}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProposalPanel({ L }: { L: boolean }) {
  const [form, setForm] = useState({ clientName: "", projectType: "", package: "pro", budget: "", features: "", language: "ar" });
  const [result, setResult] = useState("");
  const { copy, copied } = useCopy();
  const { toast } = useToast();
  const mut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/generate-proposal", form),
    onSuccess: (data: any) => setResult(data.proposal || ""),
    onError: () => toast({ title: L ? "خطأ" : "Error", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">{L ? "اسم العميل" : "Client Name"}</label>
          <Input placeholder={L ? "أحمد العمري" : "John Smith"} className="bg-white/5 border-white/10 text-white" value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} data-testid="input-client-name" />
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">{L ? "نوع المشروع" : "Project Type"}</label>
          <Input placeholder={L ? "متجر إلكتروني" : "E-commerce store"} className="bg-white/5 border-white/10 text-white" value={form.projectType} onChange={e => setForm(p => ({ ...p, projectType: e.target.value }))} data-testid="input-project-type" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">{L ? "الباقة" : "Package"}</label>
          <Select value={form.package} onValueChange={v => setForm(p => ({ ...p, package: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-package"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="lite">لايت</SelectItem><SelectItem value="pro">برو</SelectItem><SelectItem value="infinite">إنفينيت</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">{L ? "الميزانية (ريال)" : "Budget (SAR)"}</label>
          <Input placeholder="12,000" className="bg-white/5 border-white/10 text-white" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} data-testid="input-budget" />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">{L ? "المميزات المطلوبة" : "Required Features"}</label>
        <Textarea placeholder={L ? "لوحة تحكم، تطبيق جوال، ربط مع شيب..." : "Dashboard, mobile app, shipping integration..."} className="bg-white/5 border-white/10 text-white resize-none min-h-[80px]" value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} data-testid="input-features" />
      </div>
      <div className="flex gap-2">
        <Button variant={form.language === "ar" ? "default" : "outline"} size="sm" onClick={() => setForm(p => ({ ...p, language: "ar" }))} className={form.language === "ar" ? "bg-purple-600" : "border-white/10 text-white/60"} data-testid="button-lang-ar">عربي</Button>
        <Button variant={form.language === "en" ? "default" : "outline"} size="sm" onClick={() => setForm(p => ({ ...p, language: "en" }))} className={form.language === "en" ? "bg-purple-600" : "border-white/10 text-white/60"} data-testid="button-lang-en">English</Button>
      </div>
      <Button onClick={() => mut.mutate()} disabled={!form.clientName || !form.projectType || mut.isPending} className="w-full bg-purple-600 hover:bg-purple-500 h-11 font-bold" data-testid="button-generate-proposal">
        {mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{L ? "جاري الكتابة..." : "Writing..."}</> : <><Wand2 className="h-4 w-4 me-2" />{L ? "اكتب المقترح" : "Write Proposal"}</>}
      </Button>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-xl p-5 relative">
            <Button size="sm" variant="ghost" onClick={() => copy(result)} className="absolute top-3 end-3 text-white/40 hover:text-white" data-testid="button-copy-proposal">
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </Button>
            <pre className="text-white/80 text-sm whitespace-pre-wrap font-sans leading-relaxed" data-testid="text-proposal">{result}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WebsitePanel({ L }: { L: boolean }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const mut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/analyze-website", { url }),
    onSuccess: (data: any) => setResult(data),
    onError: () => toast({ title: L ? "خطأ" : "Error", variant: "destructive" }),
  });

  const scoreColor = (s: number) => s >= 80 ? "text-green-400" : s >= 60 ? "text-amber-400" : "text-red-400";
  const scoreGradient = (s: number) => s >= 80 ? "from-green-500" : s >= 60 ? "from-amber-500" : "from-red-500";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="https://example.com" className="bg-white/5 border-white/10 text-white flex-1" value={url} onChange={e => setUrl(e.target.value)} data-testid="input-website-url" />
        <Button onClick={() => mut.mutate()} disabled={!url.trim() || mut.isPending} className="bg-green-600 hover:bg-green-500 px-6" data-testid="button-analyze-website">
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
        </Button>
      </div>
      <AnimatePresence>
        {mut.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 rounded-xl p-6 text-center">
            <Loader2 className="h-8 w-8 text-green-400 animate-spin mx-auto mb-3" />
            <p className="text-white/50 text-sm">{L ? "جاري تحليل الموقع... قد يستغرق دقيقة" : "Analyzing website... may take a moment"}</p>
          </motion.div>
        )}
        {result && !result.error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "SEO", key: "seoScore" }, { label: L ? "السرعة" : "Speed", key: "speedScore" },
                { label: L ? "التصميم" : "Design", key: "designScore" }, { label: L ? "الجوال" : "Mobile", key: "mobileScore" },
              ].map(({ label, key }) => (
                <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-xs text-white/50 mb-2">{label}</div>
                  <div className={`text-2xl font-bold ${scoreColor(result[key] || 0)}`}>{result[key] || 0}</div>
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${result[key] || 0}%` }} transition={{ delay: 0.3 }} className={`h-full bg-gradient-to-r ${scoreGradient(result[key] || 0)} to-transparent rounded-full`} />
                  </div>
                </div>
              ))}
            </div>
            {result.overallScore && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <span className="text-white/70 font-semibold">{L ? "النقاط الكلية" : "Overall Score"}</span>
                <span className={`text-3xl font-bold ${scoreColor(result.overallScore)}`}>{result.overallScore}/100</span>
              </div>
            )}
            {result.issues?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="text-red-400 font-semibold text-sm mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{L ? "نقاط الضعف" : "Issues"}</div>
                <ul className="space-y-1">{result.issues.map((i: string, idx: number) => <li key={idx} className="text-red-200/70 text-sm">• {i}</li>)}</ul>
              </div>
            )}
            {result.suggestions?.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="text-green-400 font-semibold text-sm mb-2">{L ? "الاقتراحات" : "Suggestions"}</div>
                <ul className="space-y-1">{result.suggestions.map((s: string, idx: number) => <li key={idx} className="text-green-200/70 text-sm">✓ {s}</li>)}</ul>
              </div>
            )}
            {result.salesPitch && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="text-purple-400 font-semibold text-sm mb-1 flex items-center gap-2"><Zap className="h-4 w-4" />{L ? "ماذا تعرض على العميل" : "Your Sales Pitch"}</div>
                <p className="text-purple-200/80 text-sm">{result.salesPitch}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SentimentPanel({ L }: { L: boolean }) {
  const [text, setText] = useState("");
  const [clientName, setClientName] = useState("");
  const [result, setResult] = useState<any>(null);
  const { copy, copied } = useCopy();
  const { toast } = useToast();
  const mut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/analyze-sentiment", { text, clientName }),
    onSuccess: (data: any) => setResult(data),
    onError: () => toast({ title: L ? "خطأ" : "Error", variant: "destructive" }),
  });

  const sentimentConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    positive: { label: L ? "إيجابي 😊" : "Positive 😊", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
    neutral: { label: L ? "محايد 😐" : "Neutral 😐", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
    negative: { label: L ? "سلبي 😟" : "Negative 😟", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    urgent: { label: L ? "عاجل 🚨" : "Urgent 🚨", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  };

  return (
    <div className="space-y-4">
      <Input placeholder={L ? "اسم العميل (اختياري)" : "Client name (optional)"} className="bg-white/5 border-white/10 text-white" value={clientName} onChange={e => setClientName(e.target.value)} data-testid="input-sentiment-client" />
      <Textarea placeholder={L ? "الصق رسالة العميل هنا..." : "Paste client message here..."} className="min-h-[120px] bg-white/5 border-white/10 text-white resize-none" value={text} onChange={e => setText(e.target.value)} data-testid="input-sentiment-text" />
      <Button onClick={() => mut.mutate()} disabled={!text.trim() || mut.isPending} className="w-full bg-rose-600 hover:bg-rose-500 h-11 font-bold" data-testid="button-analyze-sentiment">
        {mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{L ? "جاري التحليل..." : "Analyzing..."}</> : <><Heart className="h-4 w-4 me-2" />{L ? "حلّل المشاعر" : "Analyze Sentiment"}</>}
      </Button>
      <AnimatePresence>
        {result && !result.error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {(() => {
              const cfg = sentimentConfig[result.sentiment] || sentimentConfig.neutral;
              return (
                <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`text-2xl font-bold ${cfg.color}`}>{cfg.label}</div>
                    <div className={`text-sm ${cfg.color}`}>{Math.round((result.score || 0.5) * 100)}% {L ? "ثقة" : "confidence"}</div>
                  </div>
                  {result.summary && <p className="text-white/70 text-sm mb-3">{result.summary}</p>}
                  {result.alert && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-3 flex items-center gap-2 text-red-300 text-sm">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      {L ? "تنبيه: يحتاج هذا العميل انتباهاً فورياً!" : "Alert: This client needs immediate attention!"}
                    </div>
                  )}
                  {result.recommendation && (
                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <div className="text-xs text-white/50 mb-1">{L ? "توصية للفريق" : "Team Recommendation"}</div>
                      <p className="text-white/70 text-sm">{result.recommendation}</p>
                    </div>
                  )}
                  {result.suggestedResponse && (
                    <div className="bg-white/5 rounded-lg p-3 relative">
                      <div className="text-xs text-white/50 mb-1">{L ? "مقترح رد على العميل" : "Suggested Reply"}</div>
                      <p className="text-white/70 text-sm pe-8">{result.suggestedResponse}</p>
                      <button onClick={() => copy(result.suggestedResponse)} className="absolute top-3 end-3 text-white/30 hover:text-white" data-testid="button-copy-reply">
                        {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssignmentPanel({ L }: { L: boolean }) {
  const [task, setTask] = useState("");
  const [skills, setSkills] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const mut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/suggest-assignment", { taskDescription: task, skills }),
    onSuccess: (data: any) => setResult(data),
    onError: () => toast({ title: L ? "خطأ" : "Error", variant: "destructive" }),
  });

  const riskColor: Record<string, string> = { low: "text-green-400 bg-green-500/10", medium: "text-amber-400 bg-amber-500/10", high: "text-red-400 bg-red-500/10" };

  return (
    <div className="space-y-4">
      <Textarea placeholder={L ? "اصف المهمة... مثلاً: تصميم واجهة تسجيل دخول عربية وإنجليزية مع دعم الوضع الليلي" : "Describe the task..."} className="min-h-[100px] bg-white/5 border-white/10 text-white resize-none" value={task} onChange={e => setTask(e.target.value)} data-testid="input-task-description" />
      <Input placeholder={L ? "المهارات المطلوبة (مثال: React, UI/UX, APIs)" : "Required skills (e.g., React, UI/UX, APIs)"} className="bg-white/5 border-white/10 text-white" value={skills} onChange={e => setSkills(e.target.value)} data-testid="input-skills" />
      <Button onClick={() => mut.mutate()} disabled={!task.trim() || mut.isPending} className="w-full bg-amber-600 hover:bg-amber-500 h-11 font-bold" data-testid="button-suggest-assignment">
        {mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{L ? "جاري التحليل..." : "Analyzing..."}</> : <><Users className="h-4 w-4 me-2" />{L ? "اقترح أفضل موظف" : "Suggest Best Employee"}</>}
      </Button>
      <AnimatePresence>
        {result && !result.error && result.suggestions?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="text-xs text-white/50 font-semibold uppercase tracking-wider">{L ? "أفضل 3 موظفين للمهمة" : "Top 3 Employees for Task"}</div>
            {result.suggestions.map((s: any, i: number) => (
              <div key={s.employeeId || i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
                <div className={`text-xl font-black ${i === 0 ? "text-amber-400" : "text-white/30"} w-6 flex-shrink-0`}>#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{s.name}</span>
                    <Badge className="bg-white/10 text-white/70 border-white/10 text-xs">{s.role}</Badge>
                    {s.workloadRisk && <span className={`text-xs px-2 py-0.5 rounded-full ${riskColor[s.workloadRisk]}`}>{s.workloadRisk}</span>}
                  </div>
                  <p className="text-white/60 text-sm">{s.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-amber-400">{s.score}%</div>
                  <div className="text-xs text-white/30">{L ? "توافق" : "match"}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DelayPanel({ L }: { L: boolean }) {
  const [projectId, setProjectId] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const { data: projects } = useQuery<any[]>({ queryKey: ["/api/projects"] });
  const mut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/predict-delay", { projectId }),
    onSuccess: (data: any) => setResult(data),
    onError: () => toast({ title: L ? "خطأ" : "Error", variant: "destructive" }),
  });

  const riskConfig: Record<string, { color: string; bg: string; label: string }> = {
    low: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", label: L ? "منخفض 🟢" : "Low Risk 🟢" },
    medium: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: L ? "متوسط 🟡" : "Medium Risk 🟡" },
    high: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", label: L ? "عالي 🟠" : "High Risk 🟠" },
    critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: L ? "حرج 🔴" : "Critical 🔴" },
  };

  return (
    <div className="space-y-4">
      <Select value={projectId} onValueChange={setProjectId}>
        <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-project">
          <SelectValue placeholder={L ? "اختر المشروع" : "Select Project"} />
        </SelectTrigger>
        <SelectContent>
          {(projects || []).map((p: any) => (
            <SelectItem key={p._id || p.id} value={p._id || p.id}>{p.name}</SelectItem>
          ))}
          {(!projects || projects.length === 0) && <SelectItem value="demo">Demo Project</SelectItem>}
        </SelectContent>
      </Select>
      <Button onClick={() => mut.mutate()} disabled={!projectId || mut.isPending} className="w-full bg-orange-600 hover:bg-orange-500 h-11 font-bold" data-testid="button-predict-delay">
        {mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{L ? "جاري التحليل..." : "Analyzing..."}</> : <><TrendingUp className="h-4 w-4 me-2" />{L ? "توقع المخاطر" : "Predict Risks"}</>}
      </Button>
      <AnimatePresence>
        {result && !result.error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {(() => {
              const cfg = riskConfig[result.riskLevel] || riskConfig.medium;
              return (
                <div className={`border rounded-xl p-5 ${cfg.bg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</div>
                    {result.delayProbability != null && (
                      <div className={`${cfg.color} text-sm`}>{result.delayProbability}% {L ? "احتمال تأخير" : "delay probability"}</div>
                    )}
                  </div>
                  {result.estimatedDelay && <div className="text-white/70 text-sm mb-3">{L ? "التأخير المتوقع:" : "Estimated Delay:"} <span className={`font-semibold ${cfg.color}`}>{result.estimatedDelay}</span></div>}
                  {result.project && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white/5 rounded-lg p-2 text-center"><div className="text-xs text-white/40">{L ? "تقدم" : "Progress"}</div><div className="text-white font-bold">{result.project.progress}%</div></div>
                      <div className="bg-white/5 rounded-lg p-2 text-center"><div className="text-xs text-white/40">{L ? "متأخرة" : "Overdue"}</div><div className="text-red-400 font-bold">{result.project.overdueTasks}</div></div>
                      <div className="bg-white/5 rounded-lg p-2 text-center"><div className="text-xs text-white/40">{L ? "المهام" : "Tasks"}</div><div className="text-white font-bold">{result.project.doneTasks}/{result.project.totalTasks}</div></div>
                    </div>
                  )}
                  {result.verdict && <p className="text-white/70 text-sm italic border-t border-white/10 pt-3 mt-2">{result.verdict}</p>}
                  {result.reasons?.length > 0 && (
                    <div className="mt-3 space-y-1">{result.reasons.map((r: string, i: number) => <div key={i} className="text-white/60 text-sm">⚠️ {r}</div>)}</div>
                  )}
                  {result.suggestions?.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-white/10 pt-3">{result.suggestions.map((s: string, i: number) => <div key={i} className="text-white/60 text-sm">💡 {s}</div>)}</div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SocialPanel({ L }: { L: boolean }) {
  const [form, setForm] = useState({ projectName: "", clientName: "", service: "", result: "" });
  const [output, setOutput] = useState<any>(null);
  const { copy, copied } = useCopy();
  const [copied2, setCopied2] = useState(false);
  const { toast } = useToast();
  const mut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/generate-social", form),
    onSuccess: (data: any) => setOutput(data),
    onError: () => toast({ title: L ? "خطأ" : "Error", variant: "destructive" }),
  });

  const copyEn = (text: string) => { navigator.clipboard.writeText(text); setCopied2(true); setTimeout(() => setCopied2(false), 2000); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">{L ? "اسم المشروع" : "Project Name"}</label>
          <Input placeholder={L ? "متجر النخيل" : "Palm Store"} className="bg-white/5 border-white/10 text-white" value={form.projectName} onChange={e => setForm(p => ({ ...p, projectName: e.target.value }))} data-testid="input-social-project" />
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">{L ? "اسم العميل" : "Client Name"}</label>
          <Input placeholder={L ? "عميلنا المميز" : "Our valued client"} className="bg-white/5 border-white/10 text-white" value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} data-testid="input-social-client" />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">{L ? "الخدمة" : "Service"}</label>
        <Input placeholder={L ? "متجر إلكتروني + تطبيق جوال" : "E-commerce + Mobile App"} className="bg-white/5 border-white/10 text-white" value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))} data-testid="input-social-service" />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">{L ? "النتيجة (اختياري)" : "Result (optional)"}</label>
        <Input placeholder={L ? "زيادة المبيعات 40% خلال أول شهر" : "40% sales increase in first month"} className="bg-white/5 border-white/10 text-white" value={form.result} onChange={e => setForm(p => ({ ...p, result: e.target.value }))} data-testid="input-social-result" />
      </div>
      <Button onClick={() => mut.mutate()} disabled={!form.projectName || mut.isPending} className="w-full bg-pink-600 hover:bg-pink-500 h-11 font-bold" data-testid="button-generate-social">
        {mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{L ? "جاري التوليد..." : "Generating..."}</> : <><Share2 className="h-4 w-4 me-2" />{L ? "ولّد المنشور" : "Generate Post"}</>}
      </Button>
      <AnimatePresence>
        {output && !output.error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {output.arabic && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative" dir="rtl">
                <div className="text-xs text-white/40 mb-2 font-semibold">🇸🇦 النسخة العربية</div>
                <p className="text-white/80 text-sm leading-relaxed pe-8">{output.arabic.caption}</p>
                <div className="flex flex-wrap gap-1 mt-3">{(output.arabic.hashtags || []).map((h: string, i: number) => <span key={i} className="text-pink-400 text-xs">{h}</span>)}</div>
                <button onClick={() => copy(`${output.arabic.caption}\n\n${(output.arabic.hashtags || []).join(" ")}`)} className="absolute top-4 start-4 text-white/30 hover:text-white" data-testid="button-copy-arabic">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
            {output.english && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative" dir="ltr">
                <div className="text-xs text-white/40 mb-2 font-semibold">🇬🇧 English Version</div>
                <p className="text-white/80 text-sm leading-relaxed pe-8">{output.english.caption}</p>
                <div className="flex flex-wrap gap-1 mt-3">{(output.english.hashtags || []).map((h: string, i: number) => <span key={i} className="text-pink-400 text-xs">{h}</span>)}</div>
                <button onClick={() => copyEn(`${output.english.caption}\n\n${(output.english.hashtags || []).join(" ")}`)} className="absolute top-4 end-4 text-white/30 hover:text-white" data-testid="button-copy-english">
                  {copied2 ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MeetingPanel({ L }: { L: boolean }) {
  const [transcript, setTranscript] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const { data: projects } = useQuery<any[]>({ queryKey: ["/api/projects"] });
  const mut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/meeting-summary", { transcript, meetingTitle, projectId: projectId || undefined }),
    onSuccess: (data: any) => setResult(data),
    onError: () => toast({ title: L ? "خطأ" : "Error", variant: "destructive" }),
  });

  const priorityColor: Record<string, string> = { high: "text-red-400 bg-red-500/10", medium: "text-amber-400 bg-amber-500/10", low: "text-green-400 bg-green-500/10" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">{L ? "عنوان الاجتماع" : "Meeting Title"}</label>
          <Input placeholder={L ? "اجتماع مراجعة المشروع" : "Project Review Meeting"} className="bg-white/5 border-white/10 text-white" value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} data-testid="input-meeting-title" />
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">{L ? "ربط بمشروع (اختياري)" : "Link to Project (optional)"}</label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-meeting-project"><SelectValue placeholder={L ? "مشروع..." : "Project..."} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{L ? "بدون ربط" : "No link"}</SelectItem>
              {(projects || []).map((p: any) => <SelectItem key={p._id || p.id} value={p._id || p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Textarea placeholder={L ? "الصق محتوى الاجتماع أو النقاط التي تمت مناقشتها..." : "Paste meeting content or discussion points..."} className="min-h-[150px] bg-white/5 border-white/10 text-white resize-none" value={transcript} onChange={e => setTranscript(e.target.value)} data-testid="input-meeting-transcript" />
      <Button onClick={() => mut.mutate()} disabled={!transcript.trim() || mut.isPending} className="w-full bg-cyan-600 hover:bg-cyan-500 h-11 font-bold" data-testid="button-summarize-meeting">
        {mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{L ? "جاري التلخيص..." : "Summarizing..."}</> : <><Video className="h-4 w-4 me-2" />{L ? "لخّص الاجتماع" : "Summarize Meeting"}</>}
      </Button>
      <AnimatePresence>
        {result && !result.error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {result.summary && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-xs text-white/50 mb-2 font-semibold">{L ? "الملخص" : "Summary"}</div>
                <p className="text-white/80 text-sm leading-relaxed">{result.summary}</p>
              </div>
            )}
            {result.keyDecisions?.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="text-blue-400 text-xs font-semibold mb-2">📋 {L ? "القرارات الرئيسية" : "Key Decisions"}</div>
                <ul className="space-y-1">{result.keyDecisions.map((d: string, i: number) => <li key={i} className="text-white/70 text-sm">• {d}</li>)}</ul>
              </div>
            )}
            {result.actionItems?.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="text-green-400 text-xs font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  {L ? "المهام المستخلصة" : "Action Items"}
                  {result.tasksCreated && <Badge className="bg-green-600/30 text-green-300 text-xs">{result.tasksCreated} {L ? "مهمة أُنشئت" : "tasks created"}</Badge>}
                </div>
                <div className="space-y-2">
                  {result.actionItems.map((item: any, i: number) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3 flex items-start gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${priorityColor[item.priority] || priorityColor.medium}`}>{item.priority}</span>
                      <div>
                        <div className="text-white/80 text-sm font-medium">{item.task}</div>
                        {item.assignee && <div className="text-white/40 text-xs">{item.assignee} • {item.dueDate}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────── Main Page ────────────────── */

export default function AIStudio() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const { data: user } = useUser();
  const [activeTool, setActiveTool] = useState<ToolId>("estimate");
  // Mobile view: "tools" | "chat"
  const [mobileView, setMobileView] = useState<"tools" | "chat">("tools");

  const activeDef = TOOLS.find(t => t.id === activeTool)!;

  const toolPanel = (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTool}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2 }}
        className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 sm:p-6 h-full"
      >
        {/* Tool header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
          <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${activeDef.gradient}`}>
            <activeDef.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${activeDef.color}`} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight">{L ? activeDef.titleAr : activeDef.titleEn}</h2>
            <p className="text-white/40 text-xs sm:text-sm truncate">{L ? activeDef.descAr : activeDef.descEn}</p>
          </div>
        </div>
        {activeTool === "estimate" && <EstimatePanel L={L} />}
        {activeTool === "proposal" && <ProposalPanel L={L} />}
        {activeTool === "website" && <WebsitePanel L={L} />}
        {activeTool === "sentiment" && <SentimentPanel L={L} />}
        {activeTool === "assignment" && <AssignmentPanel L={L} />}
        {activeTool === "delay" && <DelayPanel L={L} />}
        {activeTool === "social" && <SocialPanel L={L} />}
        {activeTool === "meeting" && <MeetingPanel L={L} />}
      </motion.div>
    </AnimatePresence>
  );

  const chatPanel = (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.07] bg-gradient-to-r from-cyan-950/40 to-purple-950/30 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}>
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <div className="text-white text-sm font-bold">{L ? "مساعد QIROX الذكي" : "QIROX AI Assistant"}</div>
          <div className="text-white/40 text-[11px]">{L ? "اسألني أي شيء عن المشاريع والطلبات" : "Ask me anything about projects & orders"}</div>
        </div>
        <div className="ms-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>
      <div className="flex-1 min-h-0">
        <AIPanel className="h-full" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white flex flex-col" dir={dir}>

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/60 border-b border-white/[0.06] px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-bold text-white leading-tight">QIROX AI Studio</h1>
            <p className="text-white/50 text-xs sm:text-sm truncate">
              {L ? "8 أدوات ذكاء اصطناعي متقدمة لتحسين الأداء" : "8 advanced AI tools to boost performance"}
            </p>
          </div>
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs flex-shrink-0">
            <Sparkles className="h-3 w-3 me-1" /> GPT-4o
          </Badge>
        </div>
      </div>

      {/* ── Mobile tool tabs (scrollable horizontal) ── */}
      <div className="lg:hidden border-b border-white/[0.06] bg-[#0d0f14] overflow-x-auto flex-shrink-0">
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setMobileView("tools"); }}
              data-testid={`tool-tab-${tool.id}`}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px] ${
                activeTool === tool.id && mobileView === "tools"
                  ? "bg-white/10 border border-white/10"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${activeTool === tool.id && mobileView === "tools" ? `bg-gradient-to-br ${tool.gradient}` : "bg-white/5"}`}>
                <tool.icon className={`h-4 w-4 ${activeTool === tool.id && mobileView === "tools" ? tool.color : "text-white/30"}`} />
              </div>
              <span className={`text-[10px] font-medium leading-tight text-center ${activeTool === tool.id && mobileView === "tools" ? "text-white" : "text-white/40"}`}>
                {L ? tool.titleAr.split(" ")[0] : tool.titleEn.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex min-h-0 max-w-7xl mx-auto w-full">

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-56 xl:w-64 flex-shrink-0 flex-col gap-1 p-4 border-e border-white/[0.06] overflow-y-auto">
          {TOOLS.map(tool => (
            <motion.button
              key={tool.id}
              whileHover={{ x: L ? -2 : 2 }}
              onClick={() => setActiveTool(tool.id)}
              data-testid={`tool-tab-${tool.id}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-all ${
                activeTool === tool.id
                  ? "bg-white/10 border border-white/10"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activeTool === tool.id ? `bg-gradient-to-br ${tool.gradient}` : "bg-white/5"}`}>
                <tool.icon className={`h-4 w-4 ${activeTool === tool.id ? tool.color : "text-white/30"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-semibold truncate ${activeTool === tool.id ? "text-white" : "text-white/50"}`}>{L ? tool.titleAr : tool.titleEn}</div>
                <div className="text-[10px] text-white/30 truncate">{L ? tool.descAr : tool.descEn}</div>
              </div>
            </motion.button>
          ))}
        </aside>

        {/* Desktop: tool + chat side by side */}
        <div className="hidden lg:flex flex-1 min-w-0 gap-4 p-4">
          <main className="flex-1 min-w-0 overflow-y-auto">{toolPanel}</main>
          <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
            {chatPanel}
          </div>
        </div>

        {/* Mobile: show either tool or chat */}
        <div className="lg:hidden flex-1 flex flex-col min-h-0">
          {mobileView === "tools" ? (
            <div className="flex-1 overflow-y-auto p-3">{toolPanel}</div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 p-3" style={{ height: "calc(100vh - 180px)" }}>
              {chatPanel}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile bottom toggle bar ── */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 flex justify-center pb-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-[#0d0f14]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl">
          <button
            onClick={() => setMobileView("tools")}
            data-testid="button-view-tools"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              mobileView === "tools"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Wrench className="w-4 h-4" />
            {L ? "الأدوات" : "Tools"}
          </button>
          <button
            onClick={() => setMobileView("chat")}
            data-testid="button-view-chat"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              mobileView === "chat"
                ? "bg-gradient-to-r from-cyan-600/30 to-purple-600/30 text-white border border-cyan-500/20"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {L ? "المساعد الذكي" : "AI Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
