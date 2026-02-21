import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Menu, X, LayoutDashboard, Home, LogOut, User, DollarSign, Layers, Briefcase } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "الرئيسية" },
    { href: "/portfolio", label: "الأنظمة" },
    { href: "/prices", label: "الباقات" },
    { href: "/about", label: "عن المنصة" },
    { href: "/contact", label: "تواصل معنا" },
    ...(user ? [{ href: "/dashboard", label: "لوحة التحكم" }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E0E0E0]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group" data-testid="link-logo">
              <span className="font-heading font-black text-xl text-[#111111] tracking-tight">QIROX</span>
              <span className="text-[10px] text-[#555555] font-medium border border-[#E0E0E0] rounded px-1.5 py-0.5 hidden sm:inline">v1.0</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  location === link.href
                    ? "text-[#111111] bg-[#EAEAEA]"
                    : "text-[#555555] hover:text-[#111111] hover:bg-[#F4F4F4]"
                }`} data-testid={`nav-link-${link.href.replace('/', '') || 'home'}`}>
                  {link.label}
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#555555]">{user.fullName.split(' ')[0]}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  className="border-[#E0E0E0] text-[#555555] hover:text-[#111111] hover:border-[#111111] gap-2 rounded-lg"
                  data-testid="button-logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  خروج
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[#555555] hover:text-[#111111] font-medium rounded-lg" data-testid="button-login-nav">
                    دخول
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-[#111111] hover:bg-[#2B2B2B] text-white rounded-lg font-medium" data-testid="button-register-nav">
                    ابدأ الآن
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-[#111111] hover:bg-[#EAEAEA] transition-colors"
              data-testid="button-mobile-menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-[#E0E0E0] absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                <div className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  location === link.href
                    ? "text-[#111111] bg-[#EAEAEA]"
                    : "text-[#555555] hover:bg-[#F4F4F4]"
                }`}>
                  {link.label}
                </div>
              </Link>
            ))}
            <div className="h-px bg-[#E0E0E0] my-3" />
            {user ? (
              <Button
                variant="outline"
                className="w-full justify-center gap-2 border-[#E0E0E0]"
                onClick={() => { logout(); setIsOpen(false); }}
              >
                <LogOut className="w-4 h-4" />
                تسجيل خروج
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full border-[#E0E0E0] rounded-lg">دخول</Button>
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-[#111111] text-white rounded-lg">ابدأ الآن</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
