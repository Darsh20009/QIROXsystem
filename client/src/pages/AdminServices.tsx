import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SARIcon from "@/components/SARIcon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Edit2, Trash2, Briefcase, Search, X, Upload, FileText, Video, File, ExternalLink } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Service } from "@shared/schema";
import { useState, useMemo, useRef } from "react";
import { ImageUpload } from "@/components/ImageUpload";

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

interface PortfolioFile {
  url: string;
  name: string;
  type: "pdf" | "video" | "document" | "other";
}

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
  platformUrl: string;
  usageInstructions: string;
  portfolioFiles: PortfolioFile[];
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
  platformUrl: "",
  usageInstructions: "",
  portfolioFiles: [],
};

function getFileType(filename: string): PortfolioFile["type"] {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) return "video";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return "document";
  return "other";
}

function getFileIcon(type: string) {
  if (type === "pdf") return <FileText className="w-4 h-4 text-red-500" />;
  if (type === "video") return <Video className="w-4 h-4 text-blue-500" />;
  if (type === "document") return <FileText className="w-4 h-4 text-green-500" />;
  return <File className="w-4 h-4 text-black/40" />;
}

export default function AdminServices() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"]
  });

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter(s => {
      const matchSearch = !searchQuery ||
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === "all" || s.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [services, searchQuery, filterCategory]);

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
    platformUrl: data.platformUrl || undefined,
    usageInstructions: data.usageInstructions || undefined,
    portfolioFiles: data.portfolioFiles.length > 0 ? data.portfolioFiles : undefined,
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
    const s = service as any;
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
      portfolioImages: Array.isArray(s.portfolioImages) ? s.portfolioImages.join(", ") : "",
      portfolioUrl: s.portfolioUrl || "",
      platformUrl: s.platformUrl || "",
      usageInstructions: s.usageInstructions || "",
      portfolioFiles: Array.isArray(s.portfolioFiles) ? s.portfolioFiles : [],
    });
    setOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload/large", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast({ title: `خطأ في رفع ${file.name}`, description: data.error || "فشل الرفع", variant: "destructive" });
          continue;
        }
        const data = await res.json();
        const newFile: PortfolioFile = {
          url: data.url,
          name: data.filename || file.name,
          type: getFileType(file.name),
        };
        setFormData(f => ({ ...f, portfolioFiles: [...f.portfolioFiles, newFile] }));
      }
      toast({ title: "تم رفع الملفات بنجاح" });
    } catch {
      toast({ title: "خطأ في رفع الملفات", variant: "destructive" });
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFormData(f => ({
      ...f,
      portfolioFiles: f.portfolioFiles.filter((_, i) => i !== idx),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-black/40" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden space-y-6">
      <PageGraphics variant="dashboard" />
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

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث في الخدمات..."
            className="pr-9 h-10 rounded-xl border-black/[0.1] text-sm"
            data-testid="input-search-services"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44 h-10 rounded-xl border-black/[0.1] text-sm" data-testid="select-filter-category">
            <SelectValue placeholder="كل الفئات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفئات</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(searchQuery || filterCategory !== "all") && (
          <span className="text-xs text-black/40 bg-black/[0.04] px-3 py-2 rounded-xl">
            {filteredServices.length} نتيجة
          </span>
        )}
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
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الملفات</th>
                <th className="text-left p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => {
                const s = service as any;
                const filesCount = Array.isArray(s.portfolioFiles) ? s.portfolioFiles.length : 0;
                return (
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
                        ? <span className="flex items-center gap-1">{service.priceMin?.toLocaleString()} - {service.priceMax?.toLocaleString()} <SARIcon size={11} /></span>
                        : service.priceMin ? <span className="flex items-center gap-1">من {service.priceMin?.toLocaleString()} <SARIcon size={11} /></span> : "—"}
                    </td>
                    <td className="p-4 text-sm text-black/60">{service.estimatedDuration || "—"}</td>
                    <td className="p-4 text-sm text-black/60">
                      {filesCount > 0 ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                          {filesCount} ملف
                        </span>
                      ) : "—"}
                    </td>
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
                );
              })}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-black/30">
                    {services?.length ? "لا توجد نتائج مطابقة للبحث" : "لا توجد خدمات بعد"}
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
                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                placeholder="مثال: نظام المطاعم"
                data-testid="input-title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">الوصف *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                className="min-h-[80px]"
                placeholder="وصف تفصيلي للخدمة"
                data-testid="input-description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">الفئة</label>
              <Select value={formData.category} onValueChange={(v) => setFormData(f => ({ ...f, category: v }))}>
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
                <label className="flex items-center gap-1 text-sm font-medium text-black/60 mb-1.5">السعر الأدنى (<SARIcon size={10} className="opacity-60" />)</label>
                <Input
                  type="number"
                  value={formData.priceMin}
                  onChange={(e) => setFormData(f => ({ ...f, priceMin: e.target.value }))}
                  placeholder="5000"
                  data-testid="input-priceMin"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-black/60 mb-1.5">السعر الأقصى (<SARIcon size={10} className="opacity-60" />)</label>
                <Input
                  type="number"
                  value={formData.priceMax}
                  onChange={(e) => setFormData(f => ({ ...f, priceMax: e.target.value }))}
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
                  onChange={(e) => setFormData(f => ({ ...f, estimatedDuration: e.target.value }))}
                  placeholder="2-4 أسابيع"
                  data-testid="input-duration"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">الأيقونة</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData(f => ({ ...f, icon: e.target.value }))}
                  placeholder="Utensils"
                  data-testid="input-icon"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">المميزات (مفصولة بفاصلة)</label>
              <Input
                value={formData.features}
                onChange={(e) => setFormData(f => ({ ...f, features: e.target.value }))}
                placeholder="ميزة 1, ميزة 2, ميزة 3"
                data-testid="input-features"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">رابط المنصة</label>
              <Input
                value={formData.platformUrl}
                onChange={(e) => setFormData(f => ({ ...f, platformUrl: e.target.value }))}
                placeholder="https://platform.example.com"
                dir="ltr"
                data-testid="input-platform-url"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">طريقة الاستخدام</label>
              <Textarea
                value={formData.usageInstructions}
                onChange={(e) => setFormData(f => ({ ...f, usageInstructions: e.target.value }))}
                className="min-h-[100px]"
                placeholder={"1. افتح لوحة التحكم\n2. اضغط على إضافة منتج\n3. أدخل البيانات واحفظ"}
                data-testid="input-usage-instructions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">ملفات الشرح (PDF / فيديو)</label>
              <div className="border-2 border-dashed border-black/[0.1] rounded-xl p-4 text-center hover:border-black/[0.2] transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.mp4,.mov,.avi,.webm,.mkv,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-portfolio-files"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                  data-testid="button-upload-files"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading ? "جاري الرفع..." : "اختر ملفات"}
                </Button>
                <p className="text-xs text-black/30 mt-2">PDF, فيديو, مستندات — بدون حد للحجم (حتى 500MB)</p>
              </div>

              {formData.portfolioFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.portfolioFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.06]">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black truncate">{file.name}</p>
                        <p className="text-xs text-black/40">{file.type === "pdf" ? "PDF" : file.type === "video" ? "فيديو" : file.type === "document" ? "مستند" : "ملف"}</p>
                      </div>
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors" data-testid={`link-preview-file-${idx}`}>
                        <ExternalLink className="w-3.5 h-3.5 text-black/40" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        data-testid={`button-remove-file-${idx}`}
                      >
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <ImageUpload
                label="صور المحفظة"
                multiple
                value={formData.portfolioImages ? formData.portfolioImages.split(",").map(s => s.trim()).filter(Boolean) : []}
                onChange={(urls) => setFormData(f => ({ ...f, portfolioImages: urls.join(", ") }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">رابط المحفظة</label>
              <Input
                value={formData.portfolioUrl}
                onChange={(e) => setFormData(f => ({ ...f, portfolioUrl: e.target.value }))}
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
