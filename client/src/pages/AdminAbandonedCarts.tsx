import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingCart, Phone, Mail, Tag, ChevronDown, ChevronUp, MessageCircle, AlertCircle, Send, X, Check, Loader2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

type CartItem = { _id: string; name: string; price: number; qty: number; type?: string; imageUrl?: string };
type AbandonedCart = {
  cartId: string;
  updatedAt: string;
  itemsCount: number;
  total: number;
  items: CartItem[];
  client: { id: string; name: string; email: string; phone: string; whatsapp: string; hasContact: boolean };
};

function formatDate(d: string) {
  const dt = new Date(d);
  const now = Date.now();
  const diff = now - dt.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `منذ ${days} يوم`;
  if (hrs > 0) return `منذ ${hrs} ساعة`;
  if (mins > 0) return `منذ ${mins} دقيقة`;
  return "الآن";
}

function EmailModal({ cart, onClose }: { cart: AbandonedCart; onClose: () => void }) {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [subject, setSubject] = useState("نرحب بعودتك — أكمل طلبك الآن");
  const [message, setMessage] = useState(`مرحباً ${cart.client.name}،\n\nلاحظنا أن لديك منتجات في عربة التسوق الخاصة بك. نحن هنا لمساعدتك في إتمام طلبك.\n\nهل تحتاج مساعدة؟ تواصل معنا في أي وقت.\n\nمع تحيات فريق QIROX`);
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/employee/cart-send-email", {
        clientEmail: cart.client.email,
        clientName: cart.client.name,
        subject,
        message,
      });
      if (!res.ok) throw new Error(L ? "فشل إرسال البريد" : "Failed to send email");
    },
    onSuccess: () => { toast({ title: L ? "✓ تم إرسال البريد بنجاح" : "✓ Email sent successfully" }); onClose(); },
    onError: () => toast({ title: L ? "فشل إرسال البريد" : "Email send failed", variant: "destructive" }),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir={dir}>
      <div className="bg-[#131c2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <h3 className="font-black text-white">{L ? "إرسال بريد إلكتروني" : "Send Email"}</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">{L ? "إلى" : "To"}: <span className="text-blue-400">{cart.client.email}</span></label>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">{L ? "موضوع البريد" : "Subject"}</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">{L ? "نص الرسالة" : "Message"}</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 resize-none" />
          </div>
        </div>
        <div className="p-5 border-t border-white/10 flex gap-3">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex-1 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> {L ? "إرسال" : "Send"}</>}
          </button>
          <button onClick={onClose} className="px-5 h-11 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-sm transition-colors">{L ? "إلغاء" : "Cancel"}</button>
        </div>
      </div>
    </div>
  );
}

function DiscountModal({ cart, onClose }: { cart: AbandonedCart; onClose: () => void }) {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [percent, setPercent] = useState("15");
  const [note, setNote] = useState("");
  const [generated, setGenerated] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/employee/cart-send-discount", {
        clientEmail: cart.client.email,
        clientName: cart.client.name,
        discountPercent: Number(percent),
        note,
      });
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    onSuccess: (d) => { setGenerated(d.code); toast({ title: `✓ ${L ? "تم إرسال كود الخصم" : "Discount code sent"}: ${d.code}` }); },
    onError: () => toast({ title: L ? "فشل إنشاء الكود" : "Failed to create code", variant: "destructive" }),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir={dir}>
      <div className="bg-[#131c2e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-green-400" />
            <h3 className="font-black text-white">{L ? "إرسال كود خصم خاص" : "Send Special Discount Code"}</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {generated ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-white/60 text-sm mb-3">{L ? "تم إرسال كود الخصم إلى" : "Discount code sent to"} {cart.client.email}</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-2xl font-black text-green-400 tracking-widest">{generated}</div>
            <p className="text-white/30 text-xs mt-3">{L ? "صالح لمدة 7 أيام — استخدام واحد فقط" : "Valid for 7 days — one use only"}</p>
            <button onClick={onClose} className="mt-5 w-full h-11 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-sm transition-colors">{L ? "إغلاق" : "Close"}</button>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">{L ? "إلى" : "To"}: <span className="text-green-400">{cart.client.email}</span></label>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-2 block">{L ? "نسبة الخصم" : "Discount Percentage"}</label>
                <div className="grid grid-cols-4 gap-2">
                  {["10", "15", "20", "25"].map(p => (
                    <button key={p} onClick={() => setPercent(p)} className={`h-10 rounded-xl text-sm font-bold transition-colors ${percent === p ? "bg-green-600 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>{p}%</button>
                  ))}
                </div>
                <input type="number" min="1" max="80" value={percent} onChange={e => setPercent(e.target.value)} className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" placeholder={L ? "أو أدخل نسبة مخصصة" : "Or enter a custom percentage"} />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">{L ? "ملاحظة للعميل (اختياري)" : "Note to client (optional)"}</label>
                <input value={note} onChange={e => setNote(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50" placeholder={L ? "مثال: هدية مني شخصياً..." : "e.g. A personal gift from me..."} />
              </div>
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 text-xs text-white/40">
                {L ? "سيُنشأ كود خصم فريد يُرسل مباشرة إلى بريد العميل، صالح 7 أيام للاستخدام مرة واحدة فقط." : "A unique discount code will be created and sent directly to the client's email, valid for 7 days, one use only."}
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex-1 h-11 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Tag className="w-4 h-4" /> {L ? "إنشاء وإرسال" : "Create & Send"}</>}
              </button>
              <button onClick={onClose} className="px-5 h-11 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-sm transition-colors">{L ? "إلغاء" : "Cancel"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CartRow({ cart }: { cart: AbandonedCart }) {
  const { lang } = useI18n();
  const L = lang === "ar";
  const [expanded, setExpanded] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [discountModal, setDiscountModal] = useState(false);

  const whatsappLink = cart.client.whatsapp
    ? `https://wa.me/${cart.client.whatsapp.replace(/\D/g, "")}`
    : null;
  const phoneLink = cart.client.phone ? `tel:${cart.client.phone}` : null;

  return (
    <>
      {emailModal && <EmailModal cart={cart} onClose={() => setEmailModal(false)} />}
      {discountModal && <DiscountModal cart={cart} onClose={() => setDiscountModal(false)} />}

      <div className="bg-[#131c2e] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-white/15 transition-colors">
        <div className="p-4 md:p-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white/40" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-white text-sm">{cart.client.name}</p>
                  {cart.client.email && <p className="text-xs text-white/40 mt-0.5 truncate">{cart.client.email}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-white/30">{formatDate(cart.updatedAt)}</span>
                  {!cart.client.hasContact && (
                    <span className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full px-2 py-0.5">
                      <AlertCircle className="w-3 h-3" /> {L ? "بلا تواصل" : "No contact"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{cart.itemsCount} {L ? (cart.itemsCount === 1 ? "منتج" : "منتجات") : (cart.itemsCount === 1 ? "item" : "items")}</span>
                </div>
                <div className="text-xs font-bold text-blue-400">
                  {cart.total.toLocaleString("ar-SA")} ر.س
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {whatsappLink && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-semibold transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {L ? "واتساب" : "WhatsApp"}
                  </a>
                )}
                {phoneLink && (
                  <a href={phoneLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    {cart.client.phone}
                  </a>
                )}
                {cart.client.email && (
                  <button onClick={() => setEmailModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 rounded-lg text-xs font-semibold transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                    {L ? "بريد خاص" : "Private Email"}
                  </button>
                )}
                {cart.client.email && (
                  <button onClick={() => setDiscountModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-xs font-semibold transition-colors">
                    <Tag className="w-3.5 h-3.5" />
                    {L ? "خصم خاص" : "Special Discount"}
                  </button>
                )}
                <button onClick={() => setExpanded(p => !p)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/40 rounded-lg text-xs transition-colors mr-auto">
                  {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> {L ? "إخفاء" : "Hide"}</> : <><ChevronDown className="w-3.5 h-3.5" /> {L ? "المنتجات" : "Items"}</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
            {cart.items.map((item, idx) => (
              <div key={item._id || idx} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover bg-white/10 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 text-white/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.name || (L ? "منتج" : "Product")}</p>
                  {item.type && <p className="text-[10px] text-white/30">{item.type}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white/80">{(item.price || 0).toLocaleString("ar-SA")} ر.س</p>
                  <p className="text-[10px] text-white/30">× {item.qty || 1}</p>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-white/40">{L ? "الإجمالي" : "Total"}</span>
              <span className="text-sm font-black text-blue-400">{cart.total.toLocaleString("ar-SA")} ر.س</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminAbandonedCarts() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const { data: carts = [], isLoading, refetch } = useQuery<AbandonedCart[]>({
    queryKey: ["/api/employee/abandoned-carts"],
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "contact" | "no-contact">("all");

  const filtered = carts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.client.name.toLowerCase().includes(q) || c.client.email.toLowerCase().includes(q) || c.client.phone.includes(q);
    const matchFilter = filter === "all" || (filter === "contact" && c.client.hasContact) || (filter === "no-contact" && !c.client.hasContact);
    return matchSearch && matchFilter;
  });

  const totalValue = filtered.reduce((s, c) => s + c.total, 0);
  const withContact = carts.filter(c => c.client.hasContact).length;

  return (
    <div className="min-h-screen bg-[#0c1322] p-4 md:p-6" dir={dir}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-400" />
            {L ? "عربات التسوق النشطة" : "Active Shopping Carts"}
          </h1>
          <p className="text-white/40 text-sm mt-1">{L ? "متابعة العملاء الذين لديهم منتجات في عرباتهم" : "Track clients who have items in their carts"}</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 rounded-xl text-sm transition-colors">
          {L ? "تحديث" : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: L ? "إجمالي العربات" : "Total Carts", value: carts.length, color: "text-white" },
          { label: L ? "يمكن التواصل معهم" : "Contactable", value: withContact, color: "text-green-400" },
          { label: L ? "قيمة العربات" : "Cart Value", value: totalValue.toLocaleString(L ? "ar-SA" : "en-US"), color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="bg-[#131c2e] border border-white/[0.08] rounded-2xl p-4 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-white/40 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={L ? "بحث بالاسم أو البريد أو الهاتف..." : "Search by name, email or phone..."}
          className="flex-1 min-w-[200px] bg-[#131c2e] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
        />
        <div className="flex gap-2">
          {(["all", "contact", "no-contact"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-[#131c2e] border border-white/[0.08] text-white/50 hover:text-white"}`}>
              {f === "all" ? (L ? "الكل" : "All") : f === "contact" ? (L ? "يمكن التواصل" : "Contactable") : (L ? "بلا تواصل" : "No Contact")}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{L ? `لا توجد عربات ${search ? "تطابق البحث" : "نشطة حالياً"}` : `No carts ${search ? "match the search" : "currently active"}`}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => <CartRow key={c.cartId} cart={c} />)}
        </div>
      )}
    </div>
  );
}
