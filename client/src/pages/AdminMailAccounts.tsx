import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail, Plus, Pencil, Trash2, Loader2, User, Users,
  Shield, ChevronDown, ChevronUp, Eye, EyeOff, X
} from "lucide-react";

interface MailAccount {
  id: string;
  emailAddress: string;
  displayName: string;
  jobTitle: string;
  isShared: boolean;
  sharedWith: string[];
  assignedUserId: string | null;
  assignedUser?: { id: string; fullName: string; role: string } | null;
}

interface Employee {
  _id: string;
  fullName?: string;
  username: string;
  role: string;
  email?: string;
}

const ROLES = ["admin", "manager", "ceo", "cto", "developer", "designer", "support", "sales", "accountant"];

export default function AdminMailAccounts() {
  const { L } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<MailAccount & { password: string }>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const { data: accounts = [], isLoading } = useQuery<MailAccount[]>({
    queryKey: ["/api/mail/accounts/all"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/admin/employees"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/mail/accounts/${id}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/mail/accounts/all"] });
      qc.invalidateQueries({ queryKey: ["/api/mail/accounts"] });
      setEditingId(null);
      toast({ title: L ? "تم التحديث" : "Updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/mail/accounts", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/mail/accounts/all"] });
      qc.invalidateQueries({ queryKey: ["/api/mail/accounts"] });
      setCreating(false);
      setForm({});
      toast({ title: L ? "تم إضافة الحساب" : "Account created" });
    },
    onError: (err: any) => {
      toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/mail/accounts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/mail/accounts/all"] });
      toast({ title: L ? "تم الحذف" : "Deleted" });
    },
  });

  function startEdit(account: MailAccount) {
    setEditingId(account.id);
    setCreating(false);
    setForm({
      displayName: account.displayName,
      jobTitle: account.jobTitle,
      assignedUserId: account.assignedUserId || undefined,
      isShared: account.isShared,
      sharedWith: account.sharedWith,
    });
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
          onClick={() => { setCreating(true); setEditingId(null); setForm({ imapHost: "server222.web-hosting.com", imapPort: 993, smtpHost: "server222.web-hosting.com", smtpPort: 465 }); }}
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
              <button onClick={() => setCreating(false)}><X className="w-4 h-4" /></button>
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
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreating(false)}>{L ? "إلغاء" : "Cancel"}</Button>
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
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-black/50 dark:text-white/50">
                      <span>{account.jobTitle}</span>
                      {account.assignedUser && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {account.assignedUser.fullName}
                        </span>
                      )}
                      {!account.assignedUser && !account.isShared && (
                        <span className="text-orange-500">{L ? "غير معيّن" : "Unassigned"}</span>
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
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => editingId === account.id ? setEditingId(null) : startEdit(account)} data-testid={`button-edit-${account.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-700" onClick={() => deleteMutation.mutate(account.id)} disabled={deleteMutation.isPending} data-testid={`button-delete-${account.id}`}>
                      {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

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
                      <div>
                        <label className="text-xs font-medium block mb-1">{L ? "كلمة المرور الجديدة (اختياري)" : "New Password (optional)"}</label>
                        <Input type="password" value={form.password || ""} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" dir="ltr" data-testid="input-edit-password" />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">{L ? "تعيين للموظف" : "Assign to Employee"}</label>
                        <Select
                          value={form.assignedUserId || "__none__"}
                          onValueChange={v => setForm(f => ({ ...f, assignedUserId: v === "__none__" ? undefined : v }))}
                        >
                          <SelectTrigger data-testid="select-assign-employee">
                            <SelectValue placeholder={L ? "اختر موظفاً" : "Select employee"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">{L ? "بدون تعيين" : "No assignment"}</SelectItem>
                            {employees.map(emp => (
                              <SelectItem key={emp._id} value={emp._id}>
                                {emp.fullName || emp.username} — {emp.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

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
                      <Button variant="outline" onClick={() => setEditingId(null)}>{L ? "إلغاء" : "Cancel"}</Button>
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
