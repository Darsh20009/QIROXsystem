import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Edit2, Trash2, Newspaper, Eye, EyeOff } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type News } from "@shared/schema";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";

interface FormData {
  title: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  status: string;
}

const emptyForm: FormData = {
  title: "",
  content: "",
  excerpt: "",
  imageUrl: "",
  status: "draft",
};

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "bg-gray-100 text-gray-600" },
  published: { label: "منشور", color: "bg-green-100 text-green-700" },
  archived: { label: "مؤرشف", color: "bg-amber-100 text-amber-700" },
};

export default function AdminNews() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const { data: newsList, isLoading } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/admin/news", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "تم إضافة المقال بنجاح" });
      setOpen(false);
      setFormData(emptyForm);
    },
    onError: () => toast({ title: "خطأ في إضافة المقال", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PATCH", `/api/admin/news/${editingId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "تم تحديث المقال بنجاح" });
      setOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    },
    onError: () => toast({ title: "خطأ في تحديث المقال", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/news/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "تم حذف المقال" });
    },
    onError: () => toast({ title: "خطأ في حذف المقال", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast({ title: "يرجى ملء العنوان والمحتوى", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: News) => {
    setEditingId(item.id.toString());
    setFormData({
      title: item.title,
      content: item.content,
      excerpt: item.excerpt || "",
      imageUrl: item.imageUrl || "",
      status: item.status,
    });
    setOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setOpen(true);
  };

  const handleQuickToggle = (item: News) => {
    const newStatus = item.status === "published" ? "draft" : "published";
    updateMutation.mutate({
      title: item.title,
      content: item.content,
      excerpt: item.excerpt || "",
      imageUrl: item.imageUrl || "",
      status: newStatus,
    });
    setEditingId(item.id.toString());
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
          <Newspaper className="w-7 h-7 text-black/40" />
          إدارة الأخبار والمدونة
        </h1>
        <Button onClick={handleAddNew} className="gap-2 premium-btn" data-testid="button-add-news">
          <Plus className="w-4 h-4" />
          مقال جديد
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["draft", "published", "archived"].map((s) => (
          <div key={s} className="border border-black/[0.06] bg-white rounded-xl p-4 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${s === "published" ? "bg-green-500" : s === "draft" ? "bg-gray-400" : "bg-amber-400"}`} />
            <div>
              <p className="text-lg font-bold text-black">{newsList?.filter(n => n.status === s).length || 0}</p>
              <p className="text-xs text-black/40">{statusMap[s]?.label}</p>
            </div>
          </div>
        ))}
        <div className="border border-black/[0.06] bg-white rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-black/30" />
          <div>
            <p className="text-lg font-bold text-black">{newsList?.length || 0}</p>
            <p className="text-xs text-black/40">الإجمالي</p>
          </div>
        </div>
      </div>

      <div className="border border-black/[0.06] bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">العنوان</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">المقتطف</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الحالة</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">التاريخ</th>
                <th className="text-left p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {newsList?.map((item) => {
                const st = statusMap[item.status] || statusMap["draft"];
                return (
                  <tr key={item.id} className="border-b border-black/[0.03] hover:bg-black/[0.02] transition-colors" data-testid={`row-news-${item.id}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <div className="w-10 h-10 rounded-lg bg-black/[0.03] overflow-hidden shrink-0">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <p className="font-semibold text-black text-sm line-clamp-1">{item.title}</p>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-black/40 max-w-[200px]">
                      <p className="line-clamp-2">{item.excerpt || "—"}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-black/40">
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("ar-SA") : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-black/50 hover:text-black"
                          onClick={() => handleEdit(item)}
                          data-testid={`button-edit-news-${item.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={item.status === "published" ? "text-green-600" : "text-black/40"}
                          onClick={() => handleQuickToggle(item)}
                          title={item.status === "published" ? "إلغاء النشر" : "نشر"}
                          data-testid={`button-toggle-news-${item.id}`}
                        >
                          {item.status === "published" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => deleteMutation.mutate(item.id.toString())}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-news-${item.id}`}
                        >
                          {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!newsList || newsList.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-black/30">
                    <Newspaper className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>لا توجد مقالات بعد. أضف أول مقال الآن.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setEditingId(null); setFormData(emptyForm); } }}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              {editingId ? "تعديل المقال" : "مقال جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">العنوان *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="عنوان المقال"
                data-testid="input-news-title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">مقتطف قصير</label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="وصف مختصر يظهر في القوائم..."
                rows={2}
                data-testid="input-news-excerpt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">المحتوى الكامل *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="اكتب محتوى المقال هنا..."
                rows={8}
                data-testid="input-news-content"
              />
            </div>
            <div>
              <ImageUpload
                label="صورة المقال"
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">الحالة</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger data-testid="select-news-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 premium-btn"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-news"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingId ? "تحديث المقال" : "نشر المقال"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
