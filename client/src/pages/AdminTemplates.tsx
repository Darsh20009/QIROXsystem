import { useState } from "react";
import { useTemplates, usePricingPlans } from "@/hooks/use-templates";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Plus, Pencil, Trash2, Layers, CreditCard,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
} from "lucide-react";
import type { SectorTemplate, PricingPlan } from "@shared/schema";

const IconMap: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
};

function TemplateForm({ template, onClose }: { template?: SectorTemplate; onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: template?.name || "",
    nameAr: template?.nameAr || "",
    slug: template?.slug || "",
    description: template?.description || "",
    descriptionAr: template?.descriptionAr || "",
    category: template?.category || "",
    icon: template?.icon || "Globe",
    priceMin: template?.priceMin || 0,
    priceMax: template?.priceMax || 0,
    estimatedDuration: template?.estimatedDuration || "",
    heroColor: template?.heroColor || "#0f172a",
    status: (template?.status || "active") as "active" | "coming_soon" | "archived",
    features: template?.features?.join(", ") || "",
    featuresAr: template?.featuresAr?.join("، ") || "",
    tags: template?.tags?.join(", ") || "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "تم إنشاء القالب بنجاح" });
      onClose();
    },
    onError: () => toast({ title: "خطأ في إنشاء القالب", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/templates/${template?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "تم تحديث القالب بنجاح" });
      onClose();
    },
    onError: () => toast({ title: "خطأ في تحديث القالب", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      features: formData.features.split(",").map(s => s.trim()).filter(Boolean),
      featuresAr: formData.featuresAr.split("،").map(s => s.trim()).filter(Boolean),
      tags: formData.tags.split(",").map(s => s.trim()).filter(Boolean),
    };
    if (template) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Name (EN)</label>
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} data-testid="input-template-name" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">الاسم (عربي)</label>
          <Input value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} data-testid="input-template-nameAr" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Slug</label>
          <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} data-testid="input-template-slug" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">القطاع</label>
          <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} data-testid="input-template-category" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Description (EN)</label>
        <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} data-testid="input-template-desc" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">الوصف (عربي)</label>
        <Textarea value={formData.descriptionAr} onChange={e => setFormData({...formData, descriptionAr: e.target.value})} rows={2} data-testid="input-template-descAr" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">الحد الأدنى (SAR)</label>
          <Input type="number" value={formData.priceMin} onChange={e => setFormData({...formData, priceMin: Number(e.target.value)})} data-testid="input-template-priceMin" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">الحد الأقصى (SAR)</label>
          <Input type="number" value={formData.priceMax} onChange={e => setFormData({...formData, priceMax: Number(e.target.value)})} data-testid="input-template-priceMax" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">المدة</label>
          <Input value={formData.estimatedDuration} onChange={e => setFormData({...formData, estimatedDuration: e.target.value})} data-testid="input-template-duration" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">الأيقونة</label>
          <Input value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} data-testid="input-template-icon" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">لون البطاقة</label>
          <div className="flex items-center gap-2">
            <input type="color" value={formData.heroColor} onChange={e => setFormData({...formData, heroColor: e.target.value})} className="w-10 h-10 rounded cursor-pointer" />
            <Input value={formData.heroColor} onChange={e => setFormData({...formData, heroColor: e.target.value})} className="flex-1" />
          </div>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Features (EN, comma separated)</label>
        <Input value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} data-testid="input-template-features" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">الميزات (عربي، مفصولة بفاصلة)</label>
        <Input value={formData.featuresAr} onChange={e => setFormData({...formData, featuresAr: e.target.value})} data-testid="input-template-featuresAr" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">الحالة</label>
        <select 
          value={formData.status} 
          onChange={e => setFormData({...formData, status: e.target.value})}
          className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
          data-testid="select-template-status"
        >
          <option value="active">نشط</option>
          <option value="coming_soon">قريباً</option>
          <option value="archived">مؤرشف</option>
        </select>
      </div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-template">
        {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
        {template ? "تحديث القالب" : "إنشاء القالب"}
      </Button>
    </form>
  );
}

export default function AdminTemplates() {
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: plans, isLoading: plansLoading } = usePricingPlans();
  const { toast } = useToast();
  const [editingTemplate, setEditingTemplate] = useState<SectorTemplate | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "تم حذف القالب" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/pricing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      toast({ title: "تم حذف الباقة" });
    },
  });

  return (
    <div className="space-y-8" data-testid="page-admin-templates">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary">إدارة القوالب والباقات</h1>
          <p className="text-slate-500 mt-1">إدارة أنظمة QIROX وباقات الأسعار</p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2" data-testid="tab-templates">
            <Layers className="w-4 h-4" /> القوالب ({templates?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2" data-testid="tab-pricing">
            <CreditCard className="w-4 h-4" /> الباقات ({plans?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => { setEditingTemplate(undefined); setIsDialogOpen(true); }}
                  data-testid="button-add-template"
                >
                  <Plus className="w-4 h-4 ml-2" /> إضافة قالب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? "تعديل القالب" : "إنشاء قالب جديد"}</DialogTitle>
                </DialogHeader>
                <TemplateForm 
                  template={editingTemplate} 
                  onClose={() => setIsDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>

          {templatesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {templates?.map(template => {
                const Icon = IconMap[template.icon || "Globe"] || Globe;
                return (
                  <Card key={template.id} className="border shadow-sm" data-testid={`admin-template-${template.slug}`}>
                    <CardContent className="py-4 flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${template.heroColor}20`, color: template.heroColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-primary truncate">{template.nameAr}</h3>
                          <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                          <Badge className={`text-xs ${
                            template.status === "active" ? "bg-green-100 text-green-700" :
                            template.status === "coming_soon" ? "bg-yellow-100 text-yellow-700" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {template.status === "active" ? "نشط" : template.status === "coming_soon" ? "قريباً" : "مؤرشف"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 truncate">{template.descriptionAr}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                          <span>{template.priceMin?.toLocaleString()} - {template.priceMax?.toLocaleString()} {template.currency}</span>
                          <span>{template.estimatedDuration}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button 
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { setEditingTemplate(template); setIsDialogOpen(true); }}
                          data-testid={`button-edit-${template.slug}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => deleteMutation.mutate(template.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${template.slug}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          {plansLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans?.map(plan => (
                <Card key={plan.id} className="border shadow-sm" data-testid={`admin-plan-${plan.slug}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">{plan.nameAr}</CardTitle>
                      {plan.isPopular && <Badge className="bg-[#111111] text-white">الأكثر طلباً</Badge>}
                    </div>
                    <p className="text-sm text-slate-500">{plan.descriptionAr}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary mb-4">
                      {plan.price.toLocaleString()} <span className="text-sm text-slate-400">{plan.currency}</span>
                    </div>
                    <div className="space-y-1 mb-4">
                      {plan.featuresAr?.map((f, i) => (
                        <div key={i} className="text-xs text-slate-600">- {f}</div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-plan-${plan.slug}`}>
                        <Pencil className="w-3 h-3 ml-1" /> تعديل
                      </Button>
                      <Button 
                        variant="outline" size="sm" className="text-red-500 hover:text-red-700"
                        onClick={() => deletePlanMutation.mutate(plan.id)}
                        data-testid={`button-delete-plan-${plan.slug}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
