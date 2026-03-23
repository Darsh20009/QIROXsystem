import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Plus, Pencil, Trash2, Search, Download, ToggleLeft, ToggleRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Country {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  flag: string;
  phoneCode: string;
  currency: string;
  currencyAr: string;
  continent: string;
  isActive: boolean;
  sortOrder: number;
}

const CONTINENTS = ["آسيا", "أفريقيا", "أوروبا", "أمريكا", "أوقيانوسيا"];

const EMPTY: Omit<Country, "id"> = {
  nameAr: "", nameEn: "", code: "", flag: "🌍",
  phoneCode: "", currency: "", currencyAr: "",
  continent: "آسيا", isActive: true, sortOrder: 0,
};

export default function AdminCountries() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [search, setSearch] = useState("");
  const [filterContinent, setFilterContinent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Country, "id">>(EMPTY);

  const { data: countries = [], isLoading } = useQuery<Country[]>({
    queryKey: ["/api/admin/countries"],
  });

  const saveM = useMutation({
    mutationFn: async (body: Omit<Country, "id">) => {
      if (editingId) {
        const r = await apiRequest("PATCH", `/api/admin/countries/${editingId}`, body);
        return r.json();
      }
      const r = await apiRequest("POST", "/api/admin/countries", body);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      toast({ title: editingId ? (L ? "تم التعديل" : "Updated") : (L ? "تمت الإضافة" : "Added") });
      setDialogOpen(false);
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/countries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      toast({ title: L ? "تم الحذف" : "Deleted" });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const toggleM = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const r = await apiRequest("PATCH", `/api/admin/countries/${id}`, { isActive });
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] }),
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const seedM = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/countries/seed-defaults", {});
      return r.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      toast({ title: data.message });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (c: Country) => {
    setEditingId(c.id);
    setForm({ nameAr: c.nameAr, nameEn: c.nameEn, code: c.code, flag: c.flag, phoneCode: c.phoneCode, currency: c.currency, currencyAr: c.currencyAr, continent: c.continent, isActive: c.isActive, sortOrder: c.sortOrder });
    setDialogOpen(true);
  };

  const filtered = countries.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.nameAr.includes(search) || c.nameEn.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    const matchContinent = filterContinent === "all" || c.continent === filterContinent;
    const matchStatus = filterStatus === "all" || (filterStatus === "active" ? c.isActive : !c.isActive);
    return matchSearch && matchContinent && matchStatus;
  });

  const activeCount = countries.filter(c => c.isActive).length;
  const inactiveCount = countries.filter(c => !c.isActive).length;
  const continentGroups = CONTINENTS.filter(ct => countries.some(c => c.continent === ct));

  return (
    <div className="p-6 space-y-6" dir={dir}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <Globe className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{L ? "إدارة الدول" : "Countries Management"}</h1>
            <p className="text-sm text-muted-foreground">{countries.length} {L ? "دولة مسجّلة" : "countries registered"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {countries.length === 0 && (
            <Button variant="outline" onClick={() => seedM.mutate()} disabled={seedM.isPending} data-testid="btn-seed-countries">
              <Download className="w-4 h-4 ml-2" />
              {L ? "إضافة الدول الافتراضية" : "Add Default Countries"}
            </Button>
          )}
          <Button onClick={openAdd} data-testid="btn-add-country">
            <Plus className="w-4 h-4 ml-2" />
            {L ? "إضافة دولة" : "Add Country"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-bold">{countries.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{L ? "إجمالي الدول" : "Total Countries"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-bold text-green-500">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{L ? "دول نشطة" : "Active Countries"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-bold text-red-400">{inactiveCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{L ? "دول موقوفة" : "Inactive Countries"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-bold text-blue-500">{continentGroups.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{L ? "قارات مغطّاة" : "Continents Covered"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={L ? "ابحث باسم الدولة أو الكود..." : "Search by country name or code..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
            data-testid="input-search-country"
          />
        </div>
        <Select value={filterContinent} onValueChange={setFilterContinent}>
          <SelectTrigger className="w-40" data-testid="select-filter-continent">
            <SelectValue placeholder={L ? "القارة" : "Continent"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L ? "كل القارات" : "All Continents"}</SelectItem>
            {CONTINENTS.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36" data-testid="select-filter-status">
            <SelectValue placeholder={L ? "الحالة" : "Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="active">نشطة</SelectItem>
            <SelectItem value="inactive">موقوفة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 animate-pulse h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Globe className="w-12 h-12 opacity-30" />
          <p>{countries.length === 0 ? (L ? "لا توجد دول، أضف الدول الافتراضية للبدء" : "No countries, add default countries to get started") : (L ? "لا توجد نتائج مطابقة" : "No matching results")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c => (
            <div
              key={c.id}
              data-testid={`card-country-${c.id}`}
              className={`rounded-xl border bg-card p-4 space-y-3 transition-all hover:shadow-md ${!c.isActive ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{c.flag}</span>
                  <div>
                    <p className="font-bold text-sm leading-tight">{c.nameAr}</p>
                    <p className="text-xs text-muted-foreground">{c.nameEn}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono shrink-0">{c.code}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-muted-foreground">{L ? "رمز الهاتف" : "Phone Code"}</p>
                  <p className="font-semibold mt-0.5" dir="ltr">{c.phoneCode || "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-muted-foreground">{L ? "العملة" : "Currency"}</p>
                  <p className="font-semibold mt-0.5">{c.currencyAr || c.currency || "—"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="text-xs">{c.continent}</Badge>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={c.isActive}
                    onCheckedChange={v => toggleM.mutate({ id: c.id, isActive: v })}
                    data-testid={`toggle-country-${c.id}`}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)} data-testid={`btn-edit-country-${c.id}`}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-500" onClick={() => deleteM.mutate(c.id)} data-testid={`btn-delete-country-${c.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" dir={dir}>
          <DialogHeader>
            <DialogTitle>{editingId ? (L ? "تعديل الدولة" : "Edit Country") : (L ? "إضافة دولة جديدة" : "Add New Country")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>{L ? "الاسم بالعربية" : "Arabic Name"} <span className="text-red-500">*</span></Label>
              <Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} placeholder="مثال: المملكة العربية السعودية" data-testid="input-country-name-ar" />
            </div>
            <div className="space-y-1.5">
              <Label>{L ? "الاسم بالإنجليزية" : "English Name"}</Label>
              <Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} placeholder="Saudi Arabia" data-testid="input-country-name-en" />
            </div>
            <div className="space-y-1.5">
              <Label>{L ? "كود الدولة (ISO)" : "Country Code (ISO)"} <span className="text-red-500">*</span></Label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SA" maxLength={3} data-testid="input-country-code" />
            </div>
            <div className="space-y-1.5">
              <Label>{L ? "الإيموجي / العلم" : "Emoji / Flag"}</Label>
              <Input value={form.flag} onChange={e => setForm(f => ({ ...f, flag: e.target.value }))} placeholder="🇸🇦" data-testid="input-country-flag" />
            </div>
            <div className="space-y-1.5">
              <Label>{L ? "مفتاح الهاتف" : "Phone Code"}</Label>
              <Input value={form.phoneCode} onChange={e => setForm(f => ({ ...f, phoneCode: e.target.value }))} placeholder="+966" data-testid="input-country-phone-code" />
            </div>
            <div className="space-y-1.5">
              <Label>{L ? "رمز العملة" : "Currency Code"}</Label>
              <Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} placeholder="SAR" data-testid="input-country-currency" />
            </div>
            <div className="space-y-1.5">
              <Label>{L ? "اسم العملة بالعربية" : "Currency Name in Arabic"}</Label>
              <Input value={form.currencyAr} onChange={e => setForm(f => ({ ...f, currencyAr: e.target.value }))} placeholder="ريال سعودي" data-testid="input-country-currency-ar" />
            </div>
            <div className="space-y-1.5">
              <Label>{L ? "القارة" : "Continent"}</Label>
              <Select value={form.continent} onValueChange={v => setForm(f => ({ ...f, continent: v }))}>
                <SelectTrigger data-testid="select-country-continent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTINENTS.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{L ? "الترتيب" : "Sort Order"}</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} data-testid="input-country-sort-order" />
            </div>
            <div className="col-span-2 flex items-center gap-3 p-3 rounded-lg border">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} data-testid="toggle-country-active" />
              <div>
                <p className="text-sm font-medium">الحالة</p>
                <p className="text-xs text-muted-foreground">{form.isActive ? "نشطة — تظهر للمستخدمين" : "موقوفة — مخفية"}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => saveM.mutate(form)} disabled={saveM.isPending || !form.nameAr || !form.code} data-testid="btn-save-country">
              {saveM.isPending ? (L ? "جاري الحفظ..." : "Saving...") : editingId ? (L ? "حفظ التعديلات" : "Save Changes") : (L ? "إضافة الدولة" : "Add Country")}
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="btn-cancel-country">{L ? "إلغاء" : "Cancel"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
