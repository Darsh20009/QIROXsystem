// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MapPin, Clock, CheckCircle, XCircle, Users, Activity, AlertCircle, Navigation, BarChart3, Search, Calendar, LogIn, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const roleLabels: Record<string, string> = {
  admin: "مدير", manager: "مدير عام", developer: "مطور", designer: "مصمم",
  support: "دعم", accountant: "محاسب", sales: "مبيعات", sales_manager: "مدير مبيعات", merchant: "توصيل",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-50 text-red-700", manager: "bg-purple-50 text-purple-700",
  developer: "bg-blue-50 text-blue-700", designer: "bg-pink-50 text-pink-700",
  support: "bg-teal-50 text-teal-700", accountant: "bg-green-50 text-green-700",
  sales: "bg-orange-50 text-orange-700", sales_manager: "bg-amber-50 text-amber-700",
};

function timeSince(date: string | Date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}ث`;
  if (diff < 3600) return `${Math.floor(diff / 60)}د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}س`;
  return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

function formatTime(date: string | Date) {
  if (!date) return "--:--";
  return new Date(date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function AvatarInitial({ name, role }: { name: string; role: string }) {
  const colors: Record<string, string> = {
    admin: "bg-red-600", manager: "bg-purple-600", developer: "bg-blue-600",
    designer: "bg-pink-600", support: "bg-teal-600", accountant: "bg-green-600",
    sales: "bg-orange-600", sales_manager: "bg-amber-600", merchant: "bg-cyan-600",
  };
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${colors[role] || "bg-gray-500"}`}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

export default function AdminAttendance() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"today" | "history">("today");

  const { data: attendanceData, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/attendance"],
    queryFn: async () => {
      const r = await fetch("/api/admin/attendance");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 30000,
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await apiRequest("PATCH", `/api/attendance/${id}`, data);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/attendance"] });
      toast({ title: L ? "تم تحديث سجل الحضور" : "Attendance record updated" });
      setSelectedRecord(null);
    },
  });

  const data = attendanceData || [];
  const filtered = data.filter((d: any) =>
    !search || d.user?.fullName?.toLowerCase().includes(search.toLowerCase()) || d.user?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const presentToday = filtered.filter((d: any) => d.todayAttendance && !d.todayAttendance.checkOut);
  const checkedOutToday = filtered.filter((d: any) => d.todayAttendance?.checkOut);
  const absentToday = filtered.filter((d: any) => !d.todayAttendance);

  const statsCards = [
    { label: "حاضر الآن", count: presentToday.length, color: "bg-green-50 text-green-700 border-green-100", dot: "bg-green-500" },
    { label: "انصرف اليوم", count: checkedOutToday.length, color: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-400" },
    { label: "غائب اليوم", count: absentToday.length, color: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-400" },
    { label: "إجمالي الفريق", count: filtered.length, color: "bg-black/[0.03] text-black/60 border-black/[0.06]", dot: "bg-black/30" },
  ];

  function getLastLocation(record: any) {
    const hist = record?.locationHistory;
    if (hist && hist.length > 0) return hist[hist.length - 1];
    return record?.location || null;
  }

  function getActivityStatus(record: any) {
    if (!record) return "absent";
    if (record.checkOut) return "checked-out";
    const lastAct = record.lastActivityAt ? new Date(record.lastActivityAt) : new Date(record.checkIn);
    const minsSince = (Date.now() - lastAct.getTime()) / 60000;
    if (minsSince < 15) return "active";
    if (minsSince < 45) return "idle";
    return "inactive";
  }

  const activityLabels: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: "نشط", color: "text-green-600 bg-green-50 border-green-100", icon: Activity },
    idle: { label: "خامل", color: "text-yellow-600 bg-yellow-50 border-yellow-100", icon: Clock },
    inactive: { label: "غير نشط", color: "text-red-500 bg-red-50 border-red-100", icon: AlertCircle },
    "checked-out": { label: "انصرف", color: "text-blue-600 bg-blue-50 border-blue-100", icon: LogOut },
    absent: { label: "غائب", color: "text-black/40 bg-black/[0.03] border-black/[0.06]", icon: XCircle },
  };

  return (
    <div className="relative overflow-hidden space-y-5" dir={dir}>
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-black flex items-center gap-2.5">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-white" />
            </div>
            {L ? "إدارة الحضور والانصراف" : "Attendance Management"}
          </h1>
          <p className="text-xs text-black/35 mt-0.5">
            {new Date().toLocaleDateString(L ? "ar-SA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === "today" ? "default" : "outline"}
            onClick={() => setViewMode("today")}
            className={`text-xs h-8 gap-1.5 ${viewMode === "today" ? "bg-black text-white" : "border-black/10"}`}
          >
            <Calendar className="w-3.5 h-3.5" />{L ? "اليوم" : "Today"}
          </Button>
          <Button
            size="sm"
            variant={viewMode === "history" ? "default" : "outline"}
            onClick={() => setViewMode("history")}
            className={`text-xs h-8 gap-1.5 ${viewMode === "history" ? "bg-black text-white" : "border-black/10"}`}
          >
            <BarChart3 className="w-3.5 h-3.5" />{L ? "السجل" : "History"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs h-8 border-black/10">
            <Activity className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsCards.map((s, i) => (
          <div key={i} className={`border rounded-2xl p-4 ${s.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <p className="text-[11px] font-medium">{s.label}</p>
            </div>
            <p className="text-2xl font-black">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/25" />
        <Input placeholder={L ? "بحث بالاسم..." : "Search by name..."} value={search} onChange={e => setSearch(e.target.value)}
          className="h-9 text-xs pr-9 bg-white border-black/[0.08]" />
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-black/20" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Present Now */}
          {presentToday.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs font-bold text-black/50 uppercase tracking-wider">{L ? "حاضرون الآن" : "Present Now"} ({presentToday.length})</p>
              </div>
              <div className="grid gap-3">
                {presentToday.map((d: any) => {
                  const att = d.todayAttendance;
                  const status = getActivityStatus(att);
                  const loc = getLastLocation(att);
                  const { label, color, icon: Icon } = activityLabels[status] || activityLabels.absent;
                  const workMins = Math.floor((Date.now() - new Date(att.checkIn).getTime()) / 60000);
                  return (
                    <div key={d.user.id || d.user._id}
                      className="bg-white border border-black/[0.06] rounded-2xl p-4 hover:border-black/15 transition-colors cursor-pointer"
                      onClick={() => setSelectedRecord({ ...d, att })}>
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <AvatarInitial name={d.user.fullName} role={d.user.role} />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-black">{d.user.fullName}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${roleColors[d.user.role] || ""}`}>
                              {roleLabels[d.user.role] || d.user.role}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${color}`}>
                              <Icon className="w-2.5 h-2.5 inline ml-0.5" />{label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <span className="text-[11px] text-black/40 flex items-center gap-1">
                              <LogIn className="w-3 h-3" />{L ? "حضر" : "In"} {formatTime(att.checkIn, L)}
                            </span>
                            <span className="text-[11px] text-black/40 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{Math.floor(workMins / 60)}{L ? "س" : "h"} {workMins % 60}{L ? "د" : "m"}
                            </span>
                            {loc && (
                              <a
                                href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-1"
                              >
                                <MapPin className="w-3 h-3" />{L ? "عرض الموقع" : "View Location"}
                              </a>
                            )}
                          </div>
                          {att.checkInNotes && (
                            <p className="text-[11px] text-black/40 mt-1 italic">"{att.checkInNotes}"</p>
                          )}
                        </div>
                        <div className="text-left">
                          {att.locationHistory?.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-500 mb-1">
                              <Navigation className="w-2.5 h-2.5" />
                              {att.locationHistory.length} {L ? "نقطة" : "points"}
                            </div>
                          )}
                          <p className="text-[10px] text-black/25">
                            {L ? "آخر نشاط" : "Last activity"}: {timeSince(att.lastActivityAt || att.checkIn, L)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Checked Out */}
          {checkedOutToday.length > 0 && viewMode === "today" && (
            <div>
              <div className="flex items-center gap-2 mb-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-xs font-bold text-black/50 uppercase tracking-wider">{L ? "انصرفوا اليوم" : "Checked Out Today"} ({checkedOutToday.length})</p>
              </div>
              <div className="grid gap-2">
                {checkedOutToday.map((d: any) => {
                  const att = d.todayAttendance;
                  return (
                    <div key={d.user.id || d.user._id}
                      className="bg-white border border-black/[0.04] rounded-2xl p-3.5 hover:border-black/10 transition-colors cursor-pointer"
                      onClick={() => setSelectedRecord({ ...d, att })}>
                      <div className="flex items-center gap-3">
                        <AvatarInitial name={d.user.fullName} role={d.user.role} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-black/70">{d.user.fullName}</p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-black/30 flex items-center gap-0.5">
                              <LogIn className="w-2.5 h-2.5" />{formatTime(att.checkIn, L)}
                            </span>
                            <span className="text-[10px] text-black/30 flex items-center gap-0.5">
                              <LogOut className="w-2.5 h-2.5" />{formatTime(att.checkOut, L)}
                            </span>
                            <span className="text-[10px] font-semibold text-blue-600">
                              {att.workHours?.toFixed(1)} {L ? "ساعة" : "hrs"}
                            </span>
                          </div>
                        </div>
                        {att.achievements && (
                          <p className="text-[10px] text-black/35 max-w-[200px] truncate italic">{att.achievements}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Absent */}
          {absentToday.length > 0 && viewMode === "today" && (
            <div>
              <div className="flex items-center gap-2 mb-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <p className="text-xs font-bold text-black/50 uppercase tracking-wider">{L ? "غائبون" : "Absent"} ({absentToday.length})</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {absentToday.map((d: any) => (
                  <div key={d.user.id || d.user._id} className="bg-white border border-black/[0.04] rounded-xl p-3 flex items-center gap-2.5">
                    <AvatarInitial name={d.user.fullName} role={d.user.role} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-black/50 truncate">{d.user.fullName}</p>
                      <p className="text-[10px] text-black/25">{roleLabels[d.user.role] || d.user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Mode */}
          {viewMode === "history" && (
            <div>
              <p className="text-xs font-bold text-black/50 uppercase tracking-wider mb-3">{L ? "السجل الأسبوعي" : "Weekly History"}</p>
              <div className="space-y-3">
                {filtered.map((d: any) => (
                  <div key={d.user.id || d.user._id} className="bg-white border border-black/[0.06] rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <AvatarInitial name={d.user.fullName} role={d.user.role} />
                      <div>
                        <p className="font-bold text-sm text-black">{d.user.fullName}</p>
                        <p className="text-[10px] text-black/40">{roleLabels[d.user.role] || d.user.role}</p>
                      </div>
                      <div className="mr-auto text-left">
                        <p className="text-xs font-bold text-black/60">
                          {(d.recentRecords || []).reduce((a: number, r: any) => a + (r.workHours || 0), 0).toFixed(1)} {L ? "ساعة" : "hrs"}
                        </p>
                        <p className="text-[10px] text-black/30">{(d.recentRecords || []).filter((r: any) => r.checkOut).length} {L ? "يوم هذا الأسبوع" : "days this week"}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {(d.recentRecords || []).slice(0, 7).map((rec: any, i: number) => (
                        <div key={i}
                          onClick={() => setSelectedRecord({ ...d, att: rec })}
                          className={`flex-1 min-w-[60px] text-center p-2 rounded-xl cursor-pointer transition-colors ${rec.checkOut ? "bg-green-50 hover:bg-green-100" : rec.checkIn ? "bg-yellow-50 hover:bg-yellow-100" : "bg-black/[0.02] hover:bg-black/[0.04]"}`}>
                          <p className="text-[9px] text-black/40">{new Date(rec.checkIn || rec.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US", { weekday: "short" })}</p>
                          <p className="text-xs font-bold text-black/70">{rec.workHours ? `${rec.workHours.toFixed(1)}${L ? "س" : "h"}` : "--"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && !isLoading && (
            <div className="py-20 text-center">
              <Users className="w-10 h-10 text-black/10 mx-auto mb-3" />
              <p className="text-sm text-black/30">{L ? "لا توجد بيانات" : "No data found"}</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={open => !open && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-lg" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">{L ? "تفاصيل الحضور" : "Attendance Details"} — {selectedRecord?.user?.fullName}</DialogTitle>
          </DialogHeader>
          {selectedRecord?.att && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/[0.02] rounded-xl p-3">
                  <p className="text-[10px] text-black/40 mb-1">{L ? "وقت الحضور" : "Check-in Time"}</p>
                  <p className="font-bold text-sm">{formatTime(selectedRecord.att.checkIn, L)}</p>
                </div>
                <div className="bg-black/[0.02] rounded-xl p-3">
                  <p className="text-[10px] text-black/40 mb-1">{L ? "وقت الانصراف" : "Check-out Time"}</p>
                  <p className="font-bold text-sm">{selectedRecord.att.checkOut ? formatTime(selectedRecord.att.checkOut, L) : (L ? "لم يُسجّل" : "Not recorded")}</p>
                </div>
                {selectedRecord.att.workHours && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-[10px] text-green-600 mb-1">{L ? "ساعات العمل" : "Work Hours"}</p>
                    <p className="font-bold text-sm text-green-700">{selectedRecord.att.workHours.toFixed(2)} {L ? "ساعة" : "hours"}</p>
                  </div>
                )}
                {selectedRecord.att.ipAddress && (
                  <div className="bg-black/[0.02] rounded-xl p-3">
                    <p className="text-[10px] text-black/40 mb-1">{L ? "عنوان IP" : "IP Address"}</p>
                    <p className="font-mono text-xs text-black/60">{selectedRecord.att.ipAddress}</p>
                  </div>
                )}
              </div>

              {selectedRecord.att.checkInNotes && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-[10px] text-blue-600 font-bold mb-1">{L ? "ملاحظات الحضور" : "Check-in Notes"}</p>
                  <p className="text-sm text-blue-800">{selectedRecord.att.checkInNotes}</p>
                </div>
              )}
              {selectedRecord.att.achievements && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-[10px] text-green-600 font-bold mb-1">{L ? "الإنجازات" : "Achievements"}</p>
                  <p className="text-sm text-green-800">{selectedRecord.att.achievements}</p>
                </div>
              )}

              {/* Location History */}
              {selectedRecord.att.locationHistory?.length > 0 && (
                <div>
                  <p className="text-[10px] text-black/40 font-bold uppercase tracking-wider mb-2">
                    {L ? "مسار التحركات" : "Movement Trail"} ({selectedRecord.att.locationHistory.length} {L ? "نقطة" : "points"})
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedRecord.att.locationHistory.map((loc: any, i: number) => (
                      <a
                        key={i}
                        href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[11px] text-blue-500 hover:text-blue-700 py-0.5"
                      >
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="font-mono">{loc.lat?.toFixed(5)}, {loc.lng?.toFixed(5)}</span>
                        <span className="text-black/30">{new Date(loc.timestamp).toLocaleTimeString(L ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct location link */}
              {(() => {
                const loc = getLastLocation(selectedRecord.att);
                if (loc) return (
                  <a
                    href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    {L ? "فتح آخر موقع في خرائط جوجل" : "Open Last Location in Google Maps"}
                  </a>
                );
              })()}

              {!selectedRecord.att.checkOut && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full text-xs"
                  onClick={() => editMutation.mutate({ id: selectedRecord.att._id || selectedRecord.att.id, data: { checkOut: new Date(), workHours: ((Date.now() - new Date(selectedRecord.att.checkIn).getTime()) / 3600000) } })}
                  disabled={editMutation.isPending}
                >
                  {editMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5 ml-1" />}
                  {L ? "تسجيل انصراف يدوي" : "Manual Check-out"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
