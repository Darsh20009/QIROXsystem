import { useTranslate } from "@/lib/useTranslate";
import { useState, useEffect, useMemo } from "react";
import SarIcon from "@/components/sar-icon";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Package, ArrowRight, CheckCircle, XCircle, Plus, Edit2, Trash2, Sparkles, X,
  FlaskConical, AlertTriangle, ChevronUp, ChevronDown, ListOrdered, Search,
  UtensilsCrossed, Coffee, ShoppingBag, Clock, Eye, EyeOff, Copy
} from "lucide-react";
import { ImageLibraryModal } from "@/components/ImageLibraryModal";
import { AIMenuAssistant } from "@/components/AIMenuAssistant";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCoffeeImage } from "@/lib/coffee-data-clean";
import { nanoid } from "nanoid";
import { Checkbox } from "@/components/ui/checkbox";
import type { CoffeeItem, Employee, Ingredient, RawItem, RecipeItem, Branch } from "@shared/schema";
import { MobileBottomNav } from "@/components/MobileBottomNav";

interface RecipeIngredient {
  rawItemId: string;
  rawItem?: RawItem;
  quantity: number;
  unit: string;
}

interface BranchAvailability {
  branchId: string;
  isAvailable: number;
}

interface MenuCategory {
  id: string;
  nameAr: string;
  nameEn?: string;
  icon?: string;
  department: 'drinks' | 'food';
  orderIndex: number;
}

const LEGACY_FOOD_CATEGORIES = ['food', 'bakery', 'desserts', 'cake', 'croissant', 'sandwiches'];
const LEGACY_DRINK_CATEGORIES = ['hot', 'cold', 'specialty', 'drinks', 'basic', 'additional_drinks'];
const UNIFIED_CATEGORIES = [
  { id: 'hot',        nameAr: 'مشروبات ساخنة', department: 'drinks' as const },
  { id: 'cold',       nameAr: 'مشروبات باردة', department: 'drinks' as const },
  { id: 'desserts',   nameAr: 'حلا والكيك',    department: 'food' as const },
  { id: 'bakery',     nameAr: 'المخبوزات',      department: 'food' as const },
  { id: 'sandwiches', nameAr: 'الساندوتشات',   department: 'food' as const },
];

type BundledSection = {
  sectionTitle: string;
  selectionType: 'single' | 'multiple';
  minSelectable: number;
  maxSelectable: number;
  items: Array<{ productId: string; nameAr: string; nameEn?: string; imageUrl?: string; originalPrice: number; customPrice: number; }>;
};

type ReservationPackage = { packageName: string; description?: string; price: number; duration?: string; maxGuests?: number; };

// ─── Inline Addons Section Component ───
function AddonsEditor({
  addons,
  setAddons,
  onOpenImageLibrary,
  context,
  setEditingAddonImageIdx,
  coffeeItems = [],
}: {
  addons: Array<{nameAr: string; nameEn?: string; price: number; imageUrl?: string; category?: string; section?: string; selectionType?: 'single' | 'multiple'}>;
  setAddons: React.Dispatch<React.SetStateAction<typeof addons>>;
  onOpenImageLibrary: (ctx: string) => void;
  context: 'add' | 'edit';
  setEditingAddonImageIdx: (idx: number) => void;
  coffeeItems?: any[];
}) {
  const [showImportPicker, setShowImportPicker] = useState(false);
  const [importSearch, setImportSearch] = useState('');

  // Products that actually have addons
  const productsWithAddons = coffeeItems.filter(
    (item: any) => Array.isArray(item.addons) && item.addons.length > 0
  );
  const filteredImportItems = productsWithAddons.filter((item: any) =>
    !importSearch || item.nameAr?.includes(importSearch) || item.nameEn?.toLowerCase().includes(importSearch.toLowerCase())
  );

  const importAddonsFrom = (item: any) => {
    const incoming = (item.addons || []).map((a: any) => ({
      nameAr: a.nameAr || '',
      nameEn: a.nameEn || '',
      price: a.price ?? 0,
      imageUrl: a.imageUrl || '',
      category: a.category || 'other',
      section: a.section || '',
      selectionType: (a.selectionType as 'single' | 'multiple') || 'multiple',
    }));
    setAddons(prev => [...prev, ...incoming]);
    setShowImportPicker(false);
    setImportSearch('');
  };

  const sectionOrder: string[] = [];
  const sectionMap: Record<string, number[]> = {};
  addons.forEach((addon, idx) => {
    const key = addon.section || '';
    if (!sectionMap[key]) { sectionMap[key] = []; if (key && !sectionOrder.includes(key)) sectionOrder.push(key); }
    sectionMap[key].push(idx);
  });
  const noSectionIndices = sectionMap[''] || [];
  const changeSectionType = (sectionName: string, type: 'single' | 'multiple') => setAddons(prev => prev.map(a => (a.section || '') === sectionName ? {...a, selectionType: type} : a));
  const getSectionType = (sectionName: string): 'single' | 'multiple' => { const f = addons.find(a => (a.section || '') === sectionName); return f?.selectionType || 'multiple'; };

  return (
    <div className="space-y-3">
      {sectionOrder.map(sectionName => {
        const indices = sectionMap[sectionName] || [];
        const selType = getSectionType(sectionName);
        return (
          <div key={sectionName} className="border border-primary/30 rounded-xl p-3 space-y-2 bg-gray-50">
            <div className="flex items-center gap-1.5">
              <span className="text-primary text-sm">📂</span>
              <input type="text" value={sectionName}
                onChange={(e) => { const nv = e.target.value; setAddons(prev => prev.map(a => a.section === sectionName ? {...a, section: nv} : a)); }}
                placeholder="اسم القسم"
                className="flex-1 text-sm font-semibold text-gray-700 bg-transparent border-b border-gray-200 focus:border-primary focus:outline-none"
              />
              <button type="button" onClick={() => changeSectionType(sectionName, 'multiple')} className={`text-xs px-2 py-0.5 rounded-r-none rounded-l border transition-colors ${selType === 'multiple' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-300'}`}>☑ متعدد</button>
              <button type="button" onClick={() => changeSectionType(sectionName, 'single')} className={`text-xs px-2 py-0.5 rounded-l-none rounded-r border-t border-b border-r transition-colors ${selType === 'single' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-300'}`}>◉ واحد</button>
              <button type="button" onClick={() => setAddons(prev => prev.filter((_, i) => !indices.includes(i)))} className="text-red-400 hover:text-red-600 mr-0.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1.5 pr-2">
              {indices.map(idx => { const addon = addons[idx]; return (
                <div key={idx} className="flex gap-2 items-center">
                  <button type="button" onClick={() => { setEditingAddonImageIdx(idx); onOpenImageLibrary(`${context}-addon`); }}
                    className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0 overflow-hidden hover:border-primary/50 transition-colors">
                    {addon.imageUrl ? <img src={addon.imageUrl.startsWith('/') ? addon.imageUrl : '/' + addon.imageUrl} className="w-full h-full object-cover rounded-lg" alt="" /> : <Plus className="w-3 h-3 text-gray-400" />}
                  </button>
                  <Input type="text" placeholder="اسم الخيار (عربي)" value={addon.nameAr} onChange={(e) => { const n = [...addons]; n[idx] = { ...n[idx], nameAr: e.target.value }; setAddons(n); }} className="flex-1 h-8 text-sm" />
                  <Input type="number" placeholder="السعر" value={addon.price} onChange={(e) => { const n = [...addons]; n[idx] = { ...n[idx], price: parseFloat(e.target.value) || 0 }; setAddons(n); }} className="w-20 h-8 text-sm" />
                  <button type="button" onClick={() => setAddons(addons.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ); })}
            </div>
            <button type="button" onClick={() => setAddons(prev => [...prev, { nameAr: '', price: 0, imageUrl: '', category: 'other', section: sectionName, selectionType: selType }])} className="text-xs text-primary hover:underline pr-2">+ إضافة خيار لهذا القسم</button>
          </div>
        );
      })}
      {noSectionIndices.map(idx => { const addon = addons[idx]; return (
        <div key={idx} className="p-2 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex gap-2 items-center">
            <button type="button" onClick={() => { setEditingAddonImageIdx(idx); onOpenImageLibrary(`${context}-addon`); }}
              className="w-9 h-9 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0 overflow-hidden hover:border-primary/50 transition-colors">
              {addon.imageUrl ? <img src={addon.imageUrl.startsWith('/') ? addon.imageUrl : '/' + addon.imageUrl} className="w-full h-full object-cover rounded-lg" alt="" /> : <Plus className="w-3 h-3 text-gray-400" />}
            </button>
            <Input type="text" placeholder="اسم الخيار (عربي)" value={addon.nameAr} onChange={(e) => { const n = [...addons]; n[idx] = { ...n[idx], nameAr: e.target.value }; setAddons(n); }} className="flex-1" />
            <Input type="number" placeholder="السعر" value={addon.price} onChange={(e) => { const n = [...addons]; n[idx] = { ...n[idx], price: parseFloat(e.target.value) || 0 }; setAddons(n); }} className="w-20" />
            <Button type="button" size="sm" variant="outline" onClick={() => setAddons(addons.filter((_, i) => i !== idx))} className="border-red-500/30 text-red-500 shrink-0"><X className="w-4 h-4" /></Button>
          </div>
        </div>
      ); })}
      <div className="flex gap-2 flex-wrap">
        <Button type="button" size="sm" variant="outline" onClick={() => { const nm = `قسم ${sectionOrder.length + 1}`; setAddons(prev => [...prev, { nameAr: '', price: 0, imageUrl: '', category: 'other', section: nm, selectionType: 'multiple' }]); }} className="border-blue-400/40 text-blue-500 flex-1"><Plus className="w-4 h-4 ml-1" />إضافة قسم</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setAddons(prev => [...prev, {nameAr: '', price: 0, imageUrl: '', category: 'other', section: '', selectionType: 'multiple'}])} className="border-green-500/30 text-green-600 flex-1"><Plus className="w-4 h-4 ml-1" />خيار مفرد</Button>
        {productsWithAddons.length > 0 && (
          <Button type="button" size="sm" variant="outline" onClick={() => setShowImportPicker(v => !v)} className="border-purple-400/40 text-purple-600 flex-1"><Copy className="w-4 h-4 ml-1" />استيراد إضافات</Button>
        )}
      </div>

      {/* Import picker */}
      {showImportPicker && (
        <div className="border border-purple-200 rounded-xl bg-purple-50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-purple-700">اختر منتجاً لاستيراد إضافاته:</p>
            <button type="button" onClick={() => { setShowImportPicker(false); setImportSearch(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={importSearch}
              onChange={e => setImportSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full text-sm border border-gray-200 rounded-lg py-1.5 pr-8 pl-3 focus:outline-none focus:border-purple-400"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredImportItems.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">لا توجد نتائج</p>
            )}
            {filteredImportItems.map((item: any) => (
              <button
                key={item.id}
                type="button"
                onClick={() => importAddonsFrom(item)}
                className="w-full text-right flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors text-sm"
              >
                {item.imageUrl && (
                  <img src={item.imageUrl.startsWith('/') ? item.imageUrl : '/' + item.imageUrl} className="w-7 h-7 rounded-md object-cover shrink-0" alt="" />
                )}
                <span className="flex-1 font-medium text-gray-700">{item.nameAr}</span>
                <span className="text-xs text-purple-500 shrink-0">{item.addons.length} خيار</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeeMenuManagement() {
  const [, setLocation] = useLocation();
  const [employee, setEmployee] = useState<Employee | null>(null);

  // ─── Tab state (replaces URL-based managementType) ───
  const [activeTab, setActiveTab] = useState<'all' | 'drinks' | 'food'>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Dialog states ───
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CoffeeItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [editingRecipeItem, setEditingRecipeItem] = useState<CoffeeItem | null>(null);
  const [skipRecipeConfirmOpen, setSkipRecipeConfirmOpen] = useState(false);
  const [isCategoryReorderOpen, setIsCategoryReorderOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState<MenuCategory[]>([]);

  // ─── Add form state ───
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [addDepartment, setAddDepartment] = useState<'drinks' | 'food'>('drinks');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCoffeeStrength, setSelectedCoffeeStrength] = useState<string>('classic');
  const [addImageUrls, setAddImageUrls] = useState<string[]>([]);
  const [addEditableAddons, setAddEditableAddons] = useState<Array<{nameAr: string; nameEn?: string; price: number; imageUrl?: string; category?: string; section?: string; selectionType?: 'single' | 'multiple'}>>([]);
  const [addEditableSizes, setAddEditableSizes] = useState<Array<{nameAr: string; price: number}>>([]);
  const [addBundledItems, setAddBundledItems] = useState<BundledSection[]>([]);
  const [addIsReservation, setAddIsReservation] = useState(false);
  const [addReservationPackages, setAddReservationPackages] = useState<ReservationPackage[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<BranchAvailability[]>([]);
  const [aiAddNameAr, setAiAddNameAr] = useState('');
  const [aiAddNameEn, setAiAddNameEn] = useState('');
  const [aiAddDescription, setAiAddDescription] = useState('');
  const [step1Data, setStep1Data] = useState<any>(null);

  // ─── Edit form state ───
  const [editableAddons, setEditableAddons] = useState<Array<{nameAr: string; nameEn?: string; price: number; imageUrl?: string; category?: string; section?: string; selectionType?: 'single' | 'multiple'}>>([]);
  const [editableSizes, setEditableSizes] = useState<Array<{nameAr: string; price: number}>>([]);
  const [editBundledItems, setEditBundledItems] = useState<BundledSection[]>([]);
  const [editIsReservation, setEditIsReservation] = useState(false);
  const [editReservationPackages, setEditReservationPackages] = useState<ReservationPackage[]>([]);
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [aiEditNameEn, setAiEditNameEn] = useState('');
  const [aiEditDescription, setAiEditDescription] = useState('');

  // ─── Image library ───
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  const [imageLibraryContext, setImageLibraryContext] = useState<'add' | 'edit' | 'add-addon' | 'edit-addon'>('add');
  const [editingAddonImageIdx, setEditingAddonImageIdx] = useState<number>(-1);

  // ─── Recipe ───
  const [recipeItems, setRecipeItems] = useState<RecipeIngredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{ingredientId: string, name: string, quantity: number, unit: string}>>([]);

  const { toast } = useToast();
  const tc = useTranslate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const s = localStorage.getItem("currentEmployee");
    if (s) setEmployee(JSON.parse(s));
  }, []);

  const canManageMenu = !employee || ["manager", "branch_manager", "admin", "owner"].includes(employee.role);

  // ─── Queries ───
  const { data: coffeeItems = [], isLoading, refetch } = useQuery<CoffeeItem[]>({
    queryKey: ["/api/coffee-items"],
    staleTime: 0, gcTime: 0, refetchOnWindowFocus: true, refetchOnMount: true,
  });

  const { data: menuCategories = [] } = useQuery<MenuCategory[]>({
    queryKey: ["/api/menu-categories"],
  });

  const { data: rawItems = [] } = useQuery<RawItem[]>({
    queryKey: ["/api/inventory/raw-items"],
    enabled: canManageMenu,
  });

  const { data: allRecipes = [] } = useQuery<RecipeItem[]>({
    queryKey: ["/api/inventory/all-recipes"],
    enabled: canManageMenu,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
    enabled: canManageMenu,
  });

  // ─── Category helpers ───
  const drinkDynamicCats = useMemo(() => menuCategories.filter(c => c.department === 'drinks'), [menuCategories]);
  const foodDynamicCats = useMemo(() => menuCategories.filter(c => c.department === 'food'), [menuCategories]);

  const getCatsForDept = (dept: 'drinks' | 'food'): MenuCategory[] => {
    const dynamic = dept === 'drinks' ? drinkDynamicCats : foodDynamicCats;
    if (dynamic.length > 0) return dynamic;
    return UNIFIED_CATEGORIES.filter(c => c.department === dept) as MenuCategory[];
  };

  const allKnownCatIds = useMemo(() => new Set([
    ...menuCategories.map(c => c.id),
    ...LEGACY_FOOD_CATEGORIES,
    ...LEGACY_DRINK_CATEGORIES,
    ...UNIFIED_CATEGORIES.map(c => c.id),
  ]), [menuCategories]);

  const getCategoryName = (id: string): string => {
    const found = menuCategories.find(c => c.id === id);
    if (found) return found.nameAr;
    const unified = UNIFIED_CATEGORIES.find(c => c.id === id);
    if (unified) return unified.nameAr;
    const legacyMap: Record<string, string> = {
      hot: 'مشروبات ساخنة', cold: 'مشروبات باردة', specialty: 'مشروبات إضافية',
      drinks: 'المشروبات', basic: 'أساسية', additional_drinks: 'مشروبات أخرى',
      food: 'مأكولات', bakery: 'مخبوزات', desserts: 'حلويات', cake: 'كيك',
      croissant: 'كرواسان', sandwiches: 'سندوتشات',
    };
    return legacyMap[id] || id;
  };

  // ─── Filtered items ───
  const filteredItems = useMemo(() => {
    let items = coffeeItems;
    if (activeTab === 'drinks') {
      const deptIds = new Set([...drinkDynamicCats.map(c => c.id), ...LEGACY_DRINK_CATEGORIES]);
      items = items.filter(i => deptIds.has(i.category));
    } else if (activeTab === 'food') {
      const deptIds = new Set([...foodDynamicCats.map(c => c.id), ...LEGACY_FOOD_CATEGORIES]);
      items = items.filter(i => deptIds.has(i.category));
    }
    if (activeCategoryFilter !== 'all') {
      items = items.filter(i => i.category === activeCategoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.nameAr?.toLowerCase().includes(q) || i.nameEn?.toLowerCase().includes(q));
    }
    return items;
  }, [coffeeItems, activeTab, activeCategoryFilter, searchQuery, drinkDynamicCats, foodDynamicCats]);

  // ─── Visible category chips ───
  const visibleCategoryChips = useMemo(() => {
    if (activeTab === 'all') return menuCategories.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    return getCatsForDept(activeTab);
  }, [activeTab, menuCategories, drinkDynamicCats, foodDynamicCats]);

  // ─── Mutations ───
  const createItemMutation = useMutation({
    mutationFn: async (payload: { itemData: any; ingredientsList: any[]; recipeList?: RecipeIngredient[] }) => {
      const { itemData, ingredientsList, recipeList } = payload;
      const res = await apiRequest("POST", "/api/coffee-items", itemData);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "فشل في إنشاء المنتج"); }
      const newItem = await res.json();
      const newItemId = newItem.id || itemData.id;
      if (recipeList && recipeList.length > 0) {
        await apiRequest("POST", "/api/inventory/recipes/bulk", {
          coffeeItemId: newItemId,
          items: recipeList.map(r => ({ rawItemId: r.rawItemId, quantity: r.quantity, unit: r.unit })),
          clearExisting: true
        });
      }
      return newItem;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/coffee-items"] });
      setIsAddDialogOpen(false);
      resetAddForm();
      toast({ title: "تم الإضافة", description: "تمت إضافة المنتج بنجاح" });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "فشل الإضافة", description: e.message || "حدث خطأ أثناء إضافة المنتج" });
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ id, isAvailable, availabilityStatus }: { id: string; isAvailable?: number; availabilityStatus?: string }) => {
      const res = await fetch(`/api/coffee-items/${id}/availability`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: 'include',
        body: JSON.stringify({ isAvailable, availabilityStatus, branchId: employee?.branchId }),
      });
      if (!res.ok) throw new Error("فشل في تحديث الحالة");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coffee-items"] }); },
    onError: () => { toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة المنتج" }); },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const res = await apiRequest("PUT", `/api/coffee-items/${data.id}`, data.updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coffee-items"] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast({ title: "تم التحديث", description: "تم تحديث المنتج بنجاح" });
    },
    onError: (e: any) => { toast({ variant: "destructive", title: "فشل التحديث", description: e.message }); },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/coffee-items/${id}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "فشل في الحذف"); }
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/coffee-items"] });
      if (typeof refetch === 'function') await refetch();
      setDeletingItemId(null);
      toast({ title: "تم الحذف", description: "تم حذف المنتج بنجاح" });
    },
    onError: (e: any) => {
      setDeletingItemId(null);
      toast({ variant: "destructive", title: "فشل الحذف", description: e.message });
    },
  });

  const toggleNewProductMutation = useMutation({
    mutationFn: async ({ id, isNewProduct }: { id: string; isNewProduct: number }) => {
      const res = await apiRequest("PUT", `/api/coffee-items/${id}`, { isNewProduct });
      return await res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coffee-items"] }); },
  });

  const bulkRecipeMutation = useMutation({
    mutationFn: async (payload: { coffeeItemId: string; items: RecipeIngredient[]; clearExisting?: boolean }) => {
      const res = await apiRequest("POST", "/api/inventory/recipes/bulk", {
        coffeeItemId: payload.coffeeItemId,
        items: payload.items.map(r => ({ rawItemId: r.rawItemId, quantity: r.quantity, unit: r.unit })),
        clearExisting: payload.clearExisting ?? true
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all-recipes"] });
      setIsRecipeDialogOpen(false);
      setEditingRecipeItem(null);
      setRecipeItems([]);
      toast({ title: "تم حفظ الوصفة" });
    },
    onError: (e: any) => { toast({ variant: "destructive", title: "فشل حفظ الوصفة", description: e.message }); },
  });

  const reorderCategoriesMutation = useMutation({
    mutationFn: async (orders: Array<{ id: string; orderIndex: number }>) => {
      const res = await apiRequest("POST", "/api/menu-categories/reorder", { orders });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      toast({ title: "تم الحفظ", description: "تم حفظ ترتيب الأقسام" });
      setIsCategoryReorderOpen(false);
    },
  });

  // ─── Reset form ───
  const resetAddForm = () => {
    setAddStep(1); setStep1Data(null); setSelectedIngredients([]); setRecipeItems([]);
    setAddImageUrls([]); setAddEditableAddons([]); setAddEditableSizes([]);
    setAddBundledItems([]); setAddIsReservation(false); setAddReservationPackages([]);
    setSelectedBranches([]); setAiAddNameAr(''); setAiAddNameEn(''); setAiAddDescription('');
    setSelectedCoffeeStrength('classic');
  };

  // ─── Open add dialog ───
  const openAddDialog = (dept: 'drinks' | 'food') => {
    setAddDepartment(dept);
    const cats = getCatsForDept(dept);
    // FIX: use first available category, not a hardcoded legacy ID
    setSelectedCategory(cats.length > 0 ? cats[0].id : (dept === 'food' ? 'desserts' : 'hot'));
    resetAddForm();
    setIsAddDialogOpen(true);
  };

  // ─── Step 1 submit ───
  const handleStep1Submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nameAr = formData.get("nameAr") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;

    if (!nameAr?.trim() || !selectedCategory || !price || !description?.trim()) {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة (الاسم، الوصف، القسم، السعر)" });
      return;
    }

    setStep1Data({
      nameAr, nameEn: formData.get("nameEn") as string || "",
      description, category: selectedCategory,
      price, oldPrice: formData.get("oldPrice") as string || "",
      coffeeStrength: addDepartment === 'drinks' ? selectedCoffeeStrength : "classic",
      imageUrl: addImageUrls[0],
      imageUrls: addImageUrls,
      isGiftable: false,
      availableSizes: addEditableSizes.filter(s => s.nameAr.trim()),
      addons: addEditableAddons.filter(a => a.nameAr.trim()),
      bundledItems: addBundledItems,
      isReservation: addIsReservation,
      reservationPackages: addReservationPackages.filter(p => p.packageName.trim()),
      branchAvailability: selectedBranches.length > 0 ? selectedBranches : undefined,
    });
    setAddStep(2);
  };

  const buildItemData = (base: any, hasRecipe: boolean) => ({
    id: nanoid(10),
    nameAr: base.nameAr, nameEn: base.nameEn || undefined,
    description: base.description,
    price: parseFloat(base.price),
    oldPrice: base.oldPrice ? parseFloat(base.oldPrice) : undefined,
    category: base.category,
    coffeeStrength: base.coffeeStrength || "classic",
    imageUrl: base.imageUrl,
    imageUrls: base.imageUrls || [],
    isAvailable: 1, availabilityStatus: "available",
    isNewProduct: 0, isGiftable: base.isGiftable || false,
    availableSizes: base.availableSizes || [],
    addons: base.addons || [],
    bundledItems: base.bundledItems || [],
    isReservation: base.isReservation || false,
    reservationPackages: base.reservationPackages || [],
    branchAvailability: base.branchAvailability,
    hasRecipe: hasRecipe ? 1 : 0,
    requiresRecipe: hasRecipe ? 1 : 0,
  });

  const handleStep2Submit = () => {
    if (!step1Data) return;
    const hasRecipeItems = recipeItems.length > 0 || selectedIngredients.length > 0;
    createItemMutation.mutate({ itemData: buildItemData(step1Data, hasRecipeItems), ingredientsList: [], recipeList: recipeItems });
  };

  const handleSkipIngredients = () => {
    if (!step1Data) return;
    if (canManageMenu) { setSkipRecipeConfirmOpen(true); return; }
    createItemMutation.mutate({ itemData: buildItemData(step1Data, false), ingredientsList: [], recipeList: [] });
  };

  // ─── Edit handlers ───
  const handleEdit = (item: CoffeeItem) => {
    setEditingItem(item);
    setEditableSizes((item as any).availableSizes || []);
    setEditableAddons((item as any).addons || []);
    setEditBundledItems((item as any).bundledItems || []);
    setEditIsReservation((item as any).isReservation || false);
    setEditReservationPackages((item as any).reservationPackages || []);
    setEditImageUrls((item as any).imageUrls || (item.imageUrl ? [item.imageUrl] : []));
    setAiEditNameEn(item.nameEn || "");
    setAiEditDescription(item.description || "");
    setIsEditDialogOpen(true);
  };

  const handleSubmitEditItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    const formData = new FormData(e.currentTarget);
    const updates = {
      nameAr: formData.get("nameAr") as string,
      nameEn: formData.get("nameEn") as string || undefined,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      oldPrice: formData.get("oldPrice") ? parseFloat(formData.get("oldPrice") as string) : undefined,
      category: formData.get("category") as string,
      costOfGoods: formData.get("costOfGoods") ? parseFloat(formData.get("costOfGoods") as string) : (editingItem.costOfGoods || 0),
      imageUrl: editImageUrls.length > 0 ? editImageUrls[0] : editingItem.imageUrl,
      imageUrls: editImageUrls.length > 0 ? editImageUrls : ((editingItem as any).imageUrls || []),
      addons: editableAddons,
      bundledItems: editBundledItems,
      isReservation: editIsReservation,
      reservationPackages: editReservationPackages.filter(p => p.packageName.trim()),
      availableSizes: editableSizes,
    };
    updateItemMutation.mutate({ id: editingItem.id, updates });
  };

  // ─── Recipe ───
  const handleOpenRecipeEditor = (item: CoffeeItem) => {
    setEditingRecipeItem(item);
    const existing = allRecipes.filter(r => r.coffeeItemId === item.id);
    setRecipeItems(existing.map(r => {
      const raw = rawItems.find(ri => ri.id === r.rawItemId);
      return { rawItemId: r.rawItemId, rawItem: raw, quantity: r.quantity, unit: r.unit || raw?.unit || 'g' };
    }));
    setIsRecipeDialogOpen(true);
  };

  const handleSaveRecipe = () => {
    if (!editingRecipeItem) return;
    if (recipeItems.length === 0) {
      toast({ variant: "destructive", title: "خطأ", description: "أضف مكوناً واحداً على الأقل" });
      return;
    }
    bulkRecipeMutation.mutate({ coffeeItemId: editingRecipeItem.id, items: recipeItems, clearExisting: true });
  };

  const calculateRecipeCost = (items: RecipeIngredient[]) => {
    let totalCost = 0;
    const breakdown: any[] = [];
    for (const item of items) {
      const raw = rawItems.find(r => r.id === item.rawItemId);
      if (raw) {
        let qty = item.quantity;
        const ru = raw.unit.toLowerCase(), iu = item.unit.toLowerCase();
        if (ru === 'kg' && iu === 'g') qty /= 1000;
        else if (ru === 'g' && iu === 'kg') qty *= 1000;
        else if ((ru === 'liter' || ru === 'l') && iu === 'ml') qty /= 1000;
        else if (iu === 'ml' && (ru === 'liter' || ru === 'l')) qty /= 1000;
        const cost = qty * raw.unitCost;
        totalCost += cost;
        breakdown.push({ name: raw.nameAr, quantity: item.quantity, unit: item.unit, cost });
      }
    }
    return { totalCost, breakdown };
  };

  const getProductRecipeCount = (id: string) => allRecipes.filter(r => r.coffeeItemId === id).length;

  // ─── Category reorder ───
  const openCategoryReorder = () => {
    const cats = activeTab === 'food' ? foodDynamicCats : drinkDynamicCats;
    setLocalCategories([...cats].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
    setIsCategoryReorderOpen(true);
  };

  const moveCategoryUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...localCategories];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    setLocalCategories(arr);
  };

  const moveCategoryDown = (idx: number) => {
    if (idx === localCategories.length - 1) return;
    const arr = [...localCategories];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    setLocalCategories(arr);
  };

  // ─── Availability label ───
  const getStatusLabel = (status: string) => {
    if (status === 'available') return { label: 'متوفر', color: 'bg-green-500' };
    if (status === 'out_of_stock') return { label: 'نفذت الكمية', color: 'bg-red-500' };
    if (status === 'coming_soon') return { label: 'قريباً', color: 'bg-blue-500' };
    return { label: 'غير متوفر', color: 'bg-gray-400' };
  };

  // ─── Determine item department ───
  const getItemDept = (item: CoffeeItem): 'drinks' | 'food' => {
    if (LEGACY_FOOD_CATEGORIES.includes(item.category)) return 'food';
    if (LEGACY_DRINK_CATEGORIES.includes(item.category)) return 'drinks';
    const cat = menuCategories.find(c => c.id === item.category);
    return cat?.department || 'drinks';
  };

  // ─── Dropdown cats for add/edit ───
  const getDropdownCats = (dept: 'drinks' | 'food') => getCatsForDept(dept);

  // ─── All cats for edit (item's existing category might be legacy) ───
  const getEditDropdownCats = (item: CoffeeItem) => {
    const dept = getItemDept(item);
    const cats = getDropdownCats(dept);
    const hasCurrentCat = cats.some(c => c.id === item.category);
    if (!hasCurrentCat) {
      return [{ id: item.category, nameAr: getCategoryName(item.category), department: dept, orderIndex: -1 }, ...cats];
    }
    return cats;
  };

  // ─────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4" dir="rtl">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">إدارة المنتجات</h1>
              <p className="text-xs text-gray-500">{coffeeItems.length} منتج</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManageMenu && activeTab !== 'all' && (
              <Button variant="outline" size="sm" onClick={openCategoryReorder} className="hidden sm:flex gap-1.5 text-xs">
                <ListOrdered className="w-3.5 h-3.5" />
                ترتيب الأقسام
              </Button>
            )}
            {canManageMenu && (
              <>
                <Button size="sm" onClick={() => openAddDialog('drinks')}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs">
                  <Coffee className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">إضافة</span> مشروب
                </Button>
                <Button size="sm" onClick={() => openAddDialog('food')}
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 text-xs">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">إضافة</span> أكلة
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => setLocation('/employee/home')}>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4">

        {/* ── Department Tabs ── */}
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          {([
            { id: 'all', label: 'الكل', icon: <Package className="w-4 h-4" /> },
            { id: 'drinks', label: 'مشروبات', icon: <Coffee className="w-4 h-4" /> },
            { id: 'food', label: 'مأكولات', icon: <UtensilsCrossed className="w-4 h-4" /> },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setActiveCategoryFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap border-2 transition-all ${activeTab === tab.id ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-primary/40'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Category Chips ── */}
        {visibleCategoryChips.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${activeCategoryFilter === 'all' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              الكل ({activeTab === 'all' ? coffeeItems.length : (activeTab === 'drinks' ?
                coffeeItems.filter(i => new Set([...drinkDynamicCats.map(c => c.id), ...LEGACY_DRINK_CATEGORIES]).has(i.category)).length :
                coffeeItems.filter(i => new Set([...foodDynamicCats.map(c => c.id), ...LEGACY_FOOD_CATEGORIES]).has(i.category)).length)})
            </button>
            {visibleCategoryChips.map(cat => {
              const count = coffeeItems.filter(i => i.category === cat.id).length;
              return (
                <button key={cat.id} onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${activeCategoryFilter === cat.id ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                  {cat.nameAr} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* ── Search ── */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث عن منتج..." className="pr-10 h-10 bg-white" />
        </div>

        {/* ── Products Grid ── */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">جاري تحميل المنتجات...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">لا توجد منتجات</p>
            {canManageMenu && <p className="text-gray-400 text-sm mt-1">اضغط على "إضافة مشروب" أو "إضافة أكلة" لإضافة منتج</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map(item => {
              const status = getStatusLabel(item.availabilityStatus || 'available');
              const dept = getItemDept(item);
              const recipeCount = getProductRecipeCount(item.id);
              return (
                <Card key={item.id} data-testid={`item-${item.id}`}
                  className={`overflow-hidden border-2 transition-all ${item.isAvailable === 0 ? 'opacity-70 border-gray-200' : 'border-gray-100 hover:border-primary/30 hover:shadow-md'}`}>
                  {/* Image */}
                  <div className="relative">
                    <img
                      src={item.imageUrl ? (item.imageUrl.startsWith('/') ? item.imageUrl : `/${item.imageUrl}`) : getCoffeeImage(item.id)}
                      alt={item.nameAr}
                      className="w-full h-36 object-cover"
                      onError={(e) => { e.currentTarget.src = getCoffeeImage(item.id); }}
                    />
                    <div className="absolute top-2 right-2 flex gap-1 flex-wrap">
                      <Badge className={`${status.color} text-white text-[10px] font-bold`}>{status.label}</Badge>
                      {item.isNewProduct === 1 && <Badge className="bg-yellow-500 text-white text-[10px]"><Sparkles className="w-2.5 h-2.5 ml-0.5" />جديد</Badge>}
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className={`text-[10px] font-bold border-0 ${dept === 'drinks' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {dept === 'drinks' ? '🥤' : '🍽️'} {getCategoryName(item.category)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-3 space-y-2">
                    {/* Name + Price */}
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{item.nameAr}</h3>
                      {item.nameEn && <p className="text-xs text-gray-400 line-clamp-1">{item.nameEn}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-primary font-black text-base">{Number(item.price).toFixed(2)} <SarIcon size={11} /></span>
                        {item.oldPrice && item.oldPrice > 0 && (
                          <span className="text-gray-300 line-through text-xs">{Number(item.oldPrice).toFixed(2)}</span>
                        )}
                      </div>
                    </div>

                    {/* Availability selector */}
                    <select
                      value={item.availabilityStatus || 'available'}
                      onChange={(e) => updateAvailabilityMutation.mutate({ id: item.id, availabilityStatus: e.target.value })}
                      disabled={updateAvailabilityMutation.isPending}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 font-medium"
                      data-testid={`select-status-${item.id}`}
                    >
                      <option value="available">✅ متوفر</option>
                      <option value="out_of_stock">❌ نفذت الكمية</option>
                      <option value="temporarily_unavailable">⏸ غير متوفر مؤقتاً</option>
                      <option value="coming_soon">🔜 قريباً</option>
                    </select>

                    {/* Actions */}
                    {canManageMenu && (
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <Button size="sm" variant="outline" onClick={() => handleOpenRecipeEditor(item)}
                          className={`h-8 text-xs gap-1 ${recipeCount > 0 ? 'border-green-400 text-green-600' : 'border-gray-200 text-gray-500'}`}
                          data-testid={`button-recipe-${item.id}`}>
                          <FlaskConical className="w-3 h-3" />
                          {recipeCount > 0 ? recipeCount : '—'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(item)}
                          className="h-8 text-xs gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                          data-testid={`button-edit-${item.id}`}>
                          <Edit2 className="w-3 h-3" />
                          تعديل
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeletingItemId(item.id)}
                          className="h-8 text-xs gap-1 border-red-200 text-red-500 hover:bg-red-50"
                          data-testid={`button-delete-${item.id}`}>
                          <Trash2 className="w-3 h-3" />
                          حذف
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          ADD PRODUCT DIALOG
      ══════════════════════════════════════════════ */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) { resetAddForm(); setAddStep(1); } }}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {addDepartment === 'drinks' ? <Coffee className="w-5 h-5 text-blue-500" /> : <UtensilsCrossed className="w-5 h-5 text-orange-500" />}
              {addDepartment === 'drinks' ? 'إضافة مشروب جديد' : 'إضافة صنف جديد'}
              <div className="flex items-center gap-1.5 mr-auto text-sm font-normal">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${addStep === 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>1. المعلومات</span>
                <span className="text-gray-300">←</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${addStep === 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>2. الوصفة</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          {addStep === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-4 mt-2">
              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-gray-600 mb-1 block">الاسم بالعربية *</Label>
                  <Input name="nameAr" required placeholder="مثال: كابتشينو" data-testid="input-name-ar"
                    onChange={e => setAiAddNameAr(e.target.value)} className="h-10" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-600 mb-1 flex items-center justify-between">
                    الاسم بالإنجليزية
                    <AIMenuAssistant nameAr={aiAddNameAr} nameEn={aiAddNameEn} category={selectedCategory}
                      existingDescription={aiAddDescription}
                      onInsertNameEn={n => setAiAddNameEn(n)}
                      onInsertDescription={d => setAiAddDescription(d)}
                      onInsertAddons={addons => setAddEditableAddons(prev => [...prev, ...addons.map((a: any) => ({ ...a, imageUrl: '', category: 'other', section: '' }))])}
                      compact />
                  </Label>
                  <Input name="nameEn" value={aiAddNameEn} onChange={e => setAiAddNameEn(e.target.value)}
                    placeholder="e.g. Cappuccino" dir="ltr" className="h-10" data-testid="input-name-en" />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-bold text-gray-600 mb-1 flex items-center justify-between">
                  الوصف *
                  <AIMenuAssistant nameAr={aiAddNameAr} nameEn={aiAddNameEn} category={selectedCategory}
                    existingDescription={aiAddDescription}
                    onInsertDescription={d => setAiAddDescription(d)}
                    onInsertNameEn={n => setAiAddNameEn(n)}
                    onInsertAddons={addons => setAddEditableAddons(prev => [...prev, ...addons.map((a: any) => ({ ...a, imageUrl: '', category: 'other', section: '' }))])}
                    compact />
                </Label>
                <Textarea name="description" required value={aiAddDescription} onChange={e => setAiAddDescription(e.target.value)}
                  placeholder="وصف مختصر للمنتج..." className="min-h-[70px]" data-testid="input-description" />
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-gray-600 mb-1 block">القسم *</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                    <SelectTrigger className="h-10" data-testid="select-category">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDropdownCats(addDepartment).map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nameAr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-600 mb-1 block">السعر (ريال) *</Label>
                  <Input name="price" type="number" step="0.01" min="0" required placeholder="0.00"
                    className="h-10" data-testid="input-price" />
                </div>
              </div>

              {/* Old Price + Coffee Strength (drinks only) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-gray-600 mb-1 block">السعر القديم (اختياري)</Label>
                  <Input name="oldPrice" type="number" step="0.01" min="0" placeholder="0.00" className="h-10" data-testid="input-old-price" />
                </div>
                {addDepartment === 'drinks' && (
                  <div>
                    <Label className="text-xs font-bold text-gray-600 mb-1 block">قوة القهوة</Label>
                    <Select value={selectedCoffeeStrength} onValueChange={setSelectedCoffeeStrength}>
                      <SelectTrigger className="h-10" data-testid="select-coffee-strength">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">خفيفة</SelectItem>
                        <SelectItem value="classic">كلاسيكية</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="strong">قوية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Images */}
              <div>
                <Label className="text-xs font-bold text-gray-600 mb-2 block">صور المنتج (حتى 5 صور)</Label>
                <div className="flex flex-wrap gap-2">
                  {addImageUrls.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20">
                      <img src={url.startsWith('/') ? url : `/${url}`} className="w-full h-full object-cover rounded-xl border" alt="" />
                      <button type="button" onClick={() => setAddImageUrls(addImageUrls.filter((_, i) => i !== idx))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center shadow">
                        <X className="w-3 h-3 text-white" />
                      </button>
                      {idx === 0 && <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-primary/80 text-white rounded-b-xl">رئيسية</span>}
                    </div>
                  ))}
                  {addImageUrls.length < 5 && (
                    <button type="button" onClick={() => { setImageLibraryContext("add"); setIsImageLibraryOpen(true); }}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors">
                      <Plus className="w-5 h-5" />
                      <span className="text-[10px] mt-1">إضافة</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <Label className="text-xs font-bold text-gray-600 mb-2 block">الأحجام المتاحة</Label>
                <div className="space-y-2">
                  {addEditableSizes.map((size, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input type="text" placeholder="اسم الحجم" value={size.nameAr}
                        onChange={e => { const n = [...addEditableSizes]; n[idx].nameAr = e.target.value; setAddEditableSizes(n); }} className="flex-1 h-9 text-sm" data-testid={`input-add-size-name-${idx}`} />
                      <Input type="number" placeholder="السعر" value={size.price}
                        onChange={e => { const n = [...addEditableSizes]; n[idx].price = parseFloat(e.target.value) || 0; setAddEditableSizes(n); }} className="w-24 h-9 text-sm" data-testid={`input-add-size-price-${idx}`} />
                      <Button type="button" size="sm" variant="outline" onClick={() => setAddEditableSizes(addEditableSizes.filter((_, i) => i !== idx))} className="border-red-200 text-red-400 h-9 px-2" data-testid={`button-remove-size-${idx}`}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setAddEditableSizes([...addEditableSizes, { nameAr: '', price: 0 }])} className="w-full mt-2 border-dashed border-gray-300 text-gray-500 h-9" data-testid="button-add-size">
                  <Plus className="w-3.5 h-3.5 ml-1" /> إضافة حجم
                </Button>
              </div>

              {/* Addons */}
              <div>
                <Label className="text-xs font-bold text-gray-600 mb-2 block">الإضافات والخيارات</Label>
                <AddonsEditor addons={addEditableAddons} setAddons={setAddEditableAddons}
                  onOpenImageLibrary={(ctx) => { setImageLibraryContext(ctx as any); setIsImageLibraryOpen(true); }}
                  context="add" setEditingAddonImageIdx={setEditingAddonImageIdx} coffeeItems={coffeeItems} />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
                <Button type="submit" className="bg-primary text-white">التالي: الوصفة ←</Button>
              </div>
            </form>
          ) : (
            /* Step 2: Recipe */
            <div className="space-y-4 mt-2">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                <p className="font-bold">{step1Data?.nameAr}</p>
                <p className="text-xs mt-0.5">السعر: {step1Data?.price} ريال | القسم: {getCategoryName(step1Data?.category || '')}</p>
              </div>

              <div>
                <Label className="text-base font-bold text-gray-700 mb-1 block">اختر مكونات الوصفة</Label>
                <p className="text-sm text-gray-400 mb-3">حدد المواد الخام وكمياتها لحساب التكلفة وخصم المخزون تلقائياً</p>
                {rawItems.filter(r => r.isActive === 1).length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">لا توجد مواد خام. أضفها من إدارة المخزون أولاً.</div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-xl p-2">
                    {rawItems.filter(r => r.isActive === 1).map(raw => {
                      const isSelected = recipeItems.some(s => s.rawItemId === raw.id);
                      const selected = recipeItems.find(s => s.rawItemId === raw.id);
                      return (
                        <div key={raw.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isSelected ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                          <Checkbox id={`ri-${raw.id}`} checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) setRecipeItems([...recipeItems, { rawItemId: raw.id, rawItem: raw, quantity: 10, unit: raw.unit }]);
                              else setRecipeItems(recipeItems.filter(s => s.rawItemId !== raw.id));
                            }} data-testid={`checkbox-recipe-${raw.id}`} />
                          <label htmlFor={`ri-${raw.id}`} className="flex-1 cursor-pointer text-sm text-gray-700">
                            {raw.nameAr} <span className="text-gray-400 text-xs">({raw.unitCost.toFixed(2)} ر.س/{raw.unit})</span>
                          </label>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Input type="number" min="0.1" step="0.1" value={selected?.quantity || 10}
                                onChange={e => setRecipeItems(recipeItems.map(s => s.rawItemId === raw.id ? { ...s, quantity: parseFloat(e.target.value) || 0 } : s))}
                                className="w-20 h-8 text-sm text-center" data-testid={`input-recipe-qty-${raw.id}`} />
                              <Select value={selected?.unit || raw.unit}
                                onValueChange={v => setRecipeItems(recipeItems.map(s => s.rawItemId === raw.id ? { ...s, unit: v } : s))}>
                                <SelectTrigger className="w-20 h-8 text-xs" data-testid={`select-recipe-unit-${raw.id}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="g">جرام</SelectItem>
                                  <SelectItem value="ml">مل</SelectItem>
                                  <SelectItem value="kg">كجم</SelectItem>
                                  <SelectItem value="liter">لتر</SelectItem>
                                  <SelectItem value="piece">قطعة</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {recipeItems.length > 0 && (() => {
                  const { totalCost, breakdown } = calculateRecipeCost(recipeItems);
                  const sp = parseFloat(step1Data?.price || '0');
                  const profit = sp - totalCost;
                  const margin = sp > 0 ? (profit / sp * 100) : 0;
                  return (
                    <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 text-sm space-y-1">
                      {breakdown.map((b, i) => <div key={i} className="flex justify-between text-gray-600"><span>{b.name} ({b.quantity} {b.unit})</span><span>{b.cost.toFixed(2)} ر.س</span></div>)}
                      <div className="border-t border-green-200 pt-2 space-y-1">
                        <div className="flex justify-between font-bold"><span>تكلفة الوصفة</span><span className="text-green-600">{totalCost.toFixed(2)} ر.س</span></div>
                        <div className="flex justify-between"><span>هامش الربح</span><span className={profit >= 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{profit.toFixed(2)} ر.س ({margin.toFixed(0)}%)</span></div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-between gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setAddStep(1)}>← السابق</Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleSkipIngredients}
                    disabled={createItemMutation.isPending} className="text-gray-500" data-testid="button-skip-recipe">
                    تخطي الوصفة
                  </Button>
                  <Button type="button" onClick={handleStep2Submit}
                    disabled={createItemMutation.isPending || recipeItems.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white" data-testid="button-save-with-recipe">
                    {createItemMutation.isPending ? 'جاري الحفظ...' : 'حفظ مع الوصفة'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════
          EDIT DIALOG
      ══════════════════════════════════════════════ */}
      <Dialog open={isEditDialogOpen} onOpenChange={open => { setIsEditDialogOpen(open); if (!open) { setEditingItem(null); setEditImageUrls([]); } }}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-500" />
              تعديل: {editingItem?.nameAr}
            </DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleSubmitEditItem} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-gray-600 mb-1 block">الاسم بالعربية *</Label>
                  <Input name="nameAr" defaultValue={editingItem.nameAr} required className="h-10" data-testid="input-edit-name-ar" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-600 mb-1 flex items-center justify-between">
                    الاسم بالإنجليزية
                    <AIMenuAssistant nameAr={editingItem.nameAr} nameEn={aiEditNameEn} category={editingItem.category}
                      existingDescription={aiEditDescription}
                      onInsertNameEn={n => setAiEditNameEn(n)} onInsertDescription={d => setAiEditDescription(d)}
                      onInsertAddons={addons => setEditableAddons(prev => [...prev, ...addons.map((a: any) => ({ ...a, imageUrl: '', category: 'other', section: '' }))])}
                      compact />
                  </Label>
                  <Input name="nameEn" value={aiEditNameEn} onChange={e => setAiEditNameEn(e.target.value)} dir="ltr" className="h-10" data-testid="input-edit-name-en" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-600 mb-1 block">الوصف *</Label>
                <Textarea name="description" value={aiEditDescription} onChange={e => setAiEditDescription(e.target.value)}
                  required className="min-h-[70px]" data-testid="input-edit-description" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-gray-600 mb-1 block">القسم *</Label>
                  <Select name="category" defaultValue={editingItem.category} required>
                    <SelectTrigger className="h-10" data-testid="select-edit-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {getEditDropdownCats(editingItem).map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nameAr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-600 mb-1 block">السعر (ريال) *</Label>
                  <Input name="price" type="number" step="0.01" min="0" defaultValue={editingItem.price} required className="h-10" data-testid="input-edit-price" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-gray-600 mb-1 block">السعر القديم</Label>
                  <Input name="oldPrice" type="number" step="0.01" min="0" defaultValue={editingItem.oldPrice} className="h-10" data-testid="input-edit-old-price" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-600 mb-1 block">تكلفة الإنتاج</Label>
                  <Input name="costOfGoods" type="number" step="0.01" min="0" defaultValue={editingItem.costOfGoods || 0} className="h-10" data-testid="input-edit-cost-of-goods" />
                </div>
              </div>

              {/* Images */}
              <div>
                <Label className="text-xs font-bold text-gray-600 mb-2 block">صور المنتج (حتى 5 صور)</Label>
                <div className="flex flex-wrap gap-2">
                  {editImageUrls.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16">
                      <img src={url.startsWith('/') ? url : `/${url}`} className="w-full h-full object-cover rounded-xl border" alt="" />
                      <button type="button" onClick={() => setEditImageUrls(editImageUrls.filter((_, i) => i !== idx))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center shadow">
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                      {idx === 0 && <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-primary/80 text-white rounded-b-xl">رئيسية</span>}
                    </div>
                  ))}
                  {editImageUrls.length < 5 && (
                    <button type="button" onClick={() => { setImageLibraryContext("edit"); setIsImageLibraryOpen(true); }}
                      className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors">
                      <Plus className="w-4 h-4" /><span className="text-[9px] mt-0.5">إضافة</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <Label className="text-xs font-bold text-gray-600 mb-2 block">الأحجام المتاحة</Label>
                <div className="space-y-2">
                  {editableSizes.map((size, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input type="text" placeholder="اسم الحجم" value={size.nameAr}
                        onChange={e => { const n = [...editableSizes]; n[idx].nameAr = e.target.value; setEditableSizes(n); }} className="flex-1 h-9 text-sm" data-testid={`input-edit-size-name-${idx}`} />
                      <Input type="number" placeholder="السعر" value={size.price}
                        onChange={e => { const n = [...editableSizes]; n[idx].price = parseFloat(e.target.value) || 0; setEditableSizes(n); }} className="w-24 h-9 text-sm" data-testid={`input-edit-size-price-${idx}`} />
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditableSizes(editableSizes.filter((_, i) => i !== idx))} className="border-red-200 text-red-400 h-9 px-2" data-testid={`button-delete-size-${idx}`}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditableSizes([...editableSizes, {nameAr: '', price: 0}])} className="w-full mt-2 border-dashed border-gray-300 text-gray-500 h-9" data-testid="button-add-edit-size">
                  <Plus className="w-3.5 h-3.5 ml-1" /> إضافة حجم
                </Button>
              </div>

              {/* Addons */}
              <div>
                <Label className="text-xs font-bold text-gray-600 mb-2 block">الإضافات والخيارات</Label>
                <AddonsEditor addons={editableAddons} setAddons={setEditableAddons}
                  onOpenImageLibrary={(ctx) => { setImageLibraryContext(ctx as any); setIsImageLibraryOpen(true); }}
                  context="edit" setEditingAddonImageIdx={setEditingAddonImageIdx} coffeeItems={coffeeItems} />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-edit-cancel">إلغاء</Button>
                <Button type="submit" disabled={updateItemMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-edit-submit">
                  {updateItemMutation.isPending ? 'جاري التحديث...' : 'تحديث المنتج'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════
          RECIPE DIALOG
      ══════════════════════════════════════════════ */}
      <Dialog open={isRecipeDialogOpen} onOpenChange={open => { setIsRecipeDialogOpen(open); if (!open) { setEditingRecipeItem(null); setRecipeItems([]); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <FlaskConical className="w-5 h-5" /> وصفة: {editingRecipeItem?.nameAr}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
              سعر البيع: <strong>{editingRecipeItem?.price} ر.س</strong>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto border rounded-xl p-2">
              {rawItems.filter(r => r.isActive === 1).map(raw => {
                const isSelected = recipeItems.some(s => s.rawItemId === raw.id);
                const selected = recipeItems.find(s => s.rawItemId === raw.id);
                return (
                  <div key={raw.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isSelected ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                    <Checkbox id={`re-${raw.id}`} checked={isSelected}
                      onCheckedChange={checked => {
                        if (checked) setRecipeItems([...recipeItems, { rawItemId: raw.id, rawItem: raw, quantity: 10, unit: raw.unit }]);
                        else setRecipeItems(recipeItems.filter(s => s.rawItemId !== raw.id));
                      }} data-testid={`checkbox-recipe-edit-${raw.id}`} />
                    <label htmlFor={`re-${raw.id}`} className="flex-1 cursor-pointer text-sm text-gray-700">
                      {raw.nameAr} <span className="text-gray-400 text-xs">({raw.unitCost.toFixed(2)} ر.س/{raw.unit})</span>
                    </label>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <Input type="number" min="0.1" step="0.1" value={selected?.quantity || 10}
                          onChange={e => setRecipeItems(recipeItems.map(s => s.rawItemId === raw.id ? { ...s, quantity: parseFloat(e.target.value) || 0 } : s))}
                          className="w-20 h-8 text-sm text-center" data-testid={`input-recipe-qty-${raw.id}`} />
                        <Select value={selected?.unit || raw.unit}
                          onValueChange={v => setRecipeItems(recipeItems.map(s => s.rawItemId === raw.id ? { ...s, unit: v } : s))}>
                          <SelectTrigger className="w-20 h-8 text-xs" data-testid={`select-recipe-unit-${raw.id}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">جرام</SelectItem><SelectItem value="ml">مل</SelectItem>
                            <SelectItem value="kg">كجم</SelectItem><SelectItem value="liter">لتر</SelectItem>
                            <SelectItem value="piece">قطعة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {recipeItems.length > 0 && (() => {
              const { totalCost, breakdown } = calculateRecipeCost(recipeItems);
              const sp = editingRecipeItem?.price ? parseFloat(String(editingRecipeItem.price)) : 0;
              const profit = sp - totalCost; const margin = sp > 0 ? (profit / sp * 100) : 0;
              return (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 text-sm space-y-1">
                  {breakdown.map((b: any, i: number) => <div key={i} className="flex justify-between text-gray-600"><span>{b.name} ({b.quantity} {b.unit})</span><span>{b.cost.toFixed(2)} ر.س</span></div>)}
                  <div className="border-t border-green-200 pt-2 space-y-1">
                    <div className="flex justify-between font-bold"><span>تكلفة الوصفة</span><span className="text-green-600">{totalCost.toFixed(2)} ر.س</span></div>
                    <div className="flex justify-between font-bold"><span>هامش الربح</span><span className={profit >= 0 ? 'text-green-600' : 'text-red-500'}>{profit.toFixed(2)} ر.س ({margin.toFixed(0)}%)</span></div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsRecipeDialogOpen(false)} data-testid="button-recipe-cancel">إلغاء</Button>
              <Button type="button" onClick={handleSaveRecipe}
                disabled={bulkRecipeMutation.isPending || recipeItems.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white" data-testid="button-recipe-save">
                {bulkRecipeMutation.isPending ? 'جاري الحفظ...' : 'حفظ الوصفة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingItemId && deleteItemMutation.mutate(deletingItemId)}
              disabled={deleteItemMutation.isPending} className="bg-red-500 hover:bg-red-600 text-white" data-testid="button-delete-confirm">
              {deleteItemMutation.isPending ? 'جاري الحذف...' : 'حذف نهائياً'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Skip Recipe Confirm */}
      <AlertDialog open={skipRecipeConfirmOpen} onOpenChange={setSkipRecipeConfirmOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600"><AlertTriangle className="w-5 h-5" />إنشاء بدون وصفة</AlertDialogTitle>
            <AlertDialogDescription>
              بدون وصفة: لن يتم خصم المخزون تلقائياً، ولن يمكن حساب التكلفة. يمكنك إضافة الوصفة لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-skip-recipe-cancel">رجوع لإضافة الوصفة</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setSkipRecipeConfirmOpen(false); createItemMutation.mutate({ itemData: buildItemData(step1Data, false), ingredientsList: [], recipeList: [] }); }}
              className="bg-primary text-white" data-testid="button-skip-recipe-confirm">
              إنشاء بدون وصفة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Reorder */}
      <Dialog open={isCategoryReorderOpen} onOpenChange={setIsCategoryReorderOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ListOrdered className="w-5 h-5 text-primary" />ترتيب الأقسام</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 my-2">
            {localCategories.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">لا توجد أقسام مخصصة لهذا القسم</p>
            ) : localCategories.map((cat, idx) => (
              <div key={cat.id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5" data-testid={`category-row-${cat.id}`}>
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                <span className="flex-1 text-sm font-medium">{cat.nameAr}</span>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveCategoryUp(idx)} disabled={idx === 0} className="p-1 rounded hover:bg-primary/10 disabled:opacity-25 text-primary" data-testid={`btn-cat-up-${cat.id}`}><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => moveCategoryDown(idx)} disabled={idx === localCategories.length - 1} className="p-1 rounded hover:bg-primary/10 disabled:opacity-25 text-primary" data-testid={`btn-cat-down-${cat.id}`}><ChevronDown className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button variant="outline" onClick={() => setIsCategoryReorderOpen(false)} data-testid="btn-cat-reorder-cancel">إلغاء</Button>
            <Button onClick={() => reorderCategoriesMutation.mutate(localCategories.map((c, i) => ({ id: c.id, orderIndex: i })))}
              disabled={reorderCategoriesMutation.isPending || localCategories.length === 0}
              className="bg-primary text-white" data-testid="btn-cat-reorder-save">
              {reorderCategoriesMutation.isPending ? 'جاري الحفظ...' : 'حفظ الترتيب'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Library */}
      <ImageLibraryModal
        open={isImageLibraryOpen}
        onClose={() => setIsImageLibraryOpen(false)}
        onSelect={(url) => {
          if (imageLibraryContext === "add") {
            setAddImageUrls(prev => prev.length < 5 ? [...prev, url] : prev);
          } else if (imageLibraryContext === "edit") {
            setEditImageUrls(prev => prev.length < 5 ? [...prev, url] : prev);
          } else if (imageLibraryContext === "add-addon" && editingAddonImageIdx >= 0) {
            setAddEditableAddons(prev => prev.map((a, i) => i === editingAddonImageIdx ? { ...a, imageUrl: url } : a));
          } else if (imageLibraryContext === "edit-addon" && editingAddonImageIdx >= 0) {
            setEditableAddons(prev => prev.map((a, i) => i === editingAddonImageIdx ? { ...a, imageUrl: url } : a));
          }
          setIsImageLibraryOpen(false);
        }}
      />

      <MobileBottomNav employeeRole={employee?.role} />
    </div>
  );
}
