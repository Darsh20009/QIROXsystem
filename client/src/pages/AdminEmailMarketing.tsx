import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, Users, Send, TrendingUp, Eye, MousePointer, Loader2,
  Plus, Upload, Play, RefreshCw, ChevronRight, ChevronLeft,
  Heart, AlertCircle, CheckCircle, Clock, Trash2, BarChart3,
  Zap, Target, Globe
} from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashboardData {
  totalEmails: number;
  unsubscribed: number;
  activeEmails: number;
  globalSent: number;
  remaining: number;
  totalCampaigns: number;
  recentCampaigns: Campaign[];
  interestedLeads: number;
  todayCampaign: Campaign | null;
  totalOpened: number;
  totalClicked: number;
}

interface Campaign {
  _id: string;
  name: string;
  subject: string;
  type: string;
  status: string;
  totalTarget: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  createdAt: string;
  completedAt?: string;
  createdBy?: string;
}

interface EmailEntry {
  _id: string;
  email: string;
  name: string;
  source: string;
  unsubscribed: boolean;
  bounced: boolean;
  addedAt: string;
}

interface InterestedLead {
  _id: string;
  email: string;
  name: string;
  firstEngagedAt: string;
  lastEngagedAt: string;
  engagementType: string;
  followUpCount: number;
  followUpSentAt?: string;
}

interface Recipient {
  _id: string;
  email: string;
  name: string;
  status: string;
  opened: boolean;
  clicked: boolean;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    draft:     { label: "مسودة", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    running:   { label: "جاري الإرسال", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    completed: { label: "مكتمل", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    failed:    { label: "فشل", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  };
  const s = map[status] || { label: status, className: "bg-gray-100 text-gray-700" };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>;
}

function pct(num: number, den: number) {
  if (!den) return "0%";
  return ((num / den) * 100).toFixed(1) + "%";
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Card className="border border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-2xl font-bold">{value.toLocaleString("ar-SA")}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminEmailMarketing() {
  const { toast } = useToast();
  const [tab, setTab] = useState("dashboard");
  const [emailsPage, setEmailsPage] = useState(1);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [leadsPage, setLeadsPage] = useState(1);
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [recipientsPage, setRecipientsPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: "", subject: "", htmlBody: "", type: "manual" });
  const [addEmailOpen, setAddEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState({ email: "", name: "" });

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: dash, isLoading: dashLoading, refetch: refetchDash } = useQuery<DashboardData>({
    queryKey: ["/api/email-marketing/dashboard"],
    queryFn: async () => {
      const r = await fetch("/api/email-marketing/dashboard", { credentials: "include" });
      if (!r.ok) throw new Error("فشل تحميل البيانات");
      return r.json();
    },
    refetchInterval: 15000,
  });

  const { data: emailsData, isLoading: emailsLoading } = useQuery({
    queryKey: ["/api/email-marketing/emails", emailsPage, emailSearch],
    queryFn: async () => {
      const r = await fetch(`/api/email-marketing/emails?page=${emailsPage}&limit=50&search=${emailSearch}`, { credentials: "include" });
      if (!r.ok) return { emails: [], total: 0 };
      return r.json();
    },
    enabled: tab === "emails",
  });

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/email-marketing/campaigns", campaignsPage],
    queryFn: async () => {
      const r = await fetch(`/api/email-marketing/campaigns?page=${campaignsPage}&limit=20`, { credentials: "include" });
      if (!r.ok) return { campaigns: [], total: 0 };
      return r.json();
    },
    enabled: tab === "campaigns",
  });

  const { data: campaignDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["/api/email-marketing/campaigns", selectedCampaign?._id, recipientsPage],
    queryFn: async () => {
      const r = await fetch(`/api/email-marketing/campaigns/${selectedCampaign!._id}?page=${recipientsPage}&limit=50`, { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!selectedCampaign,
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/email-marketing/interested", leadsPage],
    queryFn: async () => {
      const r = await fetch(`/api/email-marketing/interested?page=${leadsPage}&limit=50`, { credentials: "include" });
      if (!r.ok) return { leads: [], total: 0 };
      return r.json();
    },
    enabled: tab === "interested",
  });

  const { data: defaultTemplate } = useQuery({
    queryKey: ["/api/email-marketing/default-template"],
    queryFn: async () => {
      const r = await fetch("/api/email-marketing/default-template", { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
    enabled: newCampaignOpen,
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email-marketing/emails/import", { text: importText, source: "import" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: (d) => {
      toast({ title: `✅ تم الاستيراد`, description: `تم إضافة ${d.inserted} بريد جديد من أصل ${d.found} مُكتشف` });
      setImportOpen(false);
      setImportText("");
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/dashboard"] });
    },
    onError: (e: any) => toast({ title: "فشل الاستيراد", description: e.message, variant: "destructive" }),
  });

  const addEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email-marketing/emails", newEmail);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تمت الإضافة" });
      setAddEmailOpen(false);
      setNewEmail({ email: "", name: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/dashboard"] });
    },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/email-marketing/emails/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/dashboard"] });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email-marketing/campaigns", campaignForm);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✅ تم إنشاء الحملة" });
      setNewCampaignOpen(false);
      setCampaignForm({ name: "", subject: "", htmlBody: "", type: "manual" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/campaigns"] });
    },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/email-marketing/campaigns/${id}/send`, {});
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "🚀 بدأ الإرسال", description: "يتم الإرسال في الخلفية، تحقق من الحالة لاحقاً" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/campaigns"] });
    },
    onError: (e: any) => toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" }),
  });

  const runDailyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email-marketing/run-daily", {});
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "🚀 بدأت الحملة اليومية", description: "يتم الإرسال الآن لـ 1000 بريد في الخلفية" });
      setTimeout(() => refetchDash(), 3000);
    },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  const runWeeklyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email-marketing/run-weekly", {});
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    onSuccess: (d) => {
      toast({ title: "✅ تمت المعالجة الأسبوعية", description: `${d.newLeads} عميل مهتم جديد، ${d.followUpSent} رسالة متابعة` });
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/interested"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/dashboard"] });
    },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  // ── Render: Dashboard Tab ────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => runDailyMutation.mutate()}
          disabled={runDailyMutation.isPending}
          className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
          data-testid="button-run-daily"
        >
          {runDailyMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Zap className="w-4 h-4 ml-2" />}
          تشغيل الحملة اليومية (1000 بريد)
        </Button>
        <Button
          variant="outline"
          onClick={() => runWeeklyMutation.mutate()}
          disabled={runWeeklyMutation.isPending}
          data-testid="button-run-weekly"
        >
          {runWeeklyMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Target className="w-4 h-4 ml-2" />}
          جمع المهتمين الأسبوعي
        </Button>
        <Button variant="outline" onClick={() => refetchDash()} data-testid="button-refresh-dash">
          <RefreshCw className="w-4 h-4 ml-2" /> تحديث
        </Button>
      </div>

      {/* Today's Campaign Status */}
      {dash?.todayCampaign && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">حملة اليوم</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dash.todayCampaign.totalSent.toLocaleString()} مُرسل •&nbsp;
                {dash.todayCampaign.totalOpened} فتح •&nbsp;
                {dash.todayCampaign.totalClicked} نقر
              </p>
            </div>
            {statusBadge(dash.todayCampaign.status)}
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {dashLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted/30 rounded" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="إجمالي القائمة" value={dash?.totalEmails || 0} color="bg-blue-50 dark:bg-blue-900/20" />
          <StatCard icon={<Globe className="w-5 h-5 text-green-600" />} label="بريد نشط" value={dash?.activeEmails || 0} color="bg-green-50 dark:bg-green-900/20" />
          <StatCard icon={<Send className="w-5 h-5 text-purple-600" />} label="إجمالي المُرسل" value={dash?.globalSent || 0} color="bg-purple-50 dark:bg-purple-900/20" />
          <StatCard icon={<Mail className="w-5 h-5 text-orange-600" />} label="لم يُرسل له بعد" value={dash?.remaining || 0} color="bg-orange-50 dark:bg-orange-900/20" />
          <StatCard icon={<Eye className="w-5 h-5 text-cyan-600" />} label="إجمالي الفتح" value={dash?.totalOpened || 0} sub={pct(dash?.totalOpened || 0, dash?.globalSent || 0) + " معدل فتح"} color="bg-cyan-50 dark:bg-cyan-900/20" />
          <StatCard icon={<MousePointer className="w-5 h-5 text-pink-600" />} label="إجمالي النقر" value={dash?.totalClicked || 0} sub={pct(dash?.totalClicked || 0, dash?.globalSent || 0) + " معدل نقر"} color="bg-pink-50 dark:bg-pink-900/20" />
          <StatCard icon={<Heart className="w-5 h-5 text-red-600" />} label="العملاء المهتمون" value={dash?.interestedLeads || 0} color="bg-red-50 dark:bg-red-900/20" />
          <StatCard icon={<BarChart3 className="w-5 h-5 text-yellow-600" />} label="الحملات الكلية" value={dash?.totalCampaigns || 0} color="bg-yellow-50 dark:bg-yellow-900/20" />
        </div>
      )}

      {/* Recent Campaigns */}
      {dash?.recentCampaigns && dash.recentCampaigns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">آخر الحملات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {dash.recentCampaigns.map((c) => (
                <div key={c._id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.subject}</p>
                  </div>
                  <div className="text-left text-xs text-muted-foreground space-y-0.5">
                    <p>{c.totalSent.toLocaleString()} مُرسل</p>
                    <p>{c.totalOpened} فتح · {c.totalClicked} نقر</p>
                  </div>
                  {statusBadge(c.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automation Info */}
      <Card className="border-dashed border-2 border-border/50 bg-muted/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">الجدول التلقائي</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>🕘 <strong>كل يوم 9 صباحاً</strong> (بتوقيت الرياض) — يرسل تلقائياً 1000 بريد تسويقي لأشخاص لم يتلقوا رسالة من قبل</p>
                <p>🗓️ <strong>كل أحد 10 صباحاً</strong> — يجمع كل من فتح أو نقر خلال الأسبوع الماضي ويضيفهم لقائمة المهتمين ويرسلهم متابعة</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ── Render: Emails Tab ────────────────────────────────────────────────────────
  const renderEmails = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="ابحث بالبريد الإلكتروني..."
            value={emailSearch}
            onChange={(e) => { setEmailSearch(e.target.value); setEmailsPage(1); }}
            className="max-w-xs"
            data-testid="input-email-search"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} data-testid="button-import-emails">
            <Upload className="w-4 h-4 ml-2" /> استيراد قائمة
          </Button>
          <Button onClick={() => setAddEmailOpen(true)} data-testid="button-add-email">
            <Plus className="w-4 h-4 ml-2" /> إضافة بريد
          </Button>
        </div>
      </div>

      {emailsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {(emailsData?.emails || []).map((e: EmailEntry) => (
                <div key={e._id} className="flex items-center gap-4 px-5 py-3" data-testid={`row-email-${e._id}`}>
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{e.email}</p>
                    {e.name && <p className="text-xs text-muted-foreground">{e.name}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">{e.source}</span>
                  {e.unsubscribed && <Badge variant="destructive" className="text-xs">ألغى الاشتراك</Badge>}
                  {e.bounced && <Badge variant="outline" className="text-xs text-orange-500">مرتد</Badge>}
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => deleteEmailMutation.mutate(e._id)}
                    className="text-muted-foreground hover:text-red-500"
                    data-testid={`button-delete-email-${e._id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {(emailsData?.emails || []).length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>لا توجد عناوين بريدية</p>
                  <p className="text-xs mt-1">أضف بريداً واحداً أو استورد قائمة كاملة</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {(emailsData?.pages || 0) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEmailsPage(p => Math.max(1, p - 1))} disabled={emailsPage === 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{emailsPage} / {emailsData?.pages}</span>
          <Button variant="outline" size="sm" onClick={() => setEmailsPage(p => p + 1)} disabled={emailsPage >= (emailsData?.pages || 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );

  // ── Render: Campaigns Tab ─────────────────────────────────────────────────────
  const renderCampaigns = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => {
          setNewCampaignOpen(true);
          setCampaignForm(prev => ({ ...prev, htmlBody: defaultTemplate?.html || "" }));
        }} data-testid="button-new-campaign">
          <Plus className="w-4 h-4 ml-2" /> حملة جديدة
        </Button>
      </div>

      {campaignsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-lg animate-pulse bg-muted/30" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(campaignsData?.campaigns || []).map((c: Campaign) => (
            <Card key={c._id} className="hover:border-border cursor-pointer transition-colors" onClick={() => setSelectedCampaign(c)} data-testid={`card-campaign-${c._id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    {c.type === "daily_bulk" ? <Zap className="w-4 h-4" /> : c.type === "weekly_interested" ? <Target className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{c.name}</p>
                      {statusBadge(c.status)}
                      <span className="text-xs text-muted-foreground">{c.type === "daily_bulk" ? "يومية" : c.type === "weekly_interested" ? "أسبوعية" : "يدوية"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.subject}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span><Send className="w-3 h-3 inline ml-1" />{c.totalSent.toLocaleString()} مُرسل</span>
                      <span><Eye className="w-3 h-3 inline ml-1" />{c.totalOpened} فتح ({pct(c.totalOpened, c.totalSent)})</span>
                      <span><MousePointer className="w-3 h-3 inline ml-1" />{c.totalClicked} نقر ({pct(c.totalClicked, c.totalSent)})</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "d MMM yyyy", { locale: arSA })}</p>
                    {c.status === "draft" && (
                      <Button
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={(e) => { e.stopPropagation(); sendCampaignMutation.mutate(c._id); }}
                        disabled={sendCampaignMutation.isPending}
                        data-testid={`button-send-campaign-${c._id}`}
                      >
                        <Play className="w-3 h-3 ml-1" /> إرسال
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(campaignsData?.campaigns || []).length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Send className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">لا توجد حملات بعد</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Render: Interested Leads Tab ──────────────────────────────────────────────
  const renderInterested = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {leadsData?.total || 0} شخص أبدى اهتماماً بخدمات Qirox
        </p>
        <Button variant="outline" size="sm" onClick={() => runWeeklyMutation.mutate()} disabled={runWeeklyMutation.isPending} data-testid="button-refresh-leads">
          {runWeeklyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {leadsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse bg-muted/30" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {(leadsData?.leads || []).map((lead: InterestedLead) => (
                <div key={lead._id} className="flex items-center gap-4 px-5 py-3" data-testid={`row-lead-${lead._id}`}>
                  <div className={`p-1.5 rounded-lg ${lead.engagementType === "clicked" ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                    {lead.engagementType === "clicked"
                      ? <MousePointer className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      : <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{lead.email}</p>
                    <p className="text-xs text-muted-foreground">
                      آخر تفاعل: {format(new Date(lead.lastEngagedAt), "d MMM yyyy", { locale: arSA })}
                    </p>
                  </div>
                  <div className="text-left text-xs text-muted-foreground">
                    <p>{lead.followUpCount > 0 ? `${lead.followUpCount} متابعة مُرسلة` : "لم تُرسل متابعة"}</p>
                    <p className={lead.engagementType === "clicked" ? "text-green-600" : "text-blue-600"}>
                      {lead.engagementType === "clicked" ? "نقر على رابط" : "فتح البريد"}
                    </p>
                  </div>
                </div>
              ))}
              {(leadsData?.leads || []).length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>لا يوجد عملاء مهتمون بعد</p>
                  <p className="text-xs mt-1">ستظهر هنا قائمة من فتحوا أو نقروا على بريدك التسويقي</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Pagination */}
      {(leadsData?.total || 0) > 50 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLeadsPage(p => Math.max(1, p - 1))} disabled={leadsPage === 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{leadsPage}</span>
          <Button variant="outline" size="sm" onClick={() => setLeadsPage(p => p + 1)} disabled={(leadsData?.leads || []).length < 50}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );

  // ── Main Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-black dark:bg-white">
              <Mail className="w-6 h-6 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">التسويق البريدي</h1>
              <p className="text-sm text-muted-foreground">نظام الإرسال الجماعي وتتبع المهتمين</p>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <BarChart3 className="w-4 h-4 ml-1.5" /> لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="emails" data-testid="tab-emails">
              <Users className="w-4 h-4 ml-1.5" /> قائمة البريد
            </TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">
              <Send className="w-4 h-4 ml-1.5" /> الحملات
            </TabsTrigger>
            <TabsTrigger value="interested" data-testid="tab-interested">
              <Heart className="w-4 h-4 ml-1.5" /> المهتمون
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">{renderDashboard()}</TabsContent>
          <TabsContent value="emails">{renderEmails()}</TabsContent>
          <TabsContent value="campaigns">{renderCampaigns()}</TabsContent>
          <TabsContent value="interested">{renderInterested()}</TabsContent>
        </Tabs>
      </div>

      {/* ── Import Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> استيراد قائمة بريدية
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              الصق قائمة البريد الإلكتروني (مفصولة بمسافة أو فاصلة أو سطر جديد). سيتم استخراج كل العناوين الصحيحة تلقائياً.
            </p>
            <Textarea
              placeholder={"example1@gmail.com\nexample2@hotmail.com\nexample3@yahoo.com\n..."}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              className="font-mono text-sm"
              dir="ltr"
              data-testid="textarea-import-emails"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportOpen(false)}>إلغاء</Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending || !importText.trim()}
                data-testid="button-confirm-import"
              >
                {importMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}
                استيراد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Single Email Dialog ───────────────────────────────────────────── */}
      <Dialog open={addEmailOpen} onOpenChange={setAddEmailOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة بريد إلكتروني</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="البريد الإلكتروني *"
              value={newEmail.email}
              onChange={(e) => setNewEmail(p => ({ ...p, email: e.target.value }))}
              dir="ltr"
              data-testid="input-new-email"
            />
            <Input
              placeholder="الاسم (اختياري)"
              value={newEmail.name}
              onChange={(e) => setNewEmail(p => ({ ...p, name: e.target.value }))}
              data-testid="input-new-name"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddEmailOpen(false)}>إلغاء</Button>
              <Button onClick={() => addEmailMutation.mutate()} disabled={addEmailMutation.isPending || !newEmail.email.trim()} data-testid="button-confirm-add-email">
                {addEmailMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Plus className="w-4 h-4 ml-2" />}
                إضافة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── New Campaign Dialog ───────────────────────────────────────────────── */}
      <Dialog open={newCampaignOpen} onOpenChange={setNewCampaignOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" /> إنشاء حملة بريدية
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="اسم الحملة *"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm(p => ({ ...p, name: e.target.value }))}
              data-testid="input-campaign-name"
            />
            <Input
              placeholder="موضوع البريد *"
              value={campaignForm.subject}
              onChange={(e) => setCampaignForm(p => ({ ...p, subject: e.target.value }))}
              dir="rtl"
              data-testid="input-campaign-subject"
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">محتوى البريد (HTML) *</label>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs p-0 h-auto"
                  onClick={() => setCampaignForm(p => ({ ...p, htmlBody: defaultTemplate?.html || "" }))}
                >
                  استخدم القالب الافتراضي
                </Button>
              </div>
              <Textarea
                placeholder="<html>...</html>"
                value={campaignForm.htmlBody}
                onChange={(e) => setCampaignForm(p => ({ ...p, htmlBody: e.target.value }))}
                rows={12}
                className="font-mono text-xs"
                dir="ltr"
                data-testid="textarea-campaign-html"
              />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
              <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-blue-700 dark:text-blue-300">سيتم إضافة بيكسل التتبع وروابط النقر تلقائياً عند الإرسال</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewCampaignOpen(false)}>إلغاء</Button>
              <Button
                onClick={() => createCampaignMutation.mutate()}
                disabled={createCampaignMutation.isPending || !campaignForm.name || !campaignForm.subject || !campaignForm.htmlBody}
                data-testid="button-create-campaign"
              >
                {createCampaignMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Plus className="w-4 h-4 ml-2" />}
                إنشاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Campaign Detail Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!selectedCampaign} onOpenChange={(o) => !o && setSelectedCampaign(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          {selectedCampaign && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> {selectedCampaign.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Campaign Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "مُرسل", value: campaignDetail?.campaign?.totalSent || 0, icon: <Send className="w-4 h-4 text-purple-500" /> },
                    { label: "فتح", value: campaignDetail?.campaign?.totalOpened || 0, icon: <Eye className="w-4 h-4 text-blue-500" /> },
                    { label: "نقر", value: campaignDetail?.campaign?.totalClicked || 0, icon: <MousePointer className="w-4 h-4 text-green-500" /> },
                    { label: "المستهدف", value: campaignDetail?.campaign?.totalTarget || 0, icon: <Target className="w-4 h-4 text-orange-500" /> },
                  ].map((s, i) => (
                    <div key={i} className="bg-muted/30 rounded-lg p-3 text-center">
                      <div className="flex justify-center mb-1">{s.icon}</div>
                      <p className="text-lg font-bold">{s.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recipients Table */}
                <div>
                  <p className="text-sm font-semibold mb-2">قائمة المستلمين ({campaignDetail?.totalRecipients?.toLocaleString() || 0})</p>
                  {detailLoading ? (
                    <div className="space-y-1">
                      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded animate-pulse bg-muted/30" />)}
                    </div>
                  ) : (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
                        {(campaignDetail?.recipients || []).map((r: Recipient) => (
                          <div key={r._id} className="flex items-center gap-3 px-4 py-2.5" data-testid={`row-recipient-${r._id}`}>
                            <span className="text-sm flex-1 truncate" dir="ltr">{r.email}</span>
                            <div className="flex gap-1.5 shrink-0">
                              {r.status === "sent" ? (
                                <CheckCircle className="w-4 h-4 text-green-500" title="مُرسل" />
                              ) : r.status === "failed" ? (
                                <AlertCircle className="w-4 h-4 text-red-500" title="فشل" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-400" title="معلق" />
                              )}
                              {r.opened && <Eye className="w-4 h-4 text-blue-500" title="فتح البريد" />}
                              {r.clicked && <MousePointer className="w-4 h-4 text-green-500" title="نقر الرابط" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recipients Pagination */}
                  {(campaignDetail?.totalRecipients || 0) > 50 && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => setRecipientsPage(p => Math.max(1, p - 1))} disabled={recipientsPage === 1}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <span className="text-sm">{recipientsPage} / {Math.ceil((campaignDetail?.totalRecipients || 0) / 50)}</span>
                      <Button variant="outline" size="sm" onClick={() => setRecipientsPage(p => p + 1)} disabled={(campaignDetail?.recipients || []).length < 50}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
