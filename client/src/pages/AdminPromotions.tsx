import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp, ArrowDown, Users, Search, Loader2, Crown,
  UserCheck, Shield, ChevronRight, Clock, History, X, CheckCheck
} from "lucide-react";

type User = {
  id: string; _id?: string; fullName: string; username: string; email: string;
  role: string; additionalRoles: string[]; jobTitle?: string; profilePhotoUrl?: string;
  createdAt: string;
};

type PromotionLog = {
  id: string;
  targetUserId: { fullName: string; username: string; role: string };
  promotedById: { fullName: string; username: string };
  fromRole: string; toRole: string; reason: string; type: string;
  createdAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "أدمن", manager: "مدير", developer: "مطور", designer: "مصمم",
  accountant: "محاسب", sales: "مبيعات", sales_manager: "مدير مبيعات",
  support: "دعم فني", merchant: "تاجر", client: "عميل",
  customer: "زبون", investor: "مستثمر",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  investor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  developer: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  designer: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  accountant: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  sales: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  sales_manager: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  support: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  client: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  customer: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  merchant: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

const ROLE_LEVEL: Record<string, number> = {
  client: 1, customer: 1, support: 2, merchant: 2, designer: 2, developer: 2,
  sales: 2, accountant: 2, investor: 2, sales_manager: 3, manager: 4, admin: 5,
};

const ALL_ROLES = Object.keys(ROLE_LABELS);

type Tab = "users" | "log";

export default function AdminPromotions() {
  const { data: currentUser } = useUser();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("users");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selected, setSelected] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const [reason, setReason] = useState("");
  const [additionalRoles, setAdditionalRoles] = useState<string[]>([]);

  const myRole = (currentUser as any)?.role || "";
  const myLevel = ROLE_LEVEL[myRole] || 0;

  const { data: response, isLoading } = useQuery<{ users: User[]; total: number; pages: number }>({
    queryKey: ["/api/admin/all-users", search, filterRole],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterRole !== "all") params.set("role", filterRole);
      const r = await fetch(`/api/admin/all-users?${params}`);
      return r.json();
    },
    enabled: tab === "users",
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<PromotionLog[]>({
    queryKey: ["/api/admin/promotion-log"],
    enabled: tab === "log",
  });

  const promoteMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/users/${selected?.id || selected?._id}/role`, { newRole, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotion-log"] });
      setSelected(null); setNewRole(""); setReason("");
      toast({ title: `✅ تم تغيير الدور إلى: ${ROLE_LABELS[newRole] || newRole}` });
    },
    onError: (e: any) => toast({ title: e?.message || "فشل تغيير الدور", variant: "destructive" }),
  });

  const additionalRolesMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/users/${selected?.id || selected?._id}/additional-roles`, { additionalRoles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-users"] });
      toast({ title: "✅ تم تحديث الأدوار الإضافية" });
    },
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  const openUser = (u: User) => {
    setSelected(u); setNewRole(u.role); setReason(""); setAdditionalRoles(u.additionalRoles || []);
  };

  const canChangeRole = (target: User) => {
    if (myRole === "admin") return true;
    if (myRole === "manager") return ROLE_LEVEL[target.role] < myLevel;
    return false;
  };

  const availableRoles = ALL_ROLES.filter(r => {
    if (myRole === "admin") return r !== "admin";
    if (myRole === "manager") return ROLE_LEVEL[r] < myLevel;
    return false;
  });

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-bl from-purple-600/10 via-pink-500/5 to-transparent border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-7 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 right-12 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black dark:text-white">نظام الترقية والأدوار</h1>
              <p className="text-black/40 dark:text-white/40 text-sm">إدارة أدوار المستخدمين والترقيات بصلاحيات هرمية</p>
            </div>
          </div>

          {/* Hierarchy display */}
          <div className="relative mt-5 flex items-center gap-2 flex-wrap">
            {[
              { role: "client", icon: "👤", level: 1 },
              { role: "developer", icon: "💻", level: 2 },
              { role: "sales_manager", icon: "📊", level: 3 },
              { role: "manager", icon: "🎯", level: 4 },
              { role: "admin", icon: "👑", level: 5 },
            ].map((item, i, arr) => (
              <div key={item.role} className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${myRole === item.role ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`}>
                  {item.icon} {ROLE_LABELS[item.role]}
                </div>
                {i < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-black/20 dark:text-white/20 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-black/[0.06] dark:border-white/[0.06]">
          {([
            { id: "users" as Tab, label: "المستخدمون", icon: Users },
            { id: "log" as Tab, label: "سجل الترقيات", icon: History },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t.id ? "border-purple-500 text-purple-600 dark:text-purple-400" : "border-transparent text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70"}`}
              data-testid={`tab-${t.id}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
                <Input className="pr-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." data-testid="input-search" />
              </div>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                className="h-10 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-sm text-black dark:text-white"
                data-testid="select-filter-role">
                <option value="all">جميع الأدوار</option>
                {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>
            ) : (
              <div className="space-y-2">
                {(response?.users || []).map(u => (
                  <motion.div key={u.id || u._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] hover:border-black/15 dark:hover:border-white/15 bg-white dark:bg-gray-900 transition-all"
                    data-testid={`user-row-${u.id || u._id}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                      {u.profilePhotoUrl ? <img src={u.profilePhotoUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-lg">{u.fullName?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-black dark:text-white text-sm">{u.fullName}</span>
                        <Badge className={`text-[10px] px-2 py-0 border-0 ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                        {(u.additionalRoles || []).map(r => (
                          <Badge key={r} className="text-[10px] px-2 py-0 border-0 bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50">
                            +{ROLE_LABELS[r] || r}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-black/30 dark:text-white/30 mt-0.5">{u.email}</p>
                      {u.jobTitle && <p className="text-xs text-cyan-600 dark:text-cyan-400">{u.jobTitle}</p>}
                    </div>
                    {canChangeRole(u) && (
                      <Button variant="outline" size="sm" onClick={() => openUser(u)} className="gap-2 shrink-0" data-testid={`btn-change-role-${u.id || u._id}`}>
                        <Shield className="w-3.5 h-3.5" /> تغيير الدور
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Log Tab */}
        {tab === "log" && (
          <div className="space-y-2">
            {logsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 text-sm text-black/30 dark:text-white/30"><History className="w-10 h-10 mx-auto mb-3 text-black/10 dark:text-white/10" />لا يوجد سجل بعد</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex items-center gap-4 p-4 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900" data-testid={`log-${log.id}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${log.type === "promote" || log.type === "role_add" ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                    {log.type === "promote" || log.type === "role_add" ? <ArrowUp className="w-4 h-4 text-green-600" /> : <ArrowDown className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-black dark:text-white">{log.targetUserId?.fullName}</span>
                      <Badge className={`text-[10px] px-2 py-0 border-0 ${ROLE_COLORS[log.fromRole] || "bg-gray-100 text-gray-600"}`}>{ROLE_LABELS[log.fromRole] || log.fromRole}</Badge>
                      <ChevronRight className="w-3 h-3 text-black/30 dark:text-white/30" />
                      <Badge className={`text-[10px] px-2 py-0 border-0 ${ROLE_COLORS[log.toRole] || "bg-gray-100 text-gray-600"}`}>{ROLE_LABELS[log.toRole] || log.toRole}</Badge>
                    </div>
                    <p className="text-xs text-black/30 dark:text-white/30 mt-0.5">بواسطة: {log.promotedById?.fullName} · {new Date(log.createdAt).toLocaleDateString("ar-SA")}</p>
                    {log.reason && <p className="text-xs text-black/40 dark:text-white/40 mt-0.5 italic">"{log.reason}"</p>}
                  </div>
                  <Clock className="w-4 h-4 text-black/20 dark:text-white/20 shrink-0" />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Promote Dialog */}
      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right font-black flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              تغيير دور: {selected?.fullName}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                <Badge className={`text-xs px-2 py-1 border-0 ${ROLE_COLORS[selected.role]}`}>{ROLE_LABELS[selected.role]}</Badge>
                <ChevronRight className="w-4 h-4 text-black/30 dark:text-white/30" />
                {newRole && newRole !== selected.role && <Badge className={`text-xs px-2 py-1 border-0 ${ROLE_COLORS[newRole]}`}>{ROLE_LABELS[newRole]}</Badge>}
              </div>

              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1.5 block font-semibold">الدور الجديد</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableRoles.map(r => (
                    <button key={r} onClick={() => setNewRole(r)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${newRole === r ? "bg-purple-500 text-white border-purple-500" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/20 dark:hover:border-white/20"}`}
                      data-testid={`role-option-${r}`}>
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">سبب التغيير (اختياري)</label>
                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="اكتب السبب..." data-testid="input-reason" />
              </div>

              {/* Additional Roles */}
              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1.5 block font-semibold">الأدوار الإضافية (متعددة)</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableRoles.map(r => (
                    <button key={r} onClick={() => setAdditionalRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${additionalRoles.includes(r) ? "bg-cyan-500 text-white border-cyan-500" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`}
                      data-testid={`add-role-${r}`}>
                      {additionalRoles.includes(r) && <CheckCheck className="w-3 h-3" />}
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
                <Button onClick={() => additionalRolesMutation.mutate()} disabled={additionalRolesMutation.isPending} variant="outline" size="sm" className="mt-2 w-full gap-2" data-testid="btn-save-additional">
                  {additionalRolesMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  حفظ الأدوار الإضافية
                </Button>
              </div>

              <Button
                onClick={() => promoteMutation.mutate()}
                disabled={!newRole || newRole === selected.role || promoteMutation.isPending}
                className="w-full gap-2 bg-gradient-to-l from-purple-600 to-pink-500 text-white"
                data-testid="btn-confirm-promote"
              >
                {promoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                {ROLE_LEVEL[newRole] > ROLE_LEVEL[selected.role] ? "ترقية" : "تخفيض"} إلى {ROLE_LABELS[newRole]}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
