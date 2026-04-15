import { useState, useRef } from "react";
import { brand as sysConfig } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lock, Shield, ArrowLeft, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SimulatedCardPaymentProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

type CardBrand = "visa" | "mastercard" | "mada" | "amex" | "unknown";
type PayStep = "form" | "processing" | "success";
type ActiveField = "number" | "name" | "expiry" | "cvv" | null;

function detectCardBrand(num: string): CardBrand {
  const n = num.replace(/\D/g, "");
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^4/.test(n)) {
    const prefix6 = parseInt(n.substring(0, 6) || "0");
    const madaPrefixes = [427415, 427672, 428331, 440533, 440647, 440795, 440981, 441082, 445564, 446393, 446404, 446672, 448536, 448609, 448660, 455708, 457865, 458456, 462220, 468540, 468541, 468542, 468543, 417633, 446393];
    if (madaPrefixes.some(p => prefix6 === p) || (prefix6 >= 446200 && prefix6 <= 446204)) return "mada";
    return "visa";
  }
  return "unknown";
}

function CardBrandLogo({ brand }: { brand: CardBrand }) {
  if (brand === "visa") return (
    <div className="bg-white/90 rounded px-2 py-0.5 shadow-sm">
      <span className="text-blue-800 font-black text-sm italic tracking-tighter">VISA</span>
    </div>
  );
  if (brand === "mastercard") return (
    <div className="flex items-center">
      <div className="w-6 h-6 rounded-full bg-red-500 opacity-90 shadow-sm" />
      <div className="w-6 h-6 rounded-full bg-yellow-400 opacity-90 -ml-3 shadow-sm" />
    </div>
  );
  if (brand === "mada") return (
    <div className="bg-white/90 rounded px-2 py-0.5 shadow-sm">
      <span className="text-green-700 font-black text-sm tracking-tight">mada</span>
    </div>
  );
  if (brand === "amex") return (
    <div className="bg-white/90 rounded px-2 py-0.5 shadow-sm">
      <span className="text-blue-600 font-black text-xs tracking-tight">AMEX</span>
    </div>
  );
  return null;
}

function formatCardNumber(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

const CARD_GRADIENTS: Record<CardBrand, string> = {
  mastercard: "from-[#1a1a1a] via-[#2a2a2a] to-[#0d0d0d]",
  visa: "from-[#1A1F71] via-[#243299] to-[#0d1255]",
  mada: "from-[#006c35] via-[#008a45] to-[#004d26]",
  amex: "from-[#2c6b5a] via-[#3d8a72] to-[#1a4d3f]",
  unknown: "from-[#1c2340] via-[#2a3460] to-[#0f1429]",
};

export default function SimulatedCardPayment({ amount, onSuccess, onCancel }: SimulatedCardPaymentProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [step, setStep] = useState<PayStep>("form");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const numberInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const expiryInputRef = useRef<HTMLInputElement>(null);
  const cvvInputRef = useRef<HTMLInputElement>(null);

  const brand = detectCardBrand(cardNumber);
  const gradient = CARD_GRADIENTS[brand];

  const validate = () => {
    const e: Record<string, string> = {};
    const num = cardNumber.replace(/\s/g, "");
    if (num.length < 16) e.number = "رقم البطاقة غير مكتمل";
    if (!cardName.trim() || cardName.trim().length < 3) e.name = "اكتب اسمك كما هو على البطاقة";
    const [m, y] = expiry.split("/");
    if (!m || !y || parseInt(m) < 1 || parseInt(m) > 12) {
      e.expiry = "تاريخ انتهاء غير صحيح";
    } else {
      const now = new Date();
      const expYear = 2000 + parseInt(y);
      if (expYear < now.getFullYear() || (expYear === now.getFullYear() && parseInt(m) < now.getMonth() + 1)) {
        e.expiry = "البطاقة منتهية الصلاحية";
      }
    }
    if (cvv.length < 3) e.cvv = "رمز CVV غير صحيح";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    setActiveField(null);
    setIsFlipped(false);
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      setTimeout(() => onSuccess(), 1800);
    }, 2800);
  };

  const focusField = (field: ActiveField) => {
    setActiveField(field);
    if (field === "cvv") {
      setIsFlipped(true);
      setTimeout(() => cvvInputRef.current?.focus(), 50);
    } else {
      setIsFlipped(false);
      setTimeout(() => {
        if (field === "number") numberInputRef.current?.focus();
        else if (field === "name") nameInputRef.current?.focus();
        else if (field === "expiry") expiryInputRef.current?.focus();
      }, 50);
    }
  };

  const displayNumber = cardNumber
    ? cardNumber.padEnd(19, " ").replace(/ /g, "•").split("").map((c, i) =>
        [4, 9, 14].includes(i) ? " " : c
      ).join("")
    : "•••• •••• •••• ••••";

  if (step === "processing") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-14 space-y-6"
        data-testid="card-processing-screen"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-bold">جاري معالجة الدفع...</p>
          <p className="text-sm text-muted-foreground">الرجاء الانتظار</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-4 py-2">
          <Shield className="w-3.5 h-3.5 text-green-600" />
          دفع آمن 256-bit SSL
        </div>
      </motion.div>
    );
  }

  if (step === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="flex flex-col items-center justify-center py-12 space-y-5"
        data-testid="card-success-screen"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>
        <div className="text-center space-y-1">
          <p className="text-xl font-black">تمّ الدفع بنجاح!</p>
          <p className="text-sm text-muted-foreground">
            تم خصم <span className="font-bold text-primary">{amount.toFixed(2)} ر.س</span>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl" data-testid="simulated-card-payment">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">بيانات البطاقة البنكية</h3>
        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
          <Shield className="w-3 h-3" />
          دفع آمن
        </div>
      </div>

      {/* ── Card Visual ── */}
      <div className="relative" style={{ perspective: "1200px" }} data-testid="card-visual">
        <motion.div
          className="relative w-full"
          style={{ aspectRatio: "1.586", transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.55, type: "spring", stiffness: 130, damping: 20 }}
        >
          {/* ── FRONT ── */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} shadow-2xl overflow-hidden`}
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* background shimmer */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 0%, transparent 60%)" }} />

            {/* top row */}
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
              <Wifi className="w-5 h-5 text-white/50 rotate-90" />
              <CardBrandLogo brand={brand} />
            </div>

            {/* chip */}
            <div className="absolute top-16 right-5 w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-inner opacity-85">
              <div className="absolute inset-0 grid grid-cols-3 gap-0.5 p-0.5 opacity-40">
                {Array.from({length:9}).map((_,i) => <div key={i} className="bg-yellow-600 rounded-sm" />)}
              </div>
            </div>

            {/* card number — clickable to edit */}
            <button
              type="button"
              className={`absolute bottom-16 left-5 right-5 text-left transition-all`}
              onClick={() => focusField("number")}
              data-testid="card-field-number"
            >
              <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5 text-right">رقم البطاقة</p>
              <p className={`text-white font-mono tracking-[0.2em] font-bold text-right transition-all ${
                activeField === "number" ? "text-yellow-300 text-base" : "text-sm sm:text-base"
              }`}>
                {cardNumber
                  ? cardNumber.padEnd(16, "•").replace(/(.{4})/g, "$1 ").trim()
                  : "•••• •••• •••• ••••"}
              </p>
              {activeField === "number" && (
                <div className="mt-1 h-0.5 bg-yellow-400/70 rounded-full w-full" />
              )}
            </button>

            {/* bottom row — name + expiry */}
            <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end">
              <button
                type="button"
                className="text-right flex-1 min-w-0"
                onClick={() => focusField("name")}
                data-testid="card-field-name"
              >
                <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">حامل البطاقة</p>
                <p className={`text-white font-bold text-xs truncate transition-all ${
                  activeField === "name" ? "text-yellow-300" : ""
                }`}>
                  {cardName || "CARDHOLDER NAME"}
                </p>
                {activeField === "name" && (
                  <div className="mt-0.5 h-0.5 bg-yellow-400/70 rounded-full" />
                )}
              </button>

              <button
                type="button"
                className="text-left ml-4 shrink-0"
                onClick={() => focusField("expiry")}
                data-testid="card-field-expiry"
              >
                <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">صالحة حتى</p>
                <p className={`text-white font-bold text-xs transition-all ${
                  activeField === "expiry" ? "text-yellow-300" : ""
                }`}>
                  {expiry || "MM/YY"}
                </p>
                {activeField === "expiry" && (
                  <div className="mt-0.5 h-0.5 bg-yellow-400/70 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* ── BACK ── */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} shadow-2xl overflow-hidden`}
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="absolute top-10 left-0 right-0 h-10 bg-black/60" />
            <div className="absolute top-[88px] left-5 right-5">
              <div className="bg-white/90 rounded h-9 flex items-center justify-end px-3 gap-3">
                <div className="flex-1 h-3 bg-gray-300/60 rounded-full" />
                <button
                  type="button"
                  className="font-mono font-bold text-gray-800 text-sm min-w-[40px] text-left"
                  onClick={() => focusField("cvv")}
                  data-testid="card-field-cvv"
                >
                  {cvv ? "•".repeat(cvv.length) : "CVV"}
                </button>
              </div>
              <p className="text-white/50 text-[10px] text-center mt-1">اضغط لإدخال رمز CVV</p>
            </div>
            <div className="absolute bottom-4 left-5 right-5 flex justify-between items-center">
              <p className="text-white/30 text-[9px]">{sysConfig.nameEn}</p>
              <CardBrandLogo brand={brand} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Hidden Inputs (triggered by tapping fields on card) ── */}
      <AnimatePresence mode="wait">
        {activeField && (
          <motion.div
            key={activeField}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 space-y-1"
          >
            {activeField === "number" && (
              <>
                <p className="text-xs font-medium text-primary">رقم البطاقة</p>
                <input
                  ref={numberInputRef}
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  onBlur={() => setActiveField(null)}
                  placeholder="•••• •••• •••• ••••"
                  maxLength={19}
                  inputMode="numeric"
                  dir="ltr"
                  className="w-full bg-transparent font-mono tracking-widest text-lg font-bold outline-none text-foreground placeholder:text-muted-foreground/50"
                  data-testid="input-card-number"
                  autoFocus
                />
                {errors.number && <p className="text-xs text-destructive">{errors.number}</p>}
              </>
            )}
            {activeField === "name" && (
              <>
                <p className="text-xs font-medium text-primary">اسم حامل البطاقة</p>
                <input
                  ref={nameInputRef}
                  value={cardName}
                  onChange={e => setCardName(e.target.value.toUpperCase())}
                  onBlur={() => setActiveField(null)}
                  placeholder="FULL NAME"
                  dir="ltr"
                  className="w-full bg-transparent uppercase tracking-wide text-lg font-bold outline-none text-foreground placeholder:text-muted-foreground/50"
                  data-testid="input-card-name"
                  autoFocus
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </>
            )}
            {activeField === "expiry" && (
              <>
                <p className="text-xs font-medium text-primary">تاريخ الانتهاء</p>
                <input
                  ref={expiryInputRef}
                  value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  onBlur={() => setActiveField(null)}
                  placeholder="MM/YY"
                  maxLength={5}
                  inputMode="numeric"
                  dir="ltr"
                  className="w-full bg-transparent font-mono text-lg font-bold outline-none text-foreground placeholder:text-muted-foreground/50"
                  data-testid="input-card-expiry"
                  autoFocus
                />
                {errors.expiry && <p className="text-xs text-destructive">{errors.expiry}</p>}
              </>
            )}
            {activeField === "cvv" && (
              <>
                <p className="text-xs font-medium text-primary">رمز CVV</p>
                <input
                  ref={cvvInputRef}
                  value={cvv}
                  onChange={e => {
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 4));
                  }}
                  onBlur={() => { setActiveField(null); setIsFlipped(false); }}
                  placeholder="•••"
                  maxLength={4}
                  inputMode="numeric"
                  type="password"
                  dir="ltr"
                  className="w-full bg-transparent font-mono text-lg font-bold outline-none text-foreground placeholder:text-muted-foreground/50"
                  data-testid="input-card-cvv"
                  autoFocus
                />
                {errors.cvv && <p className="text-xs text-destructive">{errors.cvv}</p>}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint — show instructions when no field active */}
      {!activeField && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-muted-foreground"
        >
          اضغط على أي حقل في البطاقة لإدخال بياناتك
        </motion.p>
      )}

      {/* Accepted cards */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/40 rounded-xl px-4 py-2.5">
        <span>البطاقات المقبولة:</span>
        <div className="flex items-center gap-2">
          <div className="bg-white border rounded px-1.5 py-0.5 shadow-sm">
            <span className="text-green-700 font-black text-[11px]">mada</span>
          </div>
          <div className="bg-white border rounded px-1.5 py-0.5 shadow-sm">
            <span className="text-blue-800 font-black text-[11px] italic">VISA</span>
          </div>
          <div className="flex bg-white border rounded px-1 py-0.5 gap-0.5 items-center shadow-sm">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
            <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 -ml-1.5" />
          </div>
        </div>
      </div>

      {/* Amount + Pay button */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground font-medium">إجمالي الدفع</span>
        </div>
        <span className="text-lg font-black text-primary">{amount.toFixed(2)} ر.س</span>
      </div>

      <div className="space-y-2">
        <Button
          onClick={handlePay}
          className="w-full h-12 text-base font-bold"
          data-testid="button-pay-card"
        >
          <Lock className="w-4 h-4 ml-2" />
          ادفع الآن — {amount.toFixed(2)} ر.س
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground text-sm"
          onClick={onCancel}
          data-testid="button-cancel-card-payment"
        >
          <ArrowLeft className="w-4 h-4 ml-1" />
          العودة
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
        <Shield className="w-3 h-3 text-green-600" />
        بيئة محاكاة آمنة — لن يتم خصم أي مبلغ حقيقي
      </p>
    </div>
  );
}
