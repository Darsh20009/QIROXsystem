import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Users, CheckCircle2, AlertCircle, RefreshCw, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslate } from "@/lib/useTranslate";

interface Customer {
  id: string;
  name?: string;
  email?: string;
}

export default function EmailComposerWidget() {
  const tc = useTranslate();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);

  // Use the manager-scoped endpoint — already filters to the authenticated employee's tenant
  // and returns only customers who have an email address.
  const { data: withEmail = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers-list"],
    staleTime: 1000 * 60 * 5,
  });

  const allSelected = withEmail.length > 0 && withEmail.every(c => selectedIds.has(c.id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(withEmail.map(c => c.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const { mutateAsync: sendEmail, isPending } = useMutation({
    mutationFn: async ({ customerId, subject, message }: { customerId: string; subject: string; message: string }) => {
      return apiRequest("POST", "/api/admin/send-email", { customerId, subject, message });
    },
  });

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      toast({ title: tc("الموضوع والرسالة مطلوبان", "Subject and message are required"), variant: "destructive" });
      return;
    }
    if (selectedIds.size === 0) {
      toast({ title: tc("اختر عميلاً واحدًا على الأقل", "Select at least one customer"), variant: "destructive" });
      return;
    }
    let ok = 0;
    let fail = 0;
    for (const id of selectedIds) {
      try {
        await sendEmail({ customerId: id, subject: subject.trim(), message: message.trim() });
        ok++;
      } catch {
        fail++;
      }
    }
    setSentCount(ok);
    if (ok > 0) {
      setSubject("");
      setMessage("");
      setSelectedIds(new Set());
      toast({ title: tc(`تم الإرسال إلى ${ok} عميل`, `Sent to ${ok} customers`) });
    }
    if (fail > 0) {
      toast({
        title: tc(`فشل الإرسال إلى ${fail} عميل`, `Failed to send to ${fail} customers`),
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="border border-border h-full flex flex-col">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          {tc("إرسال بريد للعملاء", "Email Customers")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {tc("أرسل رسائل ترويجية أو إشعارات مباشرة", "Send promotions or direct notifications")}
        </p>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1 flex flex-col gap-3">
        {sentCount !== null && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              {tc(`تم الإرسال إلى ${sentCount} عميل بنجاح`, `Successfully sent to ${sentCount} customers`)}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Input
            placeholder={tc("موضوع الرسالة", "Subject")}
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="text-sm"
            data-testid="input-email-subject"
          />
          <textarea
            placeholder={tc("نص الرسالة...", "Message body...")}
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            className="w-full rounded-xl border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 text-right placeholder:text-muted-foreground"
            dir="auto"
            data-testid="input-email-message"
          />
        </div>

        {/* Customer selector */}
        <div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted border border-border rounded-xl px-3 py-2.5 text-sm transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {selectedIds.size > 0
                  ? tc(`${selectedIds.size} عميل محدد`, `${selectedIds.size} selected`)
                  : tc("اختر العملاء", "Select customers")}
              </span>
              {isLoading && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{withEmail.length} {tc("لديهم بريد", "with email")}</Badge>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {expanded && (
            <div className="mt-1 border border-border rounded-xl bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded"
                  id="select-all-customers"
                />
                <label htmlFor="select-all-customers" className="text-xs font-medium cursor-pointer">
                  {tc("تحديد الكل", "Select all")}
                </label>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-border">
                {withEmail.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    <AlertCircle className="w-5 h-5 mx-auto mb-1 opacity-40" />
                    {tc("لا يوجد عملاء لديهم بريد إلكتروني", "No customers with email")}
                  </div>
                ) : (
                  withEmail.map(c => (
                    <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleOne(c.id)}
                        className="rounded shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{c.name || tc("عميل", "Customer")}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          className="w-full gap-2 font-bold mt-auto"
          disabled={isPending || selectedIds.size === 0 || !subject.trim() || !message.trim()}
          onClick={handleSend}
          data-testid="button-send-email"
        >
          {isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isPending
            ? tc("جاري الإرسال...", "Sending...")
            : tc(`إرسال${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`, `Send${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`)}
        </Button>
      </CardContent>
    </Card>
  );
}
