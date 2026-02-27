import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState, useRef, useEffect } from "react";
import { SplashScreen } from "@/components/qirox-brand";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { useUser } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Moon, Sun, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Dashboard from "@/pages/Dashboard";
import AdminServices from "@/pages/AdminServices";
import AdminOrders from "@/pages/AdminOrders";
import AdminEmployees from "@/pages/AdminEmployees";
import AdminFinance from "@/pages/AdminFinance";
import Login from "@/pages/Login";
import OrderFlow from "@/pages/OrderFlow";
import ProjectDetails from "@/pages/ProjectDetails";
import About from "@/pages/About";
import Prices from "@/pages/Prices";
import Portfolio from "@/pages/Portfolio";
import Customers from "@/pages/Customers";
import News from "@/pages/News";
import Jobs from "@/pages/Jobs";
import JoinUs from "@/pages/JoinUs";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Segments from "@/pages/Segments";
import AdminTemplates from "@/pages/AdminTemplates";
import AdminPartners from "@/pages/AdminPartners";
import AdminNews from "@/pages/AdminNews";
import AdminJobs from "@/pages/AdminJobs";
import AdminBankSettings from "@/pages/AdminBankSettings";
import AdminModRequests from "@/pages/AdminModRequests";
import AdminCustomers from "@/pages/AdminCustomers";
import AdminProducts from "@/pages/AdminProducts";
import Devices from "@/pages/Devices";
import Cart from "@/pages/Cart";
import Partners from "@/pages/Partners";
import InternalGate from "@/pages/InternalGate";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import Inbox from "@/pages/Inbox";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminActivityLog from "@/pages/AdminActivityLog";
import AdminSupportTickets from "@/pages/AdminSupportTickets";
import AdminPayroll from "@/pages/AdminPayroll";
import SupportTickets from "@/pages/SupportTickets";
import EmployeeProfile from "@/pages/EmployeeProfile";
import EmployeeNewOrder from "@/pages/EmployeeNewOrder";
import DevChecklist from "@/pages/DevChecklist";
import PaymentHistory from "@/pages/PaymentHistory";
import AdminInvoices from "@/pages/AdminInvoices";
import InvoicePrint from "@/pages/InvoicePrint";
import AdminReceipts from "@/pages/AdminReceipts";
import ReceiptPrint from "@/pages/ReceiptPrint";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const publicRoutes = ["/", "/services", "/about", "/prices", "/portfolio", "/partners", "/customers", "/news", "/jobs", "/join", "/contact", "/privacy", "/terms", "/segments", "/login", "/register", "/employee/register-secret", "/order", "/internal-gate", "/devices", "/forgot-password", "/verify-email"];

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/about" component={About} />
      <Route path="/prices" component={Prices} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/partners" component={Partners} />
      <Route path="/customers" component={Customers} />
      <Route path="/news" component={News} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/join" component={JoinUs} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/segments" component={Segments} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Login} />
      <Route path="/employee/register-secret" component={Login} />
      <Route path="/order" component={OrderFlow} />
      <Route path="/internal-gate" component={InternalGate} />
      <Route path="/devices" component={Devices} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/projects/:id" component={ProjectDetails} />
      <Route path="/project/:section" component={ProjectDetails} />
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/services" component={AdminServices} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/employees" component={AdminEmployees} />
      <Route path="/admin/finance" component={AdminFinance} />
      <Route path="/admin/templates" component={AdminTemplates} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/news" component={AdminNews} />
      <Route path="/admin/jobs" component={AdminJobs} />
      <Route path="/admin/bank-settings" component={AdminBankSettings} />
      <Route path="/admin/mod-requests" component={AdminModRequests} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/activity-log" component={AdminActivityLog} />
      <Route path="/admin/support-tickets" component={AdminSupportTickets} />
      <Route path="/admin/payroll" component={AdminPayroll} />
      <Route path="/admin/invoices" component={AdminInvoices} />
      <Route path="/admin/invoice-print/:id" component={InvoicePrint} />
      <Route path="/admin/receipts" component={AdminReceipts} />
      <Route path="/admin/receipt-print/:id" component={ReceiptPrint} />
      <Route path="/support" component={SupportTickets} />
      <Route path="/employee/profile" component={EmployeeProfile} />
      <Route path="/employee/new-order" component={EmployeeNewOrder} />
      <Route path="/employee/checklist" component={DevChecklist} />
      <Route path="/payment-history" component={PaymentHistory} />
      <Route path="/cart" component={Cart} />
      <Route path="/inbox" component={Inbox} />
      <Route component={NotFound} />
    </Switch>
  );
}

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: results } = useQuery({
    queryKey: ["/api/search", q],
    queryFn: async () => {
      if (q.length < 2) return { orders: [], projects: [] };
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!r.ok) return { orders: [], projects: [] };
      return r.json();
    },
    enabled: q.length >= 2,
  });

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const hasResults = (results?.orders?.length || 0) + (results?.projects?.length || 0) > 0;

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.07] dark:border-white/[0.07] rounded-xl px-3 py-1.5">
        <Search className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="بحث..."
          className="bg-transparent text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 outline-none w-32"
          data-testid="input-global-search"
        />
        {q && <button onClick={() => { setQ(""); setOpen(false); }}><X className="w-3.5 h-3.5 text-black/30 dark:text-white/30" /></button>}
      </div>
      {open && q.length >= 2 && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl z-50 overflow-hidden">
          {!hasResults ? (
            <p className="text-xs text-black/30 dark:text-white/30 text-center py-4">لا توجد نتائج</p>
          ) : (
            <div className="p-2">
              {(results?.orders || []).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-black/30 dark:text-white/30 px-2 py-1 uppercase tracking-widest">طلبات</p>
                  {(results?.orders || []).map((o: any, i: number) => (
                    <a key={i} href="/admin/orders" onClick={() => setOpen(false)}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer">
                      <span className="text-sm text-black dark:text-white">{o.projectType || o.sector || "طلب"}</span>
                      <span className="text-xs text-black/30 dark:text-white/30">{o.status}</span>
                    </a>
                  ))}
                </div>
              )}
              {(results?.projects || []).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-black/30 dark:text-white/30 px-2 py-1 uppercase tracking-widest">مشاريع</p>
                  {(results?.projects || []).map((p: any, i: number) => (
                    <a key={i} href={`/projects/${p.id}`} onClick={() => setOpen(false)}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer">
                      <span className="text-sm text-black dark:text-white">مشروع</span>
                      <span className="text-xs text-black/30 dark:text-white/30">{p.status}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AppInner() {
  const [showSplash, setShowSplash] = useState(true);
  const [location] = useLocation();
  const { lang, setLang, dir } = useI18n();
  const { theme, toggle } = useTheme();
  const { data: user } = useUser();
  useWebSocket(user?.id);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  const isPublicRoute = publicRoutes.some(r => location === r);

  if (isPublicRoute) {
    return (
      <TooltipProvider>
        <div className={`min-h-screen flex flex-col bg-white dark:bg-gray-950 ${dir}`}>
          <PublicRouter />
          <Toaster />
        </div>
      </TooltipProvider>
    );
  }

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <TooltipProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className={`min-h-screen flex w-full bg-white dark:bg-gray-950 ${dir}`}>
          <AppSidebar />
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <header className="h-16 border-b border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-40">
              <div className="flex items-center gap-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </div>
              <div className="flex items-center gap-2">
                {user && <GlobalSearch />}
                <button
                  onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                  className="bg-black/[0.03] dark:bg-white/[0.04] text-black/70 dark:text-white/70 border border-black/[0.08] dark:border-white/[0.08] px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all"
                  data-testid="button-lang-toggle"
                >
                  {lang === "ar" ? "English" : "عربي"}
                </button>
                <button
                  onClick={toggle}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all"
                  data-testid="button-theme-toggle"
                  title={theme === "dark" ? "وضع نهاري" : "وضع ليلي"}
                >
                  {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-black/50" />}
                </button>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6 md:p-8 dark:bg-gray-950">
              <div className="max-w-7xl mx-auto w-full">
                <AdminRouter />
              </div>
            </main>
            <Toaster />
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AppInner />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
