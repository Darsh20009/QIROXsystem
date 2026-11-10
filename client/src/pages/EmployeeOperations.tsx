import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, FileSignature, Loader2, MessageCircle, Send, UserRoundX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Employee = {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  jobTitle: string;
  nationalId: string;
  hasWhatsApp: boolean;
  employmentStatus: string;
  salary: { salaryType: string; fixedSalary: number; hourlyRate: number; commissionRate: number };
};

type EmployeeMessage = {
  id: string;
  kind: string;
  recipientName: string;
  message: string;
  status: "draft" | "sending" | "sent" | "failed";
  error?: string;
  createdAt: string;
};

type SubscriptionProject = {
  id: string;
  name: string;
  client: { id: string; name: string; hasWhatsApp: boolean } | null;
  subscription: { period: string; status: string; expiresAt: string; remainingDays: number | null };
  assignedEmployees: { id: string; name: string; role: string; hasWhatsApp: boolean }[];
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await apiRequest(method, path, body);
  return response.json() as Promise<T>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "تعذر إكمال العملية.";
}

function dateLabel(value?: string | Date | null): string {
  if (!value) return "غير محدد";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "غير محدد" : date.toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh", year: "numeric", month: "long", day: "numeric" });
}

function salaryLabel(employee?: Employee): string {
  if (!employee) return "";
  if (employee.salary.salaryType === "fixed") return `${employee.salary.fixedSalary.toLocaleString("ar-SA")} ريال شهريًا`;
  if (employee.salary.salaryType === "hourly") return `${employee.salary.hourlyRate.toLocaleString("ar-SA")} ريال للساعة`;
  return `عمولة ${employee.salary.commissionRate}%`;
}

function statusLabel(status: string): string {
  if (status === "sent") return "تم الإرسال";
  if (status === "failed") return "فشل الإرسال";
  if (status === "sending") return "جارٍ الإرسال";
  return "بانتظار الإرسال";
}

function statusTone(status: string): string {
  if (status === "sent") return "bg-emerald-100 text-emerald-800";
  if (status === "failed") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function kindLabel(kind: string): string {
  return ({
    role_notice: "رسالة الدور الوظيفي",
    contract: "عقد موظف",
    termination_notice: "إشعار إنهاء خدمة",
    subscription_reminder: "تذكير اشتراك مشروع",
  } as Record<string, string>)[kind] || kind;
}

export default function EmployeeOperations() {
  const [tab, setTab] = useState<"contracts" | "role" | "termination" | "reminders">(() => {
    if (typeof window === "undefined") return "contracts";
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    return requestedTab === "role" || requestedTab === "termination" || requestedTab === "reminders" ? requestedTab : "contracts";
  });
  const [employeeId, setEmployeeId] = useState(() => (
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("employeeId") || ""
  ));
  const [roleText, setRoleText] = useState("");
  const [employerLegalName, setEmployerLegalName] = useState("");
  const [employerCommercialReg, setEmployerCommercialReg] = useState("");
  const [contractForm, setContractForm] = useState({
    contractType: "indefinite",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    workLocation: "",
    weeklyHours: "",
    probationDays: "",
  });
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationConfirmed, setTerminationConfirmed] = useState(false);
  const [terminationDraft, setTerminationDraft] = useState<EmployeeMessage | null>(null);
  const [terminationText, setTerminationText] = useState("");
  const [projectId, setProjectId] = useState("");
  const [recipientType, setRecipientType] = useState<"client" | "employee">("client");
  const [recipientId, setRecipientId] = useState("");
  const [reminderText, setReminderText] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const bootstrapQuery = useQuery({
    queryKey: ["employee-operations", "bootstrap"],
    queryFn: () => request<{ employees: Employee[]; brandName: string; employerCommercialReg: string; legalReviewNotice: string }>(
      "GET",
      "/api/v2/employee-operations/bootstrap",
    ),
  });
  const contractsQuery = useQuery({
    queryKey: ["employee-operations", "contracts"],
    queryFn: () => request<{ contracts: any[] }>("GET", "/api/v2/employee-operations/contracts"),
  });
  const messagesQuery = useQuery({
    queryKey: ["employee-operations", "messages"],
    queryFn: () => request<{ messages: EmployeeMessage[] }>("GET", "/api/v2/employee-operations/messages"),
  });
  const projectsQuery = useQuery({
    queryKey: ["employee-operations", "subscription-projects"],
    queryFn: () => request<{ projects: SubscriptionProject[] }>("GET", "/api/v2/employee-operations/subscription-projects"),
    enabled: tab === "reminders",
  });

  const employees = bootstrapQuery.data?.employees || [];
  const activeEmployees = employees.filter((employee) => employee.employmentStatus !== "terminated");
  const selectedEmployee = employees.find((employee) => employee.id === employeeId);
  const projects = projectsQuery.data?.projects || [];
  const selectedProject = projects.find((project) => project.id === projectId);
  const recipients = useMemo(() => {
    if (!selectedProject) return [];
    if (recipientType === "client") return selectedProject.client ? [selectedProject.client] : [];
    return selectedProject.assignedEmployees;
  }, [selectedProject, recipientType]);
  const selectedRecipient: any = recipients.find((recipient: any) => recipient.id === recipientId);

  useEffect(() => {
    if (!employeeId && activeEmployees.length) setEmployeeId(activeEmployees[0].id);
  }, [employeeId, activeEmployees]);

  useEffect(() => {
    if (bootstrapQuery.data?.employerCommercialReg && !employerCommercialReg) {
      setEmployerCommercialReg(bootstrapQuery.data.employerCommercialReg);
    }
  }, [bootstrapQuery.data?.employerCommercialReg, employerCommercialReg]);

  const rolePreviewQuery = useQuery({
    queryKey: ["employee-operations", "role-preview", employeeId],
    queryFn: () => request<{ message: string }>("GET", `/api/v2/employee-operations/employees/${employeeId}/role-message`),
    enabled: Boolean(employeeId) && tab === "role",
  });
  useEffect(() => {
    if (rolePreviewQuery.data?.message) setRoleText(rolePreviewQuery.data.message);
  }, [rolePreviewQuery.data?.message]);

  const createContractMutation = useMutation({
    mutationFn: () => request<{ contract: any }>("POST", "/api/v2/employee-operations/contracts", {
      employeeId,
      employerLegalName,
      employerCommercialReg,
      ...contractForm,
      weeklyHours: Number(contractForm.weeklyHours),
      probationDays: Number(contractForm.probationDays),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "contracts"] });
      toast({ title: "تم إنشاء مسودة العقد", description: "راجع بيانات المسودة وحمّلها قبل إرسالها للموظف." });
    },
    onError: (error) => toast({ title: "تعذر إنشاء المسودة", description: errorMessage(error), variant: "destructive" }),
  });

  const sendRoleMutation = useMutation({
    mutationFn: () => request("POST", `/api/v2/employee-operations/employees/${employeeId}/role-message`, { message: roleText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "messages"] });
      toast({ title: "تم إرسال رسالة الدور الوظيفي عبر واتساب." });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "messages"] });
      toast({ title: "تعذر الإرسال", description: errorMessage(error), variant: "destructive" });
    },
  });

  const terminateMutation = useMutation({
    mutationFn: () => request<{ terminationMessage: EmployeeMessage }>(
      "POST",
      `/api/v2/employee-operations/employees/${employeeId}/terminate`,
      { reason: terminationReason },
    ),
    onSuccess: (data) => {
      setTerminationDraft(data.terminationMessage);
      setTerminationText(data.terminationMessage.message);
      setTerminationConfirmed(false);
      setEmployeeId((current) => current === employeeId ? "" : current);
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "bootstrap"] });
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "contracts"] });
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "messages"] });
      toast({ title: "تم إيقاف الدخول وحفظ سجل الموظف", description: "راجع إشعار واتساب قبل إرساله." });
    },
    onError: (error) => toast({ title: "تعذر إنهاء الخدمة", description: errorMessage(error), variant: "destructive" }),
  });

  const sendDraftMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      request<{ message: EmployeeMessage }>("POST", `/api/v2/employee-operations/messages/${id}/send`, { message }),
    onSuccess: (_data, variables) => {
      if (terminationDraft?.id === variables.id) setTerminationDraft(null);
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "messages"] });
      toast({ title: "تم الإرسال عبر واتساب." });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "messages"] });
      toast({ title: "تعذر الإرسال", description: errorMessage(error), variant: "destructive" });
    },
  });

  const sendContractMutation = useMutation({
    mutationFn: (id: string) => request("POST", `/api/v2/employee-operations/contracts/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "contracts"] });
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "messages"] });
      toast({ title: "تم إرسال مسودة العقد ومرفقها عبر واتساب." });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "contracts"] });
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "messages"] });
      toast({ title: "تعذر إرسال العقد", description: errorMessage(error), variant: "destructive" });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: () => request("POST", "/api/v2/employee-operations/subscription-reminders", {
      projectId,
      targetType: recipientType,
      targetId: recipientId,
      message: reminderText,
    }),
    onSuccess: () => {
      setReminderText("");
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "messages"] });
      toast({ title: "تم إرسال تذكير الاشتراك عبر واتساب." });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["employee-operations", "messages"] });
      toast({ title: "تعذر إرسال التذكير", description: errorMessage(error), variant: "destructive" });
    },
  });

  const handleDownloadContract = async (id: string, number: string) => {
    try {
      const response = await apiRequest("GET", `/api/v2/employee-operations/contracts/${id}/pdf`);
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${number}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "تعذر تنزيل العقد", description: errorMessage(error), variant: "destructive" });
    }
  };

  useEffect(() => {
    if (selectedProject && !recipients.some((recipient: any) => recipient.id === recipientId)) {
      setRecipientId(recipients[0]?.id || "");
    }
  }, [selectedProject, recipients, recipientId]);

  useEffect(() => {
    if (!selectedProject || !selectedRecipient) {
      setReminderText("");
      return;
    }
    const expires = dateLabel(selectedProject.subscription.expiresAt);
    const text = recipientType === "employee"
      ? [
          `تذكير متابعة: اشتراك مشروع «${selectedProject.name}» للعميل ${selectedProject.client?.name || "العميل"} ينتهي بتاريخ ${expires}.`,
          "يرجى متابعة حالة المشروع والتواصل مع العميل عند الحاجة للتجديد.",
          "QIROX Studio",
        ].join("\n")
      : [
          `السلام عليكم ${selectedRecipient.name}،`,
          "",
          `نحب نذكّرك بأن اشتراك مشروع «${selectedProject.name}» لدى QIROX Studio ينتهي بتاريخ ${expires}.`,
          "إذا رغبت بالتجديد أو بمراجعة احتياج مشروعك، رد على هذه الرسالة وسنساعدك.",
          "",
          "فريق QIROX Studio",
        ].join("\n");
    setReminderText(text);
  }, [selectedProject?.id, recipientType, recipientId]);

  if (bootstrapQuery.isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center" dir="rtl"><Loader2 className="w-6 h-6 animate-spin text-emerald-700" /></div>;
  }

  if (bootstrapQuery.isError) {
    return (
      <div className="max-w-3xl mx-auto p-6" dir="rtl">
        <Card><CardContent className="p-6 text-red-700 flex gap-3"><AlertCircle className="w-5 h-5 shrink-0" />تعذر تحميل بيانات الموظفين. تحقق من صلاحيتك واتصال النظام.</CardContent></Card>
      </div>
    );
  }

  const tabs = [
    { id: "contracts", label: "عقود الموظفين", icon: FileSignature },
    { id: "role", label: "رسالة الدور", icon: MessageCircle },
    { id: "termination", label: "إنهاء خدمة", icon: UserRoundX },
    { id: "reminders", label: "تذكير الاشتراك", icon: Send },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 space-y-5" dir="rtl">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-bold text-emerald-700 mb-1">الموارد البشرية والتواصل</div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white">عقود ورسائل الموظفين</h1>
          <p className="text-sm text-slate-500 mt-2">إرسال يدوي عبر جلسة واتساب المرتبطة، مع سجل واضح لكل عملية.</p>
        </div>
        <Badge variant="outline" className="w-fit">إرسال بعد المراجعة</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button key={id} variant={tab === id ? "default" : "outline"} className={tab === id ? "bg-emerald-700 hover:bg-emerald-800" : ""} onClick={() => setTab(id)}>
            <Icon className="w-4 h-4 ml-2" />{label}
          </Button>
        ))}
      </div>

      {tab === "contracts" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          <Card>
            <CardContent className="p-5 md:p-6 space-y-4">
              <div>
                <h2 className="font-black text-lg">إنشاء مسودة عقد عمل</h2>
                <p className="text-xs text-slate-500 mt-1">البيانات والحقوق المطلوبة تظهر في مسودة مستقلة عن عقود العملاء.</p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-950 leading-6">
                <div className="font-bold">مهم قبل الإرسال</div>
                {bootstrapQuery.data?.legalReviewNotice}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>الموظف</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                    <option value="">اختر موظفًا</option>
                    {activeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} — {employee.roleLabel}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>الاسم النظامي للمنشأة</Label>
                  <Input value={employerLegalName} onChange={(e) => setEmployerLegalName(e.target.value)} placeholder="اكتب الاسم المسجل رسميًا" />
                </div>
                <div className="space-y-1.5">
                  <Label>السجل التجاري أو رقم الترخيص</Label>
                  <Input value={employerCommercialReg} onChange={(e) => setEmployerCommercialReg(e.target.value)} placeholder="إن وجد" />
                </div>
                <div className="space-y-1.5">
                  <Label>نوع العقد</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={contractForm.contractType} onChange={(e) => setContractForm({ ...contractForm, contractType: e.target.value })}>
                    <option value="indefinite">غير محدد المدة</option>
                    <option value="fixed">محدد المدة</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>تاريخ بداية العمل</Label>
                  <Input type="date" value={contractForm.startDate} onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })} />
                </div>
                {contractForm.contractType === "fixed" && (
                  <div className="space-y-1.5">
                    <Label>تاريخ نهاية العقد</Label>
                    <Input type="date" value={contractForm.endDate} onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>مكان العمل</Label>
                  <Input value={contractForm.workLocation} onChange={(e) => setContractForm({ ...contractForm, workLocation: e.target.value })} placeholder="المدينة أو العمل عن بعد" />
                </div>
                <div className="space-y-1.5">
                  <Label>ساعات العمل الأسبوعية المتفق عليها</Label>
                  <Input type="number" min="1" max="168" value={contractForm.weeklyHours} onChange={(e) => setContractForm({ ...contractForm, weeklyHours: e.target.value })} placeholder="أدخل العدد" />
                </div>
                <div className="space-y-1.5">
                  <Label>فترة التجربة المقترحة (يوم)</Label>
                  <Input type="number" min="0" max="180" value={contractForm.probationDays} onChange={(e) => setContractForm({ ...contractForm, probationDays: e.target.value })} placeholder="أدخل العدد" />
                </div>
              </div>
              {selectedEmployee && (
                <div className="rounded-xl border p-3 text-sm">
                  <span className="text-slate-500">بيانات الأجر المحفوظة للموظف: </span><strong>{salaryLabel(selectedEmployee) || "غير مكتملة"}</strong>
                </div>
              )}
              <div className="rounded-xl border p-4 space-y-2 text-sm">
                <div className="font-bold">البنود المدرجة في المسودة</div>
                <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5" />ملكية مخرجات العمل المنشأة ضمن الوظيفة، بالحدود التي يسمح بها النظام.</div>
                <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5" />سرية معلومات الشركة والعملاء.</div>
                <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5" />تسليم العهد والملفات وإغلاق الصلاحيات عند انتهاء العمل.</div>
              </div>
              <Button
                className="w-full bg-emerald-700 hover:bg-emerald-800"
                disabled={!employeeId || !employerLegalName.trim() || createContractMutation.isPending}
                onClick={() => createContractMutation.mutate()}
              >
                {createContractMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileSignature className="w-4 h-4 ml-2" />}
                إنشاء المسودة
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 md:p-6 space-y-4">
              <div>
                <h2 className="font-black text-lg">العقود المحفوظة</h2>
                <p className="text-xs text-slate-500 mt-1">نزّل المسودة لمراجعتها، ثم أرسلها للموظف عبر واتساب.</p>
              </div>
              {contractsQuery.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <div className="space-y-3 max-h-[680px] overflow-y-auto">
                {(contractsQuery.data?.contracts || []).map((contract: any) => (
                  <div key={contract.id} className="rounded-xl border p-4 space-y-3">
                    <div className="flex justify-between gap-3">
                      <div>
                        <div className="font-bold">{contract.employeeName}</div>
                        <div className="text-xs text-slate-500">{contract.jobTitle} · {contract.contractNumber}</div>
                      </div>
                      <Badge variant="outline">{contract.status === "sent" ? "أُرسل" : contract.status === "terminated" ? "منتهٍ" : "مسودة"}</Badge>
                    </div>
                    <div className="text-xs text-slate-500">البداية: {dateLabel(contract.startDate)}{contract.endDate ? ` · النهاية: ${dateLabel(contract.endDate)}` : ""}</div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleDownloadContract(contract.id, contract.contractNumber)}>تنزيل PDF</Button>
                      <Button
                        size="sm"
                        className="bg-emerald-700 hover:bg-emerald-800"
                        disabled={contract.status === "terminated" || sendContractMutation.isPending || !contract.employerLegalName}
                        onClick={() => sendContractMutation.mutate(contract.id)}
                      >
                        {sendContractMutation.isPending ? <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> : <Send className="w-3.5 h-3.5 ml-1" />}
                        إرسال عبر واتساب
                      </Button>
                    </div>
                    {!contract.employerLegalName && <p className="text-xs text-amber-700">أدخل الاسم النظامي للمنشأة في المسودة قبل الإرسال.</p>}
                  </div>
                ))}
                {!contractsQuery.isLoading && !(contractsQuery.data?.contracts || []).length && <p className="text-sm text-slate-500">لا توجد مسودات محفوظة بعد.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "role" && (
        <Card>
          <CardContent className="p-5 md:p-6 space-y-4">
            <div>
              <h2 className="font-black text-lg">مراجعة رسالة الدور الوظيفي</h2>
              <p className="text-xs text-slate-500 mt-1">تُرسل يدويًا بعد الإضافة أو تغيير الدور. راجع الاسم والدور وعدّل النص قبل الإرسال.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(220px,0.6fr)_1fr]">
              <div className="space-y-1.5">
                <Label>الموظف</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  {activeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} — {employee.roleLabel}</option>)}
                </select>
                {selectedEmployee && <p className="text-xs text-slate-500">الدور الحالي: {selectedEmployee.roleLabel} · {selectedEmployee.jobTitle}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>نص الرسالة — قابل للتعديل</Label>
                <Textarea value={roleText} onChange={(e) => setRoleText(e.target.value)} rows={9} maxLength={3000} placeholder="جارٍ تجهيز الرسالة..." />
                <div className="text-left text-[11px] text-slate-400">{roleText.length}/3000</div>
              </div>
            </div>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              disabled={!selectedEmployee?.hasWhatsApp || !roleText.trim() || sendRoleMutation.isPending}
              onClick={() => sendRoleMutation.mutate()}
            >
              {sendRoleMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Send className="w-4 h-4 ml-2" />}
              إرسال بعد المراجعة
            </Button>
            {selectedEmployee && !selectedEmployee.hasWhatsApp && <p className="text-xs text-amber-700">لا يوجد رقم واتساب محفوظ لهذا الموظف.</p>}
          </CardContent>
        </Card>
      )}

      {tab === "termination" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1fr)]">
          <Card>
            <CardContent className="p-5 md:p-6 space-y-4">
              <div>
                <h2 className="font-black text-lg">إنهاء خدمة موظف</h2>
                <p className="text-xs text-slate-500 mt-1">يحفظ السجل، يوقف الدخول ويحذف رموز الأجهزة والجلسات. لا يحذف حساب الموظف.</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 leading-6">
                بعد التأكيد لن يستطيع الموظف تسجيل الدخول. سيُحفظ إشعار واتساب كمسودة لمراجعتها وإرسالها بشكل منفصل.
              </div>
              <div className="space-y-1.5">
                <Label>الموظف</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  <option value="">اختر موظفًا</option>
                  {activeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} — {employee.roleLabel}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>ملاحظة داخلية للسجل (اختياري)</Label>
                <Textarea value={terminationReason} onChange={(e) => setTerminationReason(e.target.value)} rows={3} maxLength={500} placeholder="سبب أو ملاحظة داخلية" />
              </div>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={terminationConfirmed} onChange={(e) => setTerminationConfirmed(e.target.checked)} className="mt-1" />
                <span>أؤكد إيقاف دخول هذا الموظف الآن مع الاحتفاظ بسجله.</span>
              </label>
              <Button
                variant="destructive"
                disabled={!employeeId || !terminationConfirmed || terminateMutation.isPending}
                onClick={() => terminateMutation.mutate()}
              >
                {terminateMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <UserRoundX className="w-4 h-4 ml-2" />}
                إيقاف الدخول وإنهاء العقد
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 md:p-6 space-y-4">
              <h2 className="font-black text-lg">إشعار واتساب للموظف</h2>
              {terminationDraft ? (
                <>
                  <p className="text-sm text-slate-600">راجع الإشعار التالي. لن يُرسل إلا بعد الضغط على الزر.</p>
                  <Textarea value={terminationText} onChange={(e) => setTerminationText(e.target.value)} rows={12} maxLength={3000} />
                  {!terminationDraft.error && <Button className="bg-emerald-700 hover:bg-emerald-800" disabled={sendDraftMutation.isPending} onClick={() => sendDraftMutation.mutate({ id: terminationDraft.id, message: terminationText })}>
                    {sendDraftMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Send className="w-4 h-4 ml-2" />}إرسال الإشعار
                  </Button>}
                  {terminationDraft.error && <p className="text-sm text-red-700">{terminationDraft.error}</p>}
                </>
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
                  <MessageCircle className="w-7 h-7 mx-auto mb-2 opacity-40" />
                  بعد إيقاف الموظف، ستظهر هنا رسالة قابلة للمراجعة.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "reminders" && (
        <Card>
          <CardContent className="p-5 md:p-6 space-y-4">
            <div>
              <h2 className="font-black text-lg">تذكير يدوي بموعد اشتراك المشروع</h2>
              <p className="text-xs text-slate-500 mt-1">اختر المشروع ثم العميل أو موظفًا معيّنًا عليه. لن تُرسل تذكيرات تلقائية.</p>
            </div>
            {projectsQuery.isLoading ? <div className="flex items-center gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin" />تحميل المشاريع والاشتراكات...</div> : null}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>المشروع</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={projectId} onChange={(e) => { setProjectId(e.target.value); setRecipientId(""); }}>
                  <option value="">اختر مشروعًا</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} — {project.client?.name || "بدون عميل"}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>نوع المستلم</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={recipientType} onChange={(e) => { setRecipientType(e.target.value as "client" | "employee"); setRecipientId(""); }}>
                  <option value="client">العميل</option>
                  <option value="employee">موظف معيّن على المشروع</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>المستلم</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} disabled={!selectedProject}>
                  <option value="">اختر المستلم</option>
                  {recipients.map((recipient: any) => <option key={recipient.id} value={recipient.id}>{recipient.name}{recipient.role ? ` — ${recipient.role}` : ""}</option>)}
                </select>
              </div>
            </div>
            {selectedProject && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 border p-3 text-sm">
                المشروع: <strong>{selectedProject.name}</strong>
                {" · "}انتهاء الاشتراك: <strong>{dateLabel(selectedProject.subscription.expiresAt)}</strong>
                {typeof selectedProject.subscription.remainingDays === "number" && <span> · {selectedProject.subscription.remainingDays < 0 ? `منتهي منذ ${Math.abs(selectedProject.subscription.remainingDays)} يومًا` : `متبقي ${selectedProject.subscription.remainingDays} يومًا`}</span>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>معاينة الرسالة — قابلة للتعديل قبل الإرسال</Label>
              <Textarea value={reminderText} onChange={(e) => setReminderText(e.target.value)} rows={8} maxLength={3000} placeholder="اختر مشروعًا ومستلمًا لعرض الرسالة" />
            </div>
            <Button className="bg-emerald-700 hover:bg-emerald-800" disabled={!projectId || !recipientId || !selectedRecipient?.hasWhatsApp || !reminderText.trim() || sendReminderMutation.isPending} onClick={() => sendReminderMutation.mutate()}>
              {sendReminderMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Send className="w-4 h-4 ml-2" />}
              إرسال التذكير عبر واتساب
            </Button>
            {selectedRecipient && !selectedRecipient.hasWhatsApp && <p className="text-xs text-amber-700">لا يوجد رقم واتساب للمستلم المحدد.</p>}
            {!projectsQuery.isLoading && !projects.length && <p className="text-sm text-slate-500">لا توجد اشتراكات محددة المدة مرتبطة بمشاريع.</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-black">سجل الرسائل</h2>
              <p className="text-xs text-slate-500 mt-1">حالة كل عملية إرسال ووقتها؛ أرقام الهواتف لا تظهر في السجل.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["employee-operations", "messages"] })}>تحديث السجل</Button>
          </div>
          <div className="space-y-2">
            {(messagesQuery.data?.messages || []).slice(0, 12).map((message) => (
              <div key={message.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b last:border-0 py-2">
                <div>
                  <div className="font-semibold text-sm">{kindLabel(message.kind)} · {message.recipientName}</div>
                  <div className="text-xs text-slate-500">{dateLabel(message.createdAt)}</div>
                  {message.error && <div className="text-xs text-red-700 mt-1">{message.error}</div>}
                  {message.internalNote && <div className="text-xs text-slate-500 mt-1">ملاحظة داخلية: {message.internalNote}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusTone(message.status)}>{statusLabel(message.status)}</Badge>
                  {message.status === "failed" && !message.error?.includes("رقم واتساب") && (
                    <Button size="sm" variant="outline" disabled={sendDraftMutation.isPending} onClick={() => sendDraftMutation.mutate({ id: message.id, message: message.message })}>إعادة المحاولة</Button>
                  )}
                </div>
              </div>
            ))}
            {!messagesQuery.isLoading && !(messagesQuery.data?.messages || []).length && <p className="text-sm text-slate-500">لا توجد رسائل مرسلة بعد.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
