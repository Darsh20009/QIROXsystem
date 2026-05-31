import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail, Plus, Pencil, Trash2, Loader2, User, Users,
  Shield, CheckCircle2, XCircle, Wifi, X, Check, Search
} from "lucide-react";

interface AssignedUser { id: string; fullName: string; role: string }
interface MailAccount {
  id: string;
  emailAddress: string;
  displayName: string;
  jobTitle: string;
  isShared: boolean;
  sharedWith: string[];
  assignedUserId: string | null;
  assignedUserIds?: string[];
  assignedUser?: AssignedUser | null;
  assignedUsers?: AssignedUser[];
}

interface Employee {
  _id: string;
  fullName?: string;
  username: string;
  role: string;
  email?: string;
}

interface TestResult {
  imap: boolean;
  smtp: boolean;
  imapError?: string;
  smtpError?: string;
}

const ROLES = ["admin", "manager", "ceo", "cto", "developer", "designer", "support", "sales", "accountant"];

export default function AdminMailAccounts() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<MailAccount & { password: string; imapHost: string; imapPort: number; smtpHost: string; smtpPort: number }>>({});
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [empSearch, setEmpSearch] = useState("");

  const { data: accounts = [], isLoading } = useQuery<MailAccount[]>({
    queryKey: ["/api/mail/accounts/all"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/admin/employees"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await apiRequest("PUT", `/api/mail/accounts/${id}`, data);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/mail/accounts/all"] });
      qc.invalidateQueries({ queryKey: ["/api/mail/accounts"] });
      setEditingId(null);
      setTestResult(null);
      toast({ title: L ? "تم التحديث" : "Updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", "/api/mail/accounts", data);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/mail/accounts/all"] });
      qc.invalidateQueries({ queryKey: ["/api/mail/accounts"] });
      setCreating(false);
      setForm({});
      setTestResult(null);
      toast({ title: L ? "تم إضافة الحساب" : "Account created" });
    },
    onError: (err: any) => {
      toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/mail/accounts/${id}`);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/mail/accounts/all"] });
      toast({ title: L ? "تم الحذف" : "Deleted" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (payload: any): Promise<TestResult> => {
      const r = await apiRequest("POST", "/api/mail/test-connection", payload);
      return r.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
      setTestingId(null);
    },
    onError: () => {
      setTestingId(null);
      toast({ title: L ? "فشل الاختبار" : "Test failed", variant: "destructive" });
    },
  });

  function startEdit(account: MailAccount) {
    setEditingId(account.id);
    setCreating(false);
    setTestResult(null);
    setEmpSearch("");
    // Combine new + legacy assignment so old data still shows up
    const ids = new Set<string>(account.assignedUserIds || []);
    if (account.assignedUserId) ids.add(account.assignedUserId);
    setForm({
      displayName: account.displayName,
      jobTitle: account.jobTitle,
      assignedUserIds: [...ids],
      isShared: account.isShared,
      sharedWith: account.sharedWith,
    });
  }

  function toggleEmployee(empId: string) {
    const current = form.assignedUserIds || [];
    if (current.includes(empId)) {
      setForm(f => ({ ...f, assignedUserIds: current.filter(x => x !== empId) }));
    } else {
      setForm(f => ({ ...f, assignedUserIds: [...current, empId] }));
    }
  }

  function toggleRole(role: string) {
    const current = form.sharedWith || [];
    if (current.includes(role)) {
      setForm(f => ({ ...f, sharedWith: current.filter(r => r !== role) }));
    } else {
      setForm(f => ({ ...f, sharedWith: [...current, role] }));
    }
  }

  function saveEdit(id: string) {
    updateMutation.mutate({ id, data: form });
  }

  function saveCreate() {
    if (!form.emailAddress || !form.password) {
      toast({ title: L ? "البريد وكلمة المرور مطلوبان" : "Email and password required", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  }

  function runTest(accountId: string | null, emailAddress?: string) {
    setTestingId(accountId || "new");
    setTestResult(null);
    const payload: any = {};
    if (accountId) {
      payload.accountId = accountId;
      if (form.password) payload.password = form.password;
    } else {
      payload.emailAddress = emailAddress || form.emailAddress;
      payload.password = form.password;
      if (form.imapHost) payload.imapHost = form.imapHost;
      if (form.imapPort) payload.imapPort = form.imapPort;
      if (form.smtpHost) payload.smtpHost = form.smtpHost;
      if (form.smtpPort) payload.smtpPort = form.smtpPort;
    }
    testMutation.mutate(payload);
  }

  function TestResultBadge({ result }: { result: TestResult }) {
    return (
      <div className="flex flex-wrap gap-2 mt-3 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${result.imap ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
          {result.imap ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          IMAP {result.imap ? (L ? "✓ يعمل" : "✓ OK") : (L ? `✗ فشل${result.imapError ? `: ${result.imapError}` : ""}` : `✗ Failed${result.imapError ? `: ${result.imapError}` : ""}`)}
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${result.smtp ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
          {result.smtp ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          SMTP {result.smtp ? (L ? "✓ يعمل" : "✓ OK") : (L ? `✗ فشل${result.smtpError ? `: ${result.smtpError}` : ""}` : `✗ Failed${result.smtpError ? `: ${result.smtpError}` : ""}`)}
        </div>
        {!result.imap && !result.smtp && (
          <p className="w-full text-[11px] text-red-500/80 mt-1">
            {L ? "تأكّد من صحة كلمة المرور في لوحة تحكم cPanel/Webmail ثم حدّثها هنا" : "Verify the password in cPanel / Webmail, then update it here"}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir={L ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{L ? "إدارة حسابات البريد الإلكتروني" : "Email Accounts Management"}</h1>
          <p className="text-sm text-black/50 dark:text-white/50 mt-1">
            {L ? "أضف حسابات بريدية وعيّن الموظفين لها" : "Add email accounts and assign employees to them"}
          </p>
        </div>
        <Button
          onClick={() => { setCreating(true); setEditingId(null); setTestResult(null); setForm({ imapHost: "server222.web-hosting.com", imapPort: 993, smtpHost: "server222.web-hosting.com", smtpPort: 465 }); }}
          className="bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black gap-2"
          data-testid="button-add-account"
        >
          <Plus className="w-4 h-4" />
          {L ? "إضافة حساب" : "Add Account"}
        </Button>
      </div>

      {/* Create form */}
      {creating && (
        <Card className="border-2 border-black dark:border-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><Plus className="w-4 h-4" />{L ? "حساب بريدي جديد" : "New Email Account"}</span>
              <button onClick={() => { setCreating(false); setTestResult(null); }}><X className="w-4 h-4" /></button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">{L ? "البريد الإلكتروني" : "Email Address"} *</label>
                <Input value={form.emailAddress || ""} onChange={e => setForm(f => ({ ...f, emailAddress: e.target.value }))} placeholder="user@qiroxstudio.online" dir="ltr" data-testid="input-new-email" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">{L ? "كلمة المرور" : "Password"} *</label>
                <Input type="password" value={form.password || ""} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" dir="ltr" data-testid="input-new-password" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">{L ? "الاسم المعروض" : "Display Name"}</label>
                <Input value={form.displayName || ""} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder={L ? "محمد الدباني" : "Display Name"} data-testid="input-new-displayname" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">{L ? "المنصب" : "Job Title"}</label>
                <Input value={form.jobTitle || ""} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder={L ? "المدير التنفيذي" : "CEO"} data-testid="input-new-jobtitle" />
              </div>
            </div>
            {testResult && testingId === "new" && <TestResultBadge result={testResult} />}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setCreating(false); setTestResult(null); }}>{L ? "إلغاء" : "Cancel"}</Button>
              <Button
                variant="outline"
                onClick={() => runTest(null)}
                disabled={testMutation.isPending || !form.emailAddress || !form.password}
                className="gap-1.5"
                data-testid="button-test-new"
              >
                {testMutation.isPending && testingId === "new" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                {L ? "اختبار الاتصال" : "Test Connection"}
              </Button>
              <Button onClick={saveCreate} disabled={createMutation.isPending} className="bg-black text-white dark:bg-white dark:text-black gap-2">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {L ? "حفظ" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(account => (
            <Card key={account.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Account header row */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-white dark:text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{account.displayName || account.emailAddress.split("@")[0]}</span>
                      <span className="text-xs text-black/40 dark:text-white/40 font-mono">{account.emailAddress}</span>
                      {account.isShared && (
                        <Badge className="text-[10px] bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border-0">
                          <Users className="w-2.5 h-2.5 mr-1" />{L ? "مشترك" : "Shared"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-black/50 dark:text-white/50 flex-wrap">
                      <span>{account.jobTitle}</span>
                      {(account.assignedUsers && account.assignedUsers.length > 0) ? (
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <User className="w-3 h-3" />
                          {account.assignedUsers.map((u, i) => (
                            <span key={u.id} className="inline-flex items-center gap-1">
                              <span data-testid={`text-assigned-${account.id}-${u.id}`}>{u.fullName}</span>
                              {i < (account.assignedUsers!.length - 1) && <span className="text-black/30 dark:text-white/30">،</span>}
                            </span>
                          ))}
                          <Badge className="text-[10px] bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border-0 ml-1">
                            {account.assignedUsers.length} {L ? "موظف" : "users"}
                          </Badge>
                        </span>
                      ) : (
                        !account.isShared && <span className="text-orange-500">{L ? "غير معيّن" : "Unassigned"}</span>
                      )}
                      {account.isShared && account.sharedWith.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {account.sharedWith.join("، ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs gap-1"
                      disabled={testMutation.isPending && testingId === account.id}
                      onClick={() => { setTestingId(account.id); setTestResult(null); testMutation.mutate({ accountId: account.id }); }}
                      data-testid={`button-test-${account.id}`}
                    >
                      {testMutation.isPending && testingId === account.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                      {L ? "اختبار" : "Test"}
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => editingId === account.id ? (setEditingId(null), setTestResult(null)) : startEdit(account)} data-testid={`button-edit-${account.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-700" onClick={() => deleteMutation.mutate(account.id)} disabled={deleteMutation.isPending} data-testid={`button-delete-${account.id}`}>
                      {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Inline test result for this account (outside edit panel) */}
                {testResult && testingId === account.id && editingId !== account.id && (
                  <div className="px-4 pb-3">
                    <TestResultBadge result={testResult} />
                  </div>
                )}

                {/* Edit panel */}
                {editingId === account.id && (
                  <div className="border-t border-black/10 dark:border-white/10 p-4 bg-black/[0.02] dark:bg-white/[0.02] space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium block mb-1">{L ? "الاسم المعروض" : "Display Name"}</label>
                        <Input value={form.displayName || ""} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} data-testid="input-edit-displayname" />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">{L ? "المنصب" : "Job Title"}</label>
                        <Input value={form.jobTitle || ""} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} data-testid="input-edit-jobtitle" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium block mb-1">
                          {L ? "كلمة المرور الجديدة" : "New Password"}
                          <span className="text-black/40 dark:text-white/40 font-normal mr-1">{L ? "(اختر واختبر قبل الحفظ)" : "(enter then Test before saving)"}</span>
                        </label>
                        <Input type="password" value={form.password || ""} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" dir="ltr" data-testid="input-edit-password" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium block mb-1.5 flex items-center justify-between">
                          <span>{L ? "تعيين للموظفين (يمكن اختيار أكثر من موظف)" : "Assign to Employees (multi-select)"}</span>
                          <span className="text-[11px] text-black/40 dark:text-white/40 font-normal">
                            {(form.assignedUserIds?.length || 0)} {L ? "محدّد" : "selected"}
                          </span>
                        </label>

                        {/* Selected chips */}
                        {(form.assignedUserIds && form.assignedUserIds.length > 0) && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {form.assignedUserIds.map(eid => {
                              const emp = employees.find(e => e._id === eid);
                              if (!emp) return null;
                              return (
                                <button
                                  key={eid}
                                  onClick={() => toggleEmployee(eid)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition-opacity"
                                  data-testid={`chip-assigned-${eid}`}
                                >
                                  {emp.fullName || emp.username}
                                  <X className="w-3 h-3" />
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Search + employee list */}
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40 dark:text-white/40 pointer-events-none" />
                          <Input
                            value={empSearch}
                            onChange={e => setEmpSearch(e.target.value)}
                            placeholder={L ? "ابحث عن موظف..." : "Search employee..."}
                            className="pl-8 h-9 text-sm"
                            dir={L ? "rtl" : "ltr"}
                            data-testid="input-employee-search"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
                          {employees
                            .filter(emp => {
                              if (!empSearch) return true;
                              const q = empSearch.toLowerCase();
                              return (
                                (emp.fullName || "").toLowerCase().includes(q) ||
                                (emp.username || "").toLowerCase().includes(q) ||
                                (emp.email || "").toLowerCase().includes(q) ||
                                (emp.role || "").toLowerCase().includes(q)
                              );
                            })
                            .map(emp => {
                              const checked = (form.assignedUserIds || []).includes(emp._id);
                              return (
                                <button
                                  key={emp._id}
                                  onClick={() => toggleEmployee(emp._id)}
                                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors text-left ${checked ? "bg-black/[0.04] dark:bg-white/[0.04]" : ""}`}
                                  data-testid={`row-employee-${emp._id}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-black dark:bg-white border-black dark:border-white" : "border-black/30 dark:border-white/30"}`}>
                                      {checked && <Check className="w-3 h-3 text-white dark:text-black" />}
                                    </div>
                                    <span className="font-medium truncate">{emp.fullName || emp.username}</span>
                                    <span className="text-black/40 dark:text-white/40 truncate">{emp.role}</span>
                                  </div>
                                </button>
                              );
                            })}
                          {employees.length === 0 && (
                            <div className="px-3 py-4 text-center text-xs text-black/40 dark:text-white/40">
                              {L ? "لا يوجد موظفون" : "No employees"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Test result inside edit panel */}
                    {testResult && testingId === account.id && <TestResultBadge result={testResult} />}

                    {/* Shared roles */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs font-medium">{L ? "صندوق مشترك؟ (يظهر للأدوار التالية)" : "Shared inbox? (visible to roles)"}</label>
                        <button
                          className={`w-9 h-5 rounded-full transition-colors ${form.isShared ? "bg-black dark:bg-white" : "bg-black/20 dark:bg-white/20"}`}
                          onClick={() => setForm(f => ({ ...f, isShared: !f.isShared }))}
                          data-testid="toggle-shared"
                        >
                          <span className={`block w-4 h-4 rounded-full bg-white dark:bg-black mx-0.5 transition-transform ${form.isShared ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                      </div>
                      {form.isShared && (
                        <div className="flex flex-wrap gap-2">
                          {ROLES.map(role => (
                            <button
                              key={role}
                              onClick={() => toggleRole(role)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${(form.sharedWith || []).includes(role) ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white" : "bg-transparent text-black/50 dark:text-white/50 border-black/20 dark:border-white/20 hover:border-black/50"}`}
                              data-testid={`toggle-role-${role}`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => { setEditingId(null); setTestResult(null); }}>{L ? "إلغاء" : "Cancel"}</Button>
                      <Button
                        variant="outline"
                        onClick={() => runTest(account.id)}
                        disabled={testMutation.isPending}
                        className="gap-1.5"
                        data-testid={`button-test-edit-${account.id}`}
                      >
                        {testMutation.isPending && testingId === account.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                        {L ? "اختبار الاتصال" : "Test Connection"}
                      </Button>
                      <Button onClick={() => saveEdit(account.id)} disabled={updateMutation.isPending} className="bg-black text-white dark:bg-white dark:text-black gap-2">
                        {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {L ? "حفظ التغييرات" : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {accounts.length === 0 && !isLoading && (
            <div className="text-center py-16 text-black/30 dark:text-white/30">
              <Mail className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">{L ? "لا توجد حسابات بريدية" : "No email accounts"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
