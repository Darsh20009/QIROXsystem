import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Menu, X, LayoutDashboard, Home, Briefcase, LogOut, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const isHome = location === "/";

  const navLinks = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/services", label: "خدماتنا", icon: Briefcase },
    { href: "/about", label: "من نحن", icon: User },
    { href: "/portfolio", label: "أعمالنا", icon: Briefcase },
    { href: "/news", label: "الأخبار", icon: Home },
    { href: "/contact", label: "تواصل معنا", icon: Home },
    ...(user ? [{ href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard }] : []),
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isHome ? 'bg-white/80 backdrop-blur-lg border-b border-slate-200/50' : 'bg-white border-b border-slate-200'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Area */}
          <div className="flex-shrink-0 flex items-center gap-3">
             <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                   <img src="/logo.png" alt="Qirox Logo" className="w-8 h-8 object-contain filter invert" /> 
                   {/* Invert logo to white if it's dark, or remove filter if it's already suitable */}
                </div>
                <span className="font-heading font-bold text-2xl text-primary tracking-tight group-hover:text-secondary transition-colors">Qirox</span>
             </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 space-x-reverse">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                  location === link.href 
                    ? "text-secondary font-bold bg-secondary/5" 
                    : "text-slate-600 hover:text-primary hover:bg-slate-50 font-medium"
                }`}>
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                 <span className="text-sm font-medium text-slate-600">
                    مرحباً، {user.fullName.split(' ')[0]}
                 </span>
                 <Button 
                   variant="outline" 
                   onClick={() => logout()}
                   className="border-slate-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50 text-slate-600 gap-2"
                 >
                   <LogOut className="w-4 h-4" />
                   تسجيل خروج
                 </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-600 hover:text-primary font-medium">
                    تسجيل دخول
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                    ابدأ الآن
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 absolute w-full shadow-xl">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                <div className={`block px-4 py-3 rounded-xl text-base font-medium ${
                  location === link.href
                    ? "text-secondary bg-secondary/5"
                    : "text-slate-600 hover:bg-slate-50"
                }`}>
                  <div className="flex items-center gap-3">
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </div>
                </div>
              </Link>
            ))}
            
            <div className="h-px bg-slate-100 my-4" />
            
            {user ? (
               <Button 
                 variant="destructive" 
                 className="w-full justify-start gap-3"
                 onClick={() => { logout(); setIsOpen(false); }}
               >
                 <LogOut className="w-5 h-5" />
                 تسجيل خروج
               </Button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">تسجيل دخول</Button>
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-primary text-white">ابدأ الآن</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
