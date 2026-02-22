import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Edit2, Trash2, Handshake, ExternalLink } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Partner } from "@shared/schema";
import { useState } from "react";

interface FormData {
  name: string;
  nameAr: string;
  logoUrl: string;
  websiteUrl: string;
  category: string;
  sortOrder: string;
}

const emptyForm: FormData = {
  name: "",
  nameAr: "",
  logoUrl: "",
  websiteUrl: "",
  category: "",
  sortOrder: "0",
};

export default function AdminPartners() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  const toPayload = (data: FormData) => ({
    name: data.name,
    nameAr: data.nameAr || undefined,
    logoUrl: data.logoUrl,
    websiteUrl: data.websiteUrl || undefined,
    category: data.category || undefined,
    sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
    isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/admin/partners", toPayload(data));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "تم إضافة الشريك بنجاح" });
      setOpen(false);
      setFormData(emptyForm);
    },
    onError: () => {
      toast({ title: "خطأ في إضافة الشريك", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PATCH", `/api/admin/partners/${editingId}`, toPayload(data));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "تم تحديث الشريك بنجاح" });
      setOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    },
    onError: () => {
      toast({ title: "خطأ في تحديث الشريك", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "تم حذف الشريك بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في حذف الشريك", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.logoUrl) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingId(partner.id);
    setFormData({
      name: partner.name,
      nameAr: partner.nameAr || "",
      logoUrl: partner.logoUrl,
      websiteUrl: partner.websiteUrl || "",
      category: partner.category || "",
      sortOrder: partner.sortOrder?.toString() || "0",
    });
    setOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-black/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black flex items-center gap-3">
          <Handshake className="w-7 h-7 text-black/40" />
          إدارة الشركاء
        </h1>
        <Button
          onClick={handleAddNew}
          className="gap-2 premium-btn"
          data-testid="button-add-partner"
        >
          <Plus className="w-4 h-4" />
          إضافة شريك
        </Button>
      </div>

      <div className="border border-black/[0.06] bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الشريك</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">اللوجو</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الموقع</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الترتيب</th>
                <th className="text-left p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {partners?.map((partner) => (
                <tr key={partner.id} className="border-b border-black/[0.03] hover:bg-black/[0.02] transition-colors" data-testid={`row-partner-${partner.id}`}>
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-black text-sm">{partner.name}</p>
                      {partner.nameAr && <p className="text-xs text-black/40 mt-0.5">{partner.nameAr}</p>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="w-12 h-12 rounded-lg bg-black/[0.03] flex items-center justify-center overflow-hidden">
                      <img src={partner.logoUrl} alt={partner.name} className="max-w-full max-h-full object-contain" />
                    </div>
                  </td>
                  <td className="p-4">
                    {partner.websiteUrl ? (
                      <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-black/60 text-sm flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        رابط
                      </a>
                    ) : (
                      <span className="text-black/20 text-sm">—</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-black/60">{partner.sortOrder}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-black/60"
                        onClick={() => handleEdit(partner)}
                        data-testid={`button-edit-partner-${partner.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => deleteMutation.mutate(partner.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-partner-${partner.id}`}
                      >
                        {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!partners || partners.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-black/30">
                    لا يوجد شركاء بعد. الشركاء الثابتون يظهرون في صفحة الشركاء تلقائياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              {editingId ? "تعديل شريك" : "إضافة شريك جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">اسم الشريك (إنجليزي) *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Partner Name"
                data-testid="input-partner-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">اسم الشريك (عربي)</label>
              <Input
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="اسم الشريك"
                data-testid="input-partner-nameAr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">رابط اللوجو *</label>
              <Input
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                data-testid="input-partner-logo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">رابط الموقع</label>
              <Input
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://example.com"
                data-testid="input-partner-website"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">الفئة</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="مطاعم، تعليم..."
                  data-testid="input-partner-category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">الترتيب</label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  placeholder="0"
                  data-testid="input-partner-sort"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 premium-btn"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-partner"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingId ? "تحديث" : "إضافة"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-partner"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
