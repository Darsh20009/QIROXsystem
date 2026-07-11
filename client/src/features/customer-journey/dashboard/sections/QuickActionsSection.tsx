// ── QuickActionsSection ────────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. New section. Quick action grid.
// Behind FEATURE_DASHBOARD_V2.

import { motion } from "framer-motion";
import { ShoppingCart, Wallet, Headphones, Layers, FileText, Receipt, Zap, MessageSquare } from "lucide-react";
import { Link } from "wouter";

interface QuickActionsSectionProps {
  lang?: "ar" | "en";
}

const ACTIONS = [
  { icon: ShoppingCart, href: "/order",            ar: "طلب جديد",   en: "New Order" },
  { icon: Layers,       href: "/dashboard",         ar: "مشاريعي",    en: "My Projects" },
  { icon: Wallet,       href: "/wallet",            ar: "محفظتي",     en: "My Wallet" },
  { icon: Headphones,   href: "/cs-chat",           ar: "الدعم",      en: "Support" },
  { icon: FileText,     href: "/client/invoices",   ar: "الفواتير",   en: "Invoices" },
  { icon: MessageSquare,href: "/cs-chat",           ar: "تواصل معنا", en: "Contact Us" },
  { icon: Receipt,      href: "/dashboard",         ar: "طلباتي",     en: "My Orders" },
  { icon: Zap,          href: "/dashboard",         ar: "أدواتي",     en: "My Tools" },
];

export function QuickActionsSection({ lang = "ar" }: QuickActionsSectionProps) {
  const isAr = lang === "ar";

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
        {isAr ? "إجراءات سريعة" : "Quick Actions"}
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map((action, i) => (
          <motion.div
            key={action.href + action.ar}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
          >
            <Link href={action.href}>
              <a className="flex flex-col items-center gap-2 p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-center">
                <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                  <action.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 leading-tight">
                  {isAr ? action.ar : action.en}
                </span>
              </a>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
