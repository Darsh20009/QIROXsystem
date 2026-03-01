import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ShoppingCart, Star, Package, Cpu, Globe, Mail, Server, Gift, Code2, ChevronLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState } from "react";
import type { QiroxProduct } from "@shared/schema";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const categoryConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  device: { label: "أجهزة", icon: Cpu, color: "text-blue-600", bg: "bg-blue-50" },
  hosting: { label: "استضافة", icon: Server, color: "text-purple-600", bg: "bg-purple-50" },
  domain: { label: "دومين", icon: Globe, color: "text-green-600", bg: "bg-green-50" },
  email: { label: "بريد إلكتروني", icon: Mail, color: "text-orange-600", bg: "bg-orange-50" },
  gift: { label: "هدايا", icon: Gift, color: "text-pink-600", bg: "bg-pink-50" },
  software: { label: "برمجيات", icon: Code2, color: "text-indigo-600", bg: "bg-indigo-50" },
  other: { label: "أخرى", icon: Package, color: "text-gray-600", bg: "bg-gray-50" },
};

export default function Devices() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const { data: products, isLoading } = useQuery<QiroxProduct[]>({
    queryKey: ["/api/products"],
  });

  const addToCartMutation = useMutation({
    mutationFn: async (product: QiroxProduct) => {
      const res = await apiRequest("POST", "/api/cart/items", {
        type: product.category === 'domain' ? 'domain' : product.category === 'email' ? 'email' : product.category === 'hosting' ? 'hosting' : product.category === 'gift' ? 'gift' : 'product',
        refId: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        qty: 1,
        imageUrl: product.images?.[0],
        config: product.specs,
      });
      return res.json();
    },
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setAddedIds(prev => new Set([...prev, product.id]));
      toast({ title: `✓ تمت إضافة "${product.nameAr}" للسلة` });
      setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(product.id); return s; }), 3000);
    },
    onError: () => toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" }),
  });

  const filtered = products?.filter(p => {
    const matchSearch = !search || p.nameAr?.includes(search) || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  }) || [];

  const featured = filtered.filter(p => p.featured);
  const regular = filtered.filter(p => !p.featured);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      {/* Hero */}
      <section className="pt-36 pb-16 relative overflow-hidden">
        <PageGraphics variant="minimal" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
              <Package className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">متجر Qirox</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-heading text-black mb-4 tracking-tight">
              الأجهزة والإضافات
            </h1>
            <p className="text-black/40 text-lg max-w-2xl mx-auto">
              كل ما تحتاجه لإطلاق مشروعك الرقمي — أجهزة، استضافة، دومين، بريد احترافي، وأكثر
            </p>
          </motion.div>

          {/* Category Pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap justify-center gap-2 mb-8">
            {[{ key: "all", label: "الكل", icon: Package }].concat(
              Object.entries(categoryConfig).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon }))
            ).map(cat => {
              const Icon = cat.icon;
              const catCfg = cat.key !== "all" ? categoryConfig[cat.key] : null;
              const count = cat.key === "all" ? products?.length : products?.filter(p => p.category === cat.key).length;
              if (cat.key !== "all" && count === 0) return null;
              return (
                <button
                  key={cat.key}
                  onClick={() => setFilterCat(cat.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${filterCat === cat.key ? 'bg-black text-white border-black' : 'bg-white text-black/60 border-black/[0.08] hover:border-black/20'}`}
                  data-testid={`filter-cat-${cat.key}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                  {count !== undefined && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filterCat === cat.key ? 'bg-white/20' : 'bg-black/[0.05]'}`}>{count}</span>}
                </button>
              );
            })}
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="pr-11 h-12 rounded-2xl border-black/[0.08] bg-white shadow-sm text-sm"
                data-testid="input-product-search"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-black/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto mb-4 text-black/10" />
            <p className="text-black/30 text-sm">لا توجد منتجات في هذه الفئة</p>
          </div>
        ) : (
          <>
            {/* Featured Products */}
            {featured.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-4 h-4 text-black/40" />
                  <h2 className="text-sm font-bold text-black/60 uppercase tracking-wider">المنتجات المميزة</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} user={user} addedIds={addedIds} onAdd={() => addToCartMutation.mutate(p)} isPending={addToCartMutation.isPending} />)}
                </div>
              </div>
            )}
            {/* Regular Products */}
            {regular.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <div className="flex items-center gap-2 mb-6">
                    <Package className="w-4 h-4 text-black/40" />
                    <h2 className="text-sm font-bold text-black/60 uppercase tracking-wider">جميع المنتجات</h2>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {regular.map((p, i) => <ProductCard key={p.id} product={p} index={i} user={user} addedIds={addedIds} onAdd={() => addToCartMutation.mutate(p)} isPending={addToCartMutation.isPending} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* CTA if not logged in */}
        {!user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-16 bg-black rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div>
              <h3 className="text-xl font-bold mb-2">أضف المنتجات لسلتك</h3>
              <p className="text-white/50 text-sm">سجل دخولك لإضافة المنتجات لسلتك ومتابعة طلبك بسهولة</p>
            </div>
            <Link href="/login">
              <Button className="bg-white text-black hover:bg-white/90 font-bold px-8 h-11 rounded-xl shrink-0">
                تسجيل الدخول
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            </Link>
          </motion.div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function ProductCard({ product: p, index, user, addedIds, onAdd, isPending }: {
  product: QiroxProduct; index: number; user: any; addedIds: Set<string>; onAdd: () => void; isPending: boolean;
}) {
  const cfg = categoryConfig[p.category] || categoryConfig.other;
  const Icon = cfg.icon;
  const isAdded = addedIds.has(p.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
      data-testid={`device-card-${p.id}`}
    >
      <div className="relative h-48 bg-gradient-to-br from-black/[0.02] to-black/[0.04] flex items-center justify-center overflow-hidden">
        {p.images?.[0] ? (
          <img src={p.images[0]} alt={p.nameAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${cfg.bg}`}>
            <Icon className={`w-8 h-8 ${cfg.color}`} />
          </div>
        )}
        {p.badge && (
          <div className="absolute top-3 right-3 bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {p.badge}
          </div>
        )}
        <div className={`absolute top-3 left-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-sm text-black mb-1">{p.nameAr}</h3>
        {p.descriptionAr && <p className="text-[11px] text-black/40 line-clamp-2 mb-3">{p.descriptionAr}</p>}
        {p.specs && Object.keys(p.specs).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {Object.entries(p.specs).map(([k, v]) => (
              <span key={k} className="text-[9px] bg-black/[0.03] border border-black/[0.05] px-2 py-0.5 rounded-full text-black/50 font-medium">
                {k}: {String(v)}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/[0.05]">
          <div>
            <p className="text-xl font-black text-black leading-tight">{p.price.toLocaleString()}</p>
            <p className="text-[10px] text-black/35">{p.currency} — {p.stock === -1 ? "متوفر" : `${p.stock} وحدة`}</p>
          </div>
          {user ? (
            <Button
              size="sm"
              onClick={onAdd}
              disabled={isPending || isAdded}
              className={`rounded-xl text-xs h-9 px-4 transition-all ${isAdded ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-black text-white hover:bg-black/80'}`}
              data-testid={`button-add-to-cart-${p.id}`}
            >
              {isAdded ? (
                <><CheckCircle className="w-3.5 h-3.5 ml-1" /> أُضيف</>
              ) : (
                <><ShoppingCart className="w-3.5 h-3.5 ml-1" /> أضف للسلة</>
              )}
            </Button>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline" className="rounded-xl text-xs h-9 px-4">
                دخول للشراء
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
