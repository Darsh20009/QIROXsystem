import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Edit2, Trash2, Briefcase } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Service } from "@shared/schema";
import { useState } from "react";

const categories = [
  { value: "restaurants", label: "مطاعم وكافيهات" },
  { value: "stores", label: "متاجر وبراندات" },
  { value: "education", label: "تعليم" },
  { value: "institutions", label: "مؤسسات وشركات" },
  { value: "health", label: "صحة ولياقة" },
  { value: "personal", label: "شخصي" },
  { value: "food", label: "أغذية" },
  { value: "commerce", label: "تجارة إلكترونية" },
];

interface FormData {
  title: string;
  description: string;
  category: string;
  priceMin: string;
  priceMax: string;
  estimatedDuration: string;
  icon: string;
  features: string;
  portfolioImages: string;
  portfolioUrl: string;
}

const emptyForm: FormData = {
  title: "",
  description: "",
  category: "restaurants",
  priceMin: "",
  priceMax: "",
  estimatedDuration: "",
  icon: "",
  features: "",
  portfolioImages: "",
  portfolioUrl: "",
};

export default function AdminServices() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"]
  });

  const toPayload = (data: FormData) => ({
    title: data.title,
    description: data.description,
    category: data.category,
    priceMin: data.priceMin ? Number(data.priceMin) : undefined,
    priceMax: data.priceMax ? Number(data.priceMax) : undefined,
    estimatedDuration: data.estimatedDuration || undefined,
    icon: data.icon || undefined,
    features: data.features ? data.features.split(",").map((f: string) => f.trim()).filter(Boolean) : [],
    portfolioImages: data.portfolioImages ? data.portfolioImages.split(",").map((f: string) => f.trim()).filter(Boolean) : [],
    portfolioUrl: data.portfolioUrl || undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/admin/services", toPayload(data));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "تم إضافة الخدمة بنجاح" });
      setOpen(false);
      setFormData(emptyForm);
    },
    onError: () => {
      toast({ title: "خطأ في إضافة الخدمة", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PATCH", `/api/admin/services/${editingId}`, toPayload(data));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "تم تحديث الخدمة بنجاح" });
      setOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    },
    onError: () => {
      toast({ title: "خطأ في تحديث الخدمة", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "تم حذف الخدمة بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في حذف الخدمة", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(String(service.id));
    setFormData({
      title: service.title,
      description: service.description,
      category: service.category,
      priceMin: service.priceMin?.toString() || "",
      priceMax: service.priceMax?.toString() || "",
      estimatedDuration: service.estimatedDuration || "",
      icon: service.icon || "",
      features: Array.isArray(service.features) ? service.features.join(", ") : "",
      portfolioImages: Array.isArray((service as any).portfolioImages) ? (service as any).portfolioImages.join(", ") : "",
      portfolioUrl: (service as any).portfolioUrl || "",
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
          <Briefcase className="w-7 h-7 text-black/40" />
          إدارة الخدمات
        </h1>
        <Button
          onClick={handleAddNew}
          className="gap-2 premium-btn"
          data-testid="button-add-service"
        >
          <Plus className="w-4 h-4" />
          إضافة خدمة
        </Button>
      </div>

      <div className="border border-black/[0.06] bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الخدمة</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الفئة</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">السعر</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">المدة</th>
                <th className="text-left p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {services?.map((service) => (
                <tr key={service.id} className="border-b border-black/[0.03] hover:bg-black/[0.02] transition-colors" data-testid={`row-service-${service.id}`}>
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-black text-sm">{service.title}</p>
                      <p className="text-xs text-black/40 mt-0.5 line-clamp-1">{service.description}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-black/[0.06] text-black/60 border border-black/[0.08]">
                      {categories.find(c => c.value === service.category)?.label || service.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-black/60">
                    {service.priceMin && service.priceMax
                      ? `${service.priceMin?.toLocaleString()} - ${service.priceMax?.toLocaleString()} ر.س`
                      : service.priceMin ? `من ${service.priceMin?.toLocaleString()} ر.س` : "—"}
                  </td>
                  <td className="p-4 text-sm text-black/60">{service.estimatedDuration || "—"}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-black/60"
                        onClick={() => handleEdit(service)}
                        data-testid={`button-edit-${service.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => deleteMutation.mutate(String(service.id))}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${service.id}`}
                      >
                        {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!services || services.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-black/30">
                    لا توجد خدمات بعد
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
              {editingId ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">اسم الخدمة *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: نظام المطاعم"
                data-testid="input-title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">الوصف *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[80px]"
                placeholder="وصف تفصيلي للخدمة"
                data-testid="input-description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">الفئة</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">السعر الأدنى (ر.س)</label>
                <Input
                  type="number"
                  value={formData.priceMin}
                  onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                  placeholder="5000"
                  data-testid="input-priceMin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">السعر الأقصى (ر.س)</label>
                <Input
                  type="number"
                  value={formData.priceMax}
                  onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                  placeholder="15000"
                  data-testid="input-priceMax"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">المدة المتوقعة</label>
                <Input
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  placeholder="2-4 أسابيع"
                  data-testid="input-duration"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">الأيقونة</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Utensils"
                  data-testid="input-icon"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">المميزات (مفصولة بفاصلة)</label>
              <Input
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="ميزة 1, ميزة 2, ميزة 3"
                data-testid="input-features"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">صور المحفظة (روابط مفصولة بفاصلة)</label>
              <Input
                value={formData.portfolioImages}
                onChange={(e) => setFormData({ ...formData, portfolioImages: e.target.value })}
                placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                data-testid="input-portfolio-images"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">رابط المحفظة</label>
              <Input
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                placeholder="https://example.com/portfolio"
                data-testid="input-portfolio-url"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 premium-btn"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-form"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingId ? "تحديث" : "إضافة"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-form"
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
