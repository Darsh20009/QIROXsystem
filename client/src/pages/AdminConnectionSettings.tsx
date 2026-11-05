import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Database, Mail, RefreshCw, CheckCircle2, XCircle, AlertCircle, Server, ArrowRightLeft, Archive, Search, ArrowUpRight } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

const fade = (d = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: d } });

function StatusDot({ state }: { state: string }) {
  const color = state === "connected" ? "bg-black dark:bg-white" : state === "connecting" ? "bg-black/[0.08] dark:bg-white/[0.1] animate-pulse" : "bg-black dark:bg-white";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} mr-1.5`} />;
}

function ConnCard({ label, info }: { label: string; info: { uri: string; state: string } | null }) {
  if (!info) return null;
  return (
    <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <StatusDot state={info.state} />
        <span className="text-xs font-semibold text-black/60 dark:text-white/60 shrink-0">{label}</span>
        <span className="text-xs font-mono text-black/40 dark:text-white/40 truncate">{info.uri || "—"}</span>
      </div>
      <Badge
        variant="outline"
        className={info.state === "connected" ? "border-black dark:border-white text-black dark:text-white" : info.state === "connecting" ? "border-black/15 dark:border-white/15 text-black dark:text-white" : "border-black/15 dark:border-white/15 text-black dark:text-white"}
      >
        {info.state === "connected" ? "متصل / Connected" : info.state === "connecting" ? "يتصل..." : "منقطع / Disconnected"}
      </Badge>
    </div>
  );
}

export default function AdminConnectionSettings() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();

  const [mainUri, setMainUri] = useState("");
  const [qmeetUri, setQmeetUri] = useState("");
  const [showMainUri, setShowMainUri] = useState(false);
  const [showQmeetUri, setShowQmeetUri] = useState(false);

  const [emailForm, setEmailForm] = useState({ emailLogoUrl: "", emailSiteUrl: "" });
  const [provisionDays, setProvisionDays] = useState("30");
  const [provisionResult, setProvisionResult] = useState<any>(null);

  const [migrateCollection, setMigrateCollection] = useState("orders");
  const [migrateId, setMigrateId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/admin/connection-settings"],
    refetchInterval: 15000,
  });

  const changeMainDb = useMutation({
    mutationFn: (uri: string) => apiRequest("POST", "/api/admin/connection-settings/main-db", { uri }).then(r => r.json()),
    onSuccess: (d: any) => { toast({ title: d.message || (L ? "تم التغيير" : "Changed") }); qc.invalidateQueries({ queryKey: ["/api/admin/connection-settings"] }); setMainUri(""); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const changeQmeetDb = useMutation({
    mutationFn: (uri: string) => apiRequest("POST", "/api/admin/connection-settings/qmeet-db", { uri }).then(r => r.json()),
    onSuccess: (d: any) => { toast({ title: d.message || (L ? "تم التغيير" : "Changed") }); qc.invalidateQueries({ queryKey: ["/api/admin/connection-settings"] }); setQmeetUri(""); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const saveEmail = useMutation({
    mutationFn: (form: typeof emailForm) => apiRequest("POST", "/api/admin/connection-settings/email", form).then(r => r.json()),
    onSuccess: (d: any) => { toast({ title: d.message || (L ? "تم الحفظ" : "Saved") }); qc.invalidateQueries({ queryKey: ["/api/admin/connection-settings"] }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const testEmail = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/connection-settings/test-email", {}).then(r => r.json()),
    onSuccess: (d: any) => toast({ title: d.ok ? "✅ " + d.message : "❌ " + d.message, variant: d.ok ? "default" : "destructive" }),
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const provision = useMutation({
    mutationFn: (days: number) => apiRequest("POST", "/api/admin/provision-employee-emails", { days }).then(r => r.json()),
    onSuccess: (d: any) => {
      setProvisionResult(d);
      const total = (d.created?.length || 0);
      toast({ title: total > 0 ? `✅ تم إنشاء ${total} بريد للموظفين` : "✅ لا يوجد موظفون جدد يحتاجون بريداً" });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const migrateRecord = useMutation({
    mutationFn: ({ collection, id }: { collection: string; id: string }) =>
      apiRequest("POST", "/api/admin/connection-settings/migrate-record", { collection, id }).then(r => r.json()),
    onSuccess: (d: any) => { toast({ title: d.message || (L ? "تم النقل" : "Migrated") }); setMigrateId(""); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  async function searchSecondary() {
    setSearchLoading(true);
    try {
      const r = await apiRequest("GET", `/api/admin/connection-settings/secondary-search?collection=${migrateCollection}&query=${encodeURIComponent(searchQuery)}`);
      const d = await r.json();
      setSearchResults(d.records || []);
    } catch (e: any) {
      toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    } finally {
      setSearchLoading(false);
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-black/20" /></div>;

  const status = data?.status;
  const settings = data?.settings;
  const env = data?.env;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16" dir={dir}>
      <PageGraphics />
      <motion.div {...fade(0)} className="bg-black rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading">{L ? "إعدادات الاتصال" : "Connection Settings"}</h1>
            <p className="text-white/40 text-sm mt-0.5">{L ? "إدارة قواعد البيانات وخدمة البريد الإلكتروني" : "Manage databases and email service"}</p>
          </div>
          <Button variant="ghost" size="sm" className="mr-auto text-white/60 hover:text-white" onClick={() => refetch()} data-testid="button-refresh-status">
            <RefreshCw className="w-4 h-4 ml-1" />
            {L ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </motion.div>

      {status && (
        <motion.div {...fade(0.05)}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Database className="w-4 h-4 text-black dark:text-white" />{L ? "حالة الاتصالات الحالية" : "Current Connection Status"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ConnCard label={L ? "قاعدة البيانات الرئيسية" : "Primary Database"} info={status.primary} />
              {status.secondary && <ConnCard label={L ? "قاعدة البيانات الأرشيف (القديمة)" : "Archive Database (old)"} info={status.secondary} />}
              <ConnCard label={L ? "قاعدة بيانات الاجتماعات" : "Meetings Database"} info={status.qmeet} />
              {status.prevQmeet && <ConnCard label={L ? "أرشيف الاجتماعات (القديمة)" : "Meetings Archive (old)"} info={status.prevQmeet} />}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div {...fade(0.1)}>
        <Tabs defaultValue="main-db">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="main-db" data-testid="tab-main-db"><Database className="w-3.5 h-3.5 ml-1.5" />{L ? "قاعدة الموقع" : "Site Database"}</TabsTrigger>
            <TabsTrigger value="qmeet-db" data-testid="tab-qmeet-db"><Server className="w-3.5 h-3.5 ml-1.5" />{L ? "قاعدة الاجتماعات" : "Meetings Database"}</TabsTrigger>
            <TabsTrigger value="email" data-testid="tab-email"><Mail className="w-3.5 h-3.5 ml-1.5" />{L ? "البريد الإلكتروني" : "Email"}</TabsTrigger>
          </TabsList>

          <TabsContent value="main-db" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{L ? "الاتصال الحالي بقاعدة البيانات الرئيسية" : "Current Main Database Connection"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {env && (
                  <div className="bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl p-3">
                    <p className="text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70 font-semibold mb-1">{L ? "متغير البيئة (MONGODB_URI)" : "Environment Variable (MONGODB_URI)"}</p>
                    <p className="text-xs font-mono text-black dark:text-white dark:text-black/70 dark:text-white/70">{env.mainDbUri || (L ? "غير محدد" : "Not set")}</p>
                  </div>
                )}
                {settings?.mainDbUri && (
                  <div className="bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl p-3">
                    <p className="text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70 font-semibold mb-1">{L ? "الاتصال النشط (مُخصص)" : "Active Connection (custom)"}</p>
                    <p className="text-xs font-mono text-black dark:text-white dark:text-black/70 dark:text-white/70">{settings.mainDbUri}</p>
                  </div>
                )}
                {settings?.prevMainDbUri && (
                  <div className="bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl p-3 flex gap-2">
                    <Archive className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70 font-semibold mb-1">{L ? "قاعدة البيانات القديمة (أرشيف)" : "Old Database (Archive)"}</p>
                      <p className="text-xs font-mono text-black dark:text-white dark:text-black/70 dark:text-white/70">{settings.prevMainDbUri}</p>
                      <p className="text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70 mt-1">{L ? "البيانات القديمة لا تزال متاحة للقراءة والنقل." : "Old data is still available for reading and migration."}</p>
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-black/[0.06]">
                  <Label className="text-sm font-semibold">{L ? "تغيير قاعدة البيانات الرئيسية" : "Change Main Database"}</Label>
                  <p className="text-xs text-black/40 dark:text-white/40 mb-3 mt-1">
                    {L ? "سيتم اختبار الاتصال أولاً، ثم التبديل الفوري. البيانات الحالية تُحفظ كأرشيف." : "Connection will be tested first, then switched immediately. Current data is saved as archive."}
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showMainUri ? "text" : "password"}
                        value={mainUri}
                        onChange={e => setMainUri(e.target.value)}
                        placeholder="mongodb+srv://user:pass@cluster.mongodb.net/dbname"
                        dir="ltr"
                        className="text-xs font-mono pr-9"
                        data-testid="input-main-db-uri"
                      />
                      <button type="button" onClick={() => setShowMainUri(v => !v)} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/30 hover:text-black">
                        {showMainUri ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      onClick={() => changeMainDb.mutate(mainUri)}
                      disabled={changeMainDb.isPending || !mainUri.startsWith("mongodb")}
                      className="gap-1.5 shrink-0"
                      data-testid="button-change-main-db"
                    >
                      {changeMainDb.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                      {changeMainDb.isPending ? (L ? "يختبر الاتصال..." : "Testing...") : (L ? "تغيير" : "Change")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qmeet-db" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{L ? "اتصال قاعدة بيانات الاجتماعات (QMeet)" : "QMeet Database Connection"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings?.qmeetDbUri && (
                  <div className="bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl p-3">
                    <p className="text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70 font-semibold mb-1">{L ? "الاتصال النشط (مُخصص)" : "Active Connection (custom)"}</p>
                    <p className="text-xs font-mono text-black dark:text-white dark:text-black/70 dark:text-white/70">{settings.qmeetDbUri}</p>
                  </div>
                )}
                {settings?.prevQmeetDbUri && (
                  <div className="bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl p-3 flex gap-2">
                    <Archive className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70 font-semibold">{L ? "أرشيف الاجتماعات القديمة" : "Old Meetings Archive"}</p>
                      <p className="text-xs font-mono text-black dark:text-white dark:text-black/70 dark:text-white/70 mt-1">{settings.prevQmeetDbUri}</p>
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-black/[0.06]">
                  <Label className="text-sm font-semibold">{L ? "تغيير قاعدة بيانات الاجتماعات" : "Change Meetings Database"}</Label>
                  <p className="text-xs text-black/40 dark:text-white/40 mb-3 mt-1">
                    {L ? "الاجتماعات الجديدة ستُسجل في القاعدة الجديدة. القديمة تبقى في الأرشيف." : "New meetings will be recorded in the new database. Old ones remain in the archive."}
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showQmeetUri ? "text" : "password"}
                        value={qmeetUri}
                        onChange={e => setQmeetUri(e.target.value)}
                        placeholder="mongodb+srv://user:pass@cluster.mongodb.net/qmeet_db"
                        dir="ltr"
                        className="text-xs font-mono pr-9"
                        data-testid="input-qmeet-db-uri"
                      />
                      <button type="button" onClick={() => setShowQmeetUri(v => !v)} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/30 hover:text-black">
                        {showQmeetUri ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      onClick={() => changeQmeetDb.mutate(qmeetUri)}
                      disabled={changeQmeetDb.isPending || !qmeetUri.startsWith("mongodb")}
                      className="gap-1.5 shrink-0"
                      data-testid="button-change-qmeet-db"
                    >
                      {changeQmeetDb.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                      {changeQmeetDb.isPending ? (L ? "يختبر..." : "Testing...") : (L ? "تغيير" : "Change")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-black dark:text-white" />{L ? "إعدادات البريد الإلكتروني (cPanel SMTP)" : "Email Settings (cPanel SMTP)"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {env && (
                  <div className="bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-xl p-3">
                    <p className="text-xs font-semibold mb-2">{L ? "حالة خادم البريد" : "Mail Server Status"}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${env.smtpHost ? "text-green-500" : "text-red-400"}`} />
                        <p className="text-xs font-mono">{L ? "الخادم:" : "Host:"} {env.smtpHost || (L ? "غير محدد" : "Not set")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${env.smtpUser ? "text-green-500" : "text-red-400"}`} />
                        <p className="text-xs font-mono">{L ? "المستخدم:" : "User:"} {env.smtpUser || (L ? "غير محدد" : "Not set")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${env.smtpPassSet ? "text-green-500" : "text-red-400"}`} />
                        <p className="text-xs font-mono">{L ? "كلمة المرور:" : "Password:"} {env.smtpPassSet ? "••••••••" : (L ? "غير محددة" : "Not set")}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{L ? "رابط الشعار في البريد" : "Email Logo URL"}</Label>
                      <Input
                        value={emailForm.emailLogoUrl}
                        onChange={e => setEmailForm(f => ({ ...f, emailLogoUrl: e.target.value }))}
                        placeholder="https://yoursite.com/logo.png"
                        dir="ltr"
                        className="text-xs mt-1"
                        data-testid="input-email-logo-url"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{L ? "رابط الموقع في البريد" : "Email Site URL"}</Label>
                      <Input
                        value={emailForm.emailSiteUrl}
                        onChange={e => setEmailForm(f => ({ ...f, emailSiteUrl: e.target.value }))}
                        placeholder="https://yoursite.com"
                        dir="ltr"
                        className="text-xs mt-1"
                        data-testid="input-email-site-url"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => saveEmail.mutate(emailForm)}
                      disabled={saveEmail.isPending}
                      className="gap-1.5"
                      data-testid="button-save-email-settings"
                    >
                      {saveEmail.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {L ? "حفظ الإعدادات" : "Save Settings"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => testEmail.mutate()}
                      disabled={testEmail.isPending}
                      className="gap-1.5"
                      data-testid="button-test-email"
                    >
                      {testEmail.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      {L ? "اختبار الإرسال" : "Test Send"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-black dark:text-white" />
                  {L ? "توليد بريدات الموظفين الجدد تلقائياً" : "Auto-Provision Employee Emails"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-black/60 dark:text-white/60">
                  {L
                    ? "يبحث النظام عن الموظفين المضافين في آخر N يوم الذين لا يملكون بريد عمل، ثم ينشئ لكل منهم حساباً على cPanel ويحفظ البيانات في النظام تلقائياً."
                    : "Finds employees added in the last N days without a work email, creates a cPanel account for each, and saves credentials in the system."}
                </p>
                <div className="flex items-center gap-3">
                  <Label className="text-xs shrink-0">{L ? "آخر (يوم):" : "Last (days):"}</Label>
                  <Input
                    type="number"
                    value={provisionDays}
                    onChange={e => setProvisionDays(e.target.value)}
                    className="w-24 text-xs"
                    min="1"
                    max="365"
                    dir="ltr"
                    data-testid="input-provision-days"
                  />
                  <Button
                    onClick={() => provision.mutate(Number(provisionDays) || 30)}
                    disabled={provision.isPending}
                    className="gap-1.5"
                    data-testid="button-provision-emails"
                  >
                    {provision.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                    {provision.isPending ? (L ? "جارٍ الإنشاء..." : "Provisioning...") : (L ? "إنشاء البريدات" : "Provision Emails")}
                  </Button>
                </div>

                {provisionResult && (
                  <div className="space-y-3">
                    {provisionResult.created?.length > 0 && (
                      <div className="border border-green-200 dark:border-green-800 rounded-xl overflow-hidden">
                        <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                            {L ? `تم إنشاء ${provisionResult.created.length} بريد` : `${provisionResult.created.length} email(s) created`}
                          </span>
                        </div>
                        <div className="divide-y divide-black/5 dark:divide-white/5 max-h-56 overflow-y-auto">
                          {provisionResult.created.map((e: any) => (
                            <div key={e.userId} className="px-3 py-2 space-y-0.5">
                              <p className="text-xs font-semibold">{e.name}</p>
                              <p className="text-xs font-mono text-black/60 dark:text-white/60">{e.email}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-black/40 dark:text-white/40">{L ? "كلمة المرور:" : "Password:"}</span>
                                <code className="text-xs font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded select-all">{e.password}</code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {provisionResult.skipped?.length > 0 && (
                      <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                        <div className="bg-black/[0.03] dark:bg-white/[0.04] px-3 py-2">
                          <span className="text-xs font-semibold text-black/50 dark:text-white/50">
                            {L ? `${provisionResult.skipped.length} تم تخطيه` : `${provisionResult.skipped.length} skipped`}
                          </span>
                        </div>
                        <div className="divide-y divide-black/5 dark:divide-white/5 max-h-40 overflow-y-auto">
                          {provisionResult.skipped.map((e: any) => (
                            <div key={e.userId} className="px-3 py-2">
                              <p className="text-xs font-semibold">{e.name}</p>
                              <p className="text-xs text-black/40 dark:text-white/40">{e.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {provisionResult.errors?.length > 0 && (
                      <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                        <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2">
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                            {L ? `${provisionResult.errors.length} خطأ` : `${provisionResult.errors.length} error(s)`}
                          </span>
                        </div>
                        <div className="divide-y divide-black/5 max-h-40 overflow-y-auto">
                          {provisionResult.errors.map((e: any) => (
                            <div key={e.userId} className="px-3 py-2">
                              <p className="text-xs font-semibold">{e.name}</p>
                              <p className="text-xs text-red-500">{e.error}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {status?.secondary && (
        <motion.div {...fade(0.15)}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Archive className="w-4 h-4 text-black dark:text-white" />
                {L ? "نقل سجلات من قاعدة البيانات القديمة" : "Migrate Records from Old Database"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl p-3">
                <p className="text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70">
                  {L ? "يمكنك البحث في قاعدة البيانات القديمة ونقل سجلات محددة إلى الجديدة. السجل المنقول سيُضاف في الجديدة دون حذفه من القديمة." : "You can search the old database and migrate specific records to the new one. Migrated records are added to the new database without being deleted from the old."}
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  value={migrateCollection}
                  onChange={e => setMigrateCollection(e.target.value)}
                  className="text-sm border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-gray-900"
                  data-testid="select-migrate-collection"
                >
                  <option value="orders">{L ? "الطلبات" : "Orders"} (orders)</option>
                  <option value="projects">{L ? "المشاريع" : "Projects"} (projects)</option>
                  <option value="users">{L ? "المستخدمين" : "Users"} (users)</option>
                  <option value="modificationrequests">{L ? "طلبات التعديل" : "Modification Requests"}</option>
                  <option value="messages">{L ? "الرسائل" : "Messages"} (messages)</option>
                </select>
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={L ? "ابحث باسم أو عنوان..." : "Search by name or title..."}
                  className="flex-1 text-sm"
                  onKeyDown={e => e.key === "Enter" && searchSecondary()}
                  data-testid="input-search-archive"
                />
                <Button variant="outline" onClick={searchSecondary} disabled={searchLoading} className="gap-1" data-testid="button-search-archive">
                  {searchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  {L ? "بحث" : "Search"}
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((rec: any) => (
                    <div key={rec._id?.toString()} className="flex items-center justify-between gap-3 p-3 border border-black/[0.06] rounded-xl text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{rec.title || rec.name || rec.fullName || rec.projectType || (L ? "سجل" : "Record")}</p>
                        <p className="text-xs text-black/40 dark:text-white/40 font-mono">{rec._id?.toString()}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1 text-xs"
                        onClick={() => migrateRecord.mutate({ collection: migrateCollection, id: rec._id?.toString() })}
                        disabled={migrateRecord.isPending}
                        data-testid={`button-migrate-${rec._id}`}
                      >
                        <ArrowUpRight className="w-3 h-3" />
                        {L ? "نقل للجديدة" : "Migrate"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Input
                  value={migrateId}
                  onChange={e => setMigrateId(e.target.value)}
                  placeholder={L ? "أو أدخل ID السجل مباشرة..." : "Or enter Record ID directly..."}
                  dir="ltr"
                  className="text-xs font-mono flex-1"
                  data-testid="input-migrate-id"
                />
                <Button
                  variant="outline"
                  onClick={() => migrateRecord.mutate({ collection: migrateCollection, id: migrateId })}
                  disabled={migrateRecord.isPending || !migrateId}
                  className="gap-1 shrink-0"
                  data-testid="button-migrate-by-id"
                >
                  {migrateRecord.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  {L ? "نقل" : "Migrate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
