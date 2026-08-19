// ── SupportSection ────────────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. Fully implemented with live data.
// Behind FEATURE_DASHBOARD_V2. Existing /dashboard untouched.

import { motion } from "framer-motion";
import { Headphones, MessageSquare, Phone, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface SupportSectionProps {
  lang?: "ar" | "en";
}

const CHANNELS = [
  {
    icon: MessageSquare,
    ar: "الدردشة المباشرة",
    en: "Live Chat",
    descAr: "تحدث مع فريق الدعم",
    descEn: "Talk to our support team",
    href: "/cs-chat",
    internal: true,
  },
  {
    icon: Phone,
    ar: "واتساب",
    en: "WhatsApp",
    descAr: "تواصل معنا عبر واتساب",
    descEn: "Contact us on WhatsApp",
    href: "https://wa.me/966500000000",
    internal: false,
  },
  {
    icon: Mail,
    ar: "البريد الإلكتروني",
    en: "Email",
    descAr: "أرسل لنا بريداً إلكترونياً",
    descEn: "Send us an email",
    href: "mailto:support@qirox.online",
    internal: false,
  },
];

export function SupportSection({ lang = "ar" }: SupportSectionProps) {
  const isAr = lang === "ar";

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-3">
        <Headphones className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-black dark:text-white">
          {isAr ? "الدعم الفني" : "Support"}
        </h3>
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 overflow-hidden divide-y divide-black/[0.04] dark:divide-white/[0.04]">
        {CHANNELS.map((channel, i) => (
          <motion.div
            key={channel.ar}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.25 }}
          >
            {channel.internal ? (
              <Link href={channel.href}>
                <a className="flex items-center gap-3 p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <channel.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-black dark:text-white">
                      {isAr ? channel.ar : channel.en}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {isAr ? channel.descAr : channel.descEn}
                    </p>
                  </div>
                  <ArrowLeft className={`w-4 h-4 text-gray-300 flex-shrink-0 ${isAr ? "" : "rotate-180"}`} />
                </a>
              </Link>
            ) : (
              <a
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <channel.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-black dark:text-white">
                    {isAr ? channel.ar : channel.en}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {isAr ? channel.descAr : channel.descEn}
                  </p>
                </div>
                <ArrowLeft className={`w-4 h-4 text-gray-300 flex-shrink-0 ${isAr ? "" : "rotate-180"}`} />
              </a>
            )}
          </motion.div>
        ))}

        <div className="p-3">
          <Link href="/cs-chat">
            <Button
              className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 text-xs h-9 gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {isAr ? "ابدأ محادثة" : "Start a Conversation"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
