import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Menu, X, LogOut, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";

export default function Navigation() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "الرئيسية" },
    { href: "/portfolio", label: "الأنظمة" },
    { href: "/prices", label: "الباقات" },
    { href: "/about", label: "عن المنصة" },
    { href: "/contact", label: "تواصل" },
    ...(user ? [{ href: "/dashboard", label: "لوحة التحكم" }] : []),
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "py-2"
            : "py-4"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className={`mx-auto transition-all duration-500 rounded-2xl px-6 ${
            scrolled
              ? "glass-strong shadow-lg shadow-black/20 max-w-4xl"
              : "bg-transparent max-w-6xl"
          }`}>
            <div className="flex justify-between items-center h-14">
              <Link href="/" className="flex items-center gap-2 group" data-testid="link-logo">
                <img src={qiroxLogoPath} alt="QIROX" className="h-7 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      location === link.href
                        ? "text-white"
                        : "text-white/40 hover:text-white/80"
                    }`} data-testid={`nav-link-${link.href.replace('/', '') || 'home'}`}>
                      {location === link.href && (
                        <motion.div
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-xl bg-white/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{link.label}</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)", color: "#0A0A0F" }}>
                        {user.fullName[0]}
                      </div>
                      <span className="text-sm text-white/70">{user.fullName.split(' ')[0]}</span>
                    </div>
                    <button
                      onClick={() => logout()}
                      className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/5 font-medium rounded-xl" data-testid="button-login-nav">
                        دخول
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm" className="premium-btn rounded-xl px-5 text-sm font-semibold" data-testid="button-register-nav">
                        ابدأ مشروعك
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-xl text-white/70 hover:bg-white/5 transition-colors"
                data-testid="button-mobile-menu"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-[60] bg-[#0A0A0F]/95 backdrop-blur-2xl"
          >
            <div className="flex flex-col h-full pt-20 px-6">
              <div className="space-y-1 flex-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={link.href} onClick={() => setIsOpen(false)}>
                      <div className={`block px-5 py-4 rounded-xl text-lg font-medium transition-all ${
                        location === link.href
                          ? "text-white bg-white/10"
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      }`}>
                        {link.label}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="pb-8 space-y-3">
                <div className="h-px bg-white/10 mb-4" />
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2 border-white/10 text-white/70 hover:bg-white/5 rounded-xl h-12"
                    onClick={() => { logout(); setIsOpen(false); }}
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل خروج
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full border-white/10 text-white/70 rounded-xl h-12">دخول</Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full premium-btn rounded-xl h-12">ابدأ الآن</Button>
                    </Link>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 left-6 p-2 rounded-xl text-white/50 hover:bg-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
