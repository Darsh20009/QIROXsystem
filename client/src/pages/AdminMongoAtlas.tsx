import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, CheckCircle2, XCircle, Copy, Eye, EyeOff, RefreshCw, Database, Key, Server } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

function copy(text: string, label: string, toast: any) {
  navigator.clipboard.writeText(text);
  toast({ title: `تم النسخ: ${label}` });
}

const emptyConfig = { label: "", publicKey: "", privateKey: "", orgId: "", projectId: "", projectName: "", clusterName: "", isDefault: false };
const emptyUser = { configId: "", clientName: "", username: "", password: "", databaseName: "", notes: "" };

export default function AdminMongoAtlas() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [configOpen, setConfigOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [editConfigId, setEditConfigId] = useState<string|null>(null);
  const [configForm, setConfigForm] = useState({ ...emptyConfig });
  const [userForm, setUserForm] = useState({ ...emptyUser });
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});

  const { data: configs = [] } = useQuery<any[]>({ queryKey: ["/api/admin/atlas/configs"] });
  const { data: dbUsers = [] } = useQuery<any[]>({ queryKey: ["/api/admin/atlas/db-users"] });

  const saveConfig = useMutation({
    mutationFn: (d: any) => editConfigId
      ? apiRequest("PUT", `/api/admin/atlas/configs/${editConfigId}`, d)
      : apiRequest("POST", "/api/admin/atlas/configs", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/atlas/configs"] }); setConfigOpen(false); toast({ title: "تم الحفظ" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const delConfig = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/atlas/configs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/atlas/configs"] }),
  });

  const saveUser = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/admin/atlas/db-users", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/atlas/db-users"] }); setUserOpen(false); toast({ title: "تم إنشاء قاعدة البيانات ومستخدم Atlas" }); },
    onError: (e: any) => toast({ title: "خطأ Atlas", description: e.message, variant: "destructive" }),
  });

  const delUser = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/atlas/db-users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/atlas/db-users"] }),
  });

  async function testAtlas() {
    setTestLoading(true); setTestResult(null);
    try {
      const r = await apiRequest("POST", "/api/admin/atlas/test", { publicKey: configForm.publicKey, privateKey: configForm.privateKey }) as any;
      setTestResult(r);
      if (r.success && r.projects?.length) {
        const first = r.projects[0];
        setConfigForm(f => ({ ...f, projectId: first.id, projectName: first.name }));
        toast({ title: `تم الاتصال — ${r.projects.length} مشروع` });
      }
    } catch (e: any) { setTestResult({ success: false, message: e.message }); }
    finally { setTestLoading(false); }
  }

  function openNewConfig() { setEditConfigId(null); setConfigForm({ ...emptyConfig }); setTestResult(null); setConfigOpen(true); }
  function openEditConfig(c: any) { setEditConfigId(c.id); setConfigForm({ label: c.label, publicKey: c.publicKey, privateKey: "", orgId: c.orgId||"", projectId: c.projectId||"", projectName: c.projectName||"", clusterName: c.clusterName||"", isDefault: c.isDefault }); setTestResult(null); setConfigOpen(true); }

  const defaultConfig = configs.find((c: any) => c.isDefault) || configs[0];

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Database className="w-5 h-5 text-green-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">MongoDB Atlas</h1>
          <p className="text-sm text-gray-500">إدارة قواعد بيانات العملاء على Atlas</p>
        </div>
      </div>

      <Tabs defaultValue="databases" dir="rtl">
        <TabsList className="mb-6">
          <TabsTrigger value="databases">قواعد البيانات</TabsTrigger>
          <TabsTrigger value="configs">إعدادات Atlas</TabsTrigger>
        </TabsList>

        {/* ── DB Users Tab ── */}
        <TabsContent value="databases">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">قواعد البيانات المُنشأة</h2>
            <Button onClick={() => { setUserForm({ ...emptyUser, configId: defaultConfig?.id || "" }); setUserOpen(true); }} disabled={configs.length === 0} data-testid="button-new-db" className="gap-2">
              <Plus className="w-4 h-4" /> إنشاء قاعدة بيانات
            </Button>
          </div>
          {dbUsers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد قواعد بيانات. أضف إعداد Atlas أولاً ثم أنشئ قاعدة بيانات.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dbUsers.map((u: any) => (
                <Card key={u.id} data-testid={`card-dbuser-${u.id}`} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4 text-green-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{u.databaseName}</span>
                          <Badge variant="outline" className="text-[10px]">{u.username}</Badge>
                          {u.clientName && <Badge variant="secondary" className="text-[10px]">{u.clientName}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-gray-50 rounded px-2 py-1 font-mono text-[10px] text-gray-600 truncate" dir="ltr">
                            {showPass[u.id] ? u.connectionString : u.connectionString?.replace(/:[^:@]+@/, ":****@")}
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 px-1.5 shrink-0" onClick={() => setShowPass(p => ({ ...p, [u.id]: !p[u.id] }))}>
                            {showPass[u.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          {u.connectionString && (
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 shrink-0" onClick={() => copy(u.connectionString, "Connection String", toast)} data-testid={`button-copy-conn-${u.id}`}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        {u.notes && <p className="text-xs text-gray-400 mt-1">{u.notes}</p>}
                        <p className="text-[10px] text-gray-300 mt-1">{new Date(u.createdAt).toLocaleDateString("ar-SA")}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-red-500 shrink-0 h-7 px-2" onClick={() => { if (confirm("حذف المستخدم من Atlas أيضاً؟")) delUser.mutate(u.id); }} data-testid={`button-delete-dbuser-${u.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Configs Tab ── */}
        <TabsContent value="configs">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">إعدادات الاتصال</h2>
            <Button onClick={openNewConfig} data-testid="button-new-atlas-config" className="gap-2">
              <Plus className="w-4 h-4" /> إضافة إعداد
            </Button>
          </div>
          {configs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد إعدادات. أضف مفاتيح Atlas API لبدء إنشاء قواعد البيانات.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {configs.map((c: any) => (
                <Card key={c.id} data-testid={`card-atlas-config-${c.id}`} className={`border ${c.isDefault ? "border-green-400" : "border-gray-200"}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <Server className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{c.label}</span>
                        {c.isDefault && <Badge className="text-[10px] bg-green-100 text-green-700">افتراضي</Badge>}
                        {c.projectName && <Badge variant="outline" className="text-[10px]">{c.projectName}</Badge>}
                        {c.clusterName && <Badge variant="outline" className="text-[10px]">{c.clusterName}</Badge>}
                      </div>
                      <p className="text-xs text-gray-400">Public Key: {c.publicKey}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEditConfig(c)}>تعديل</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500" onClick={() => delConfig.mutate(c.id)} data-testid={`button-delete-config-${c.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editConfigId ? "تعديل الإعداد" : "إضافة إعداد Atlas"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
            <div>
              <Label>تسمية الإعداد *</Label>
              <Input value={configForm.label} onChange={e => setConfigForm(f => ({ ...f, label: e.target.value }))} placeholder="مثال: قيروكس الرئيسي" data-testid="input-atlas-label" />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Public Key *</Label>
                <Input value={configForm.publicKey} onChange={e => setConfigForm(f => ({ ...f, publicKey: e.target.value }))} placeholder="مفتاح API العام" dir="ltr" data-testid="input-atlas-public-key" />
              </div>
              <div>
                <Label>Private Key * {editConfigId && <span className="text-xs text-gray-400">(اتركه فارغاً للاحتفاظ بالحالي)</span>}</Label>
                <div className="relative">
                  <Input type={showKey ? "text" : "password"} value={configForm.privateKey} onChange={e => setConfigForm(f => ({ ...f, privateKey: e.target.value }))} placeholder="مفتاح API الخاص" dir="ltr" data-testid="input-atlas-private-key" />
                  <Button type="button" size="sm" variant="ghost" className="absolute left-1 top-1 h-6 px-1" onClick={() => setShowKey(v => !v)}>
                    {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Project ID</Label>
                <Input value={configForm.projectId} onChange={e => setConfigForm(f => ({ ...f, projectId: e.target.value }))} dir="ltr" data-testid="input-atlas-project-id" />
              </div>
              <div>
                <Label>Cluster Name</Label>
                <Input value={configForm.clusterName} onChange={e => setConfigForm(f => ({ ...f, clusterName: e.target.value }))} placeholder="Cluster0" dir="ltr" data-testid="input-atlas-cluster-name" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDefault" checked={configForm.isDefault} onChange={e => setConfigForm(f => ({ ...f, isDefault: e.target.checked }))} className="rounded" data-testid="check-atlas-default" />
              <Label htmlFor="isDefault">إعداد افتراضي</Label>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={testAtlas} disabled={!configForm.publicKey || !configForm.privateKey || testLoading} data-testid="button-test-atlas" className="gap-1">
                  {testLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} اختبار الاتصال
                </Button>
                {testResult && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${testResult.success ? "text-green-600" : "text-red-600"}`}>
                    {testResult.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {testResult.message}
                  </div>
                )}
              </div>
              {testResult?.projects?.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-gray-500">المشاريع المتاحة:</p>
                  {testResult.projects.map((p: any) => (
                    <button key={p.id} className="block w-full text-right text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded px-2 py-0.5" onClick={() => setConfigForm(f => ({ ...f, projectId: p.id, projectName: p.name }))}>
                      {p.name} ({p.id})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfigOpen(false)}>إلغاء</Button>
            <Button onClick={() => saveConfig.mutate(configForm)} disabled={saveConfig.isPending || !configForm.label || !configForm.publicKey} data-testid="button-save-atlas-config">
              {saveConfig.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create DB User Dialog */}
      <Dialog open={userOpen} onOpenChange={setUserOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء قاعدة بيانات جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>إعداد Atlas *</Label>
              <Select value={userForm.configId} onValueChange={v => setUserForm(f => ({ ...f, configId: v }))}>
                <SelectTrigger data-testid="select-db-config"><SelectValue placeholder="اختر إعداد Atlas" /></SelectTrigger>
                <SelectContent>{configs.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.label} {c.isDefault ? "(افتراضي)" : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>اسم قاعدة البيانات *</Label>
              <Input value={userForm.databaseName} onChange={e => setUserForm(f => ({ ...f, databaseName: e.target.value }))} placeholder="client_projectname_db" dir="ltr" data-testid="input-db-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>اسم المستخدم *</Label>
                <Input value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} placeholder="user_client123" dir="ltr" data-testid="input-db-username" />
              </div>
              <div>
                <Label>كلمة المرور *</Label>
                <Input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} dir="ltr" data-testid="input-db-password" />
              </div>
            </div>
            <div>
              <Label>اسم العميل (اختياري)</Label>
              <Input value={userForm.clientName} onChange={e => setUserForm(f => ({ ...f, clientName: e.target.value }))} data-testid="input-db-client-name" />
            </div>
            <div>
              <Label>ملاحظات (اختياري)</Label>
              <Textarea value={userForm.notes} onChange={e => setUserForm(f => ({ ...f, notes: e.target.value }))} className="h-16" data-testid="input-db-notes" />
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
              سيتم إنشاء مستخدم Atlas جديد بصلاحيات readWrite و dbAdmin على قاعدة البيانات المحددة، وإنتاج connection string جاهزة للاستخدام.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUserOpen(false)}>إلغاء</Button>
            <Button onClick={() => saveUser.mutate(userForm)} disabled={saveUser.isPending || !userForm.configId || !userForm.username || !userForm.password || !userForm.databaseName} data-testid="button-save-dbuser">
              {saveUser.isPending ? "جاري الإنشاء..." : "إنشاء قاعدة البيانات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
