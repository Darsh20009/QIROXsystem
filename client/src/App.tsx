import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { SplashScreen } from "@/components/qirox-brand";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { useUser } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Moon, Sun, Search, X, Loader2, ShoppingCart, Wallet, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { FloatingClientChat } from "@/components/FloatingClientChat";

const Home = lazy(() => import("@/pages/Home"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AdminServices = lazy(() => import("@/pages/AdminServices"));
const AdminOrders = lazy(() => import("@/pages/AdminOrders"));
const AdminEmployees = lazy(() => import("@/pages/AdminEmployees"));
const AdminFinance = lazy(() => import("@/pages/AdminFinance"));
const Login = lazy(() => import("@/pages/Login"));
const OrderFlow = lazy(() => import("@/pages/OrderFlow"));
const ProjectDetails = lazy(() => import("@/pages/ProjectDetails"));
const About = lazy(() => import("@/pages/About"));
const Prices = lazy(() => import("@/pages/Prices"));
const Customers = lazy(() => import("@/pages/Customers"));
const News = lazy(() => import("@/pages/News"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const JoinUs = lazy(() => import("@/pages/JoinUs"));
const Contact = lazy(() => import("@/pages/Contact"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Segments = lazy(() => import("@/pages/Segments"));
const AdminTemplates = lazy(() => import("@/pages/AdminTemplates"));
const AdminPartners = lazy(() => import("@/pages/AdminPartners"));
const AdminNews = lazy(() => import("@/pages/AdminNews"));
const AdminJobs = lazy(() => import("@/pages/AdminJobs"));
const AdminBankSettings = lazy(() => import("@/pages/AdminBankSettings"));
const AdminSubscriptionPlans = lazy(() => import("@/pages/AdminSubscriptionPlans"));
const AdminModRequests = lazy(() => import("@/pages/AdminModRequests"));
const AdminCustomers = lazy(() => import("@/pages/AdminCustomers"));
const AdminProducts = lazy(() => import("@/pages/AdminProducts"));
const Devices = lazy(() => import("@/pages/Devices"));
const Cart = lazy(() => import("@/pages/Cart"));
const InternalGate = lazy(() => import("@/pages/InternalGate"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const Inbox = lazy(() => import("@/pages/Inbox"));
const AdminAnalytics = lazy(() => import("@/pages/AdminAnalytics"));
const AdminActivityLog = lazy(() => import("@/pages/AdminActivityLog"));
const AdminSupportTickets = lazy(() => import("@/pages/AdminSupportTickets"));
const AdminPayroll = lazy(() => import("@/pages/AdminPayroll"));
const SupportTickets = lazy(() => import("@/pages/SupportTickets"));
const EmployeeProfile = lazy(() => import("@/pages/EmployeeProfile"));
const EmployeeNewOrder = lazy(() => import("@/pages/EmployeeNewOrder"));
const DevChecklist = lazy(() => import("@/pages/DevChecklist"));
const PaymentHistory = lazy(() => import("@/pages/PaymentHistory"));
const AdminInvoices = lazy(() => import("@/pages/AdminInvoices"));
const InvoicePrint = lazy(() => import("@/pages/InvoicePrint"));
const AdminReceipts = lazy(() => import("@/pages/AdminReceipts"));
const ReceiptPrint = lazy(() => import("@/pages/ReceiptPrint"));
const EmployeeRoleDashboard = lazy(() => import("@/pages/EmployeeRoleDashboard"));
const SalesMarketing = lazy(() => import("@/pages/SalesMarketing"));
const DevPortal = lazy(() => import("@/pages/DevPortal"));
const NotFound = lazy(() => import("@/pages/not-found"));

const Partners = lazy(() => import("@/pages/Partners"));
const Consultation = lazy(() => import("@/pages/Consultation"));
const AdminConsultation = lazy(() => import("@/pages/AdminConsultation"));
const AdminDiscountCodes = lazy(() => import("@/pages/AdminDiscountCodes"));
const AdminShipments = lazy(() => import("@/pages/AdminShipments"));
const AdminCronJobs = lazy(() => import("@/pages/AdminCronJobs"));
const AdminMongoAtlas = lazy(() => import("@/pages/AdminMongoAtlas"));
const AdminAppPublish = lazy(() => import("@/pages/AdminAppPublish"));
const AdminSystemFeatures = lazy(() => import("@/pages/AdminSystemFeatures"));
const AdminExtraAddons = lazy(() => import("@/pages/AdminExtraAddons"));
const AdminModConfig = lazy(() => import("@/pages/AdminModConfig"));
const CSChat = lazy(() => import("@/pages/CSChat"));
const AdminProjectFeatures = lazy(() => import("@/pages/AdminProjectFeatures"));
const ProjectWorkspace = lazy(() => import("@/pages/ProjectWorkspace"));
const ClientWallet = lazy(() => import("@/pages/ClientWallet"));
const AdminWallet = lazy(() => import("@/pages/AdminWallet"));
const Systems = lazy(() => import("@/pages/Systems"));
const ClientsGroup = lazy(() => import("@/pages/ClientsGroup"));
const BarcodeStudio = lazy(() => import("@/pages/BarcodeStudio"));
const AdminQMeet = lazy(() => import("@/pages/AdminQMeet"));
const AdminQMeetDetail = lazy(() => import("@/pages/AdminQMeetDetail"));
const QiroxEdit = lazy(() => import("@/pages/QiroxEdit"));
const ClientDataRequests = lazy(() => import("@/pages/ClientDataRequests"));
const AdminDataRequests = lazy(() => import("@/pages/AdminDataRequests"));
const MyTools = lazy(() => import("@/pages/MyTools"));
const AdminQiroxSettings = lazy(() => import("@/pages/AdminQiroxSettings"));
const AdminPromotions = lazy(() => import("@/pages/AdminPromotions"));
const AdminInvestors = lazy(() => import("@/pages/AdminInvestors"));
const InvestorPortal = lazy(() => import("@/pages/InvestorPortal"));
const publicRoutes = ["/", "/about", "/prices", "/customers", "/news", "/jobs", "/join", "/contact", "/privacy", "/terms", "/segments", "/login", "/register", "/employee/register-secret", "/order", "/internal-gate", "/devices", "/forgot-password", "/verify-email", "/developers", "/partners", "/consultation", "/systems", "/clients-group", "/barcode-studio"];

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
    </div>
  );
}

function PublicRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/prices" component={Prices} />
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
        <Route path="/developers" component={DevPortal} />
        <Route path="/partners" component={Partners} />
        <Route path="/consultation" component={Consultation} />
        <Route path="/systems" component={Systems} />
        <Route path="/clients-group" component={ClientsGroup} />
        <Route path="/barcode-studio" component={BarcodeStudio} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AdminRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/admin/subscription-plans" component={AdminSubscriptionPlans} />
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
        <Route path="/admin/consultations" component={AdminConsultation} />
        <Route path="/admin/qmeet" component={AdminQMeet} />
        <Route path="/admin/qmeet/:id" component={AdminQMeetDetail} />
        <Route path="/admin/discount-codes" component={AdminDiscountCodes} />
        <Route path="/admin/shipments" component={AdminShipments} />
        <Route path="/admin/cron-jobs" component={AdminCronJobs} />
        <Route path="/admin/atlas" component={AdminMongoAtlas} />
        <Route path="/admin/app-publish" component={AdminAppPublish} />
        <Route path="/admin/system-features" component={AdminSystemFeatures} />
        <Route path="/admin/extra-addons" component={AdminExtraAddons} />
        <Route path="/admin/mod-config" component={AdminModConfig} />
        <Route path="/cs-chat" component={CSChat} />
        <Route path="/admin/project-features" component={AdminProjectFeatures} />
        <Route path="/project/:id/workspace" component={ProjectWorkspace} />
        <Route path="/wallet" component={ClientWallet} />
        <Route path="/admin/wallet" component={AdminWallet} />
        <Route path="/my-requests" component={ClientDataRequests} />
        <Route path="/admin/data-requests" component={AdminDataRequests} />
        <Route path="/my-tools" component={MyTools} />
        <Route path="/admin/qirox-settings" component={AdminQiroxSettings} />
        <Route path="/admin/promotions" component={AdminPromotions} />
        <Route path="/admin/investors" component={AdminInvestors} />
        <Route path="/investor/portal" component={InvestorPortal} />
        <Route path="/support" component={SupportTickets} />
        <Route path="/employee/profile" component={EmployeeProfile} />
        <Route path="/employee/new-order" component={EmployeeNewOrder} />
        <Route path="/employee/checklist" component={DevChecklist} />
        <Route path="/employee/role-dashboard" component={EmployeeRoleDashboard} />
        <Route path="/sales/marketing" component={SalesMarketing} />
        <Route path="/payment-history" component={PaymentHistory} />
        <Route path="/cart" component={Cart} />
        <Route path="/inbox" component={Inbox} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
          className="bg-transparent border-none outline-none text-sm text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25 w-32 md:w-48"
          data-testid="input-global-search"
        />
        {q && (
          <button onClick={() => { setQ(""); setOpen(false); }} className="text-black/30 dark:text-white/30 hover:text-black/50 dark:hover:text-white/50">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && hasResults && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl z-50 max-h-64 overflow-auto" data-testid="search-results-dropdown">
          {results?.orders?.map((o: any) => (
            <a key={o.id} href={`/admin/orders`} className="block px-4 py-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] text-sm text-black dark:text-white border-b border-black/[0.04] dark:border-white/[0.04] last:border-0" onClick={() => setOpen(false)}>
              <span className="font-semibold">#{o.id}</span> — {o.projectName || o.notes || "طلب"}
            </a>
          ))}
          {results?.projects?.map((p: any) => (
            <a key={p.id} href={`/projects/${p.id}`} className="block px-4 py-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] text-sm text-black dark:text-white border-b border-black/[0.04] dark:border-white/[0.04] last:border-0" onClick={() => setOpen(false)}>
              📁 {p.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientQuickNav() {
  const { data: user } = useUser();
  const { data: cartData } = useQuery<any>({
    queryKey: ['/api/cart'],
    enabled: user?.role === 'client',
    refetchInterval: 30000,
  });
  const { data: walletData } = useQuery<any>({
    queryKey: ['/api/wallet'],
    enabled: user?.role === 'client',
    refetchInterval: 60000,
  });
  const { data: orders } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    enabled: user?.role === 'client',
    refetchInterval: 60000,
  });

  if (!user || user.role !== 'client') return null;

  const cartCount = cartData?.items?.length ?? 0;
  const outstanding = walletData?.outstanding ?? null;
  const pendingOrders = orders?.filter((o: any) => o.status === 'pending' || o.status === 'approved' || o.status === 'in_progress')?.length ?? 0;

  return (
    <div className="flex items-center gap-1" data-testid="client-quick-nav">
      {/* Orders */}
      <Link href="/dashboard">
        <button
          className="relative flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.07] dark:border-white/[0.07] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] transition-all group"
          title="طلباتي"
          data-testid="button-quick-orders"
        >
          <FileText className="w-3.5 h-3.5 text-black/40 dark:text-white/40 group-hover:text-black/70 dark:group-hover:text-white/70 transition-colors" />
          {pendingOrders > 0 && (
            <>
              <span className="text-[10px] font-bold text-black/60 dark:text-white/60 group-hover:text-black/90 dark:group-hover:text-white/90 transition-colors hidden sm:inline">{pendingOrders}</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 text-white text-[7px] font-black rounded-full flex items-center justify-center sm:hidden">{pendingOrders}</span>
            </>
          )}
        </button>
      </Link>

      {/* Wallet */}
      <Link href="/wallet">
        <button
          className="relative flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.07] dark:border-white/[0.07] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] transition-all group"
          title="محفظتي"
          data-testid="button-quick-wallet"
        >
          <Wallet className={`w-3.5 h-3.5 transition-colors ${outstanding > 0 ? "text-amber-500" : "text-black/40 dark:text-white/40 group-hover:text-black/70 dark:group-hover:text-white/70"}`} />
          {outstanding !== null && (
            <span className={`text-[10px] font-bold hidden sm:inline transition-colors ${outstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-black/60 dark:text-white/60 group-hover:text-black/90 dark:group-hover:text-white/90"}`}>
              {Number(outstanding).toLocaleString('ar-SA')} ر.س
            </span>
          )}
          {outstanding > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full sm:hidden" />
          )}
        </button>
      </Link>

      {/* Cart */}
      <Link href="/cart">
        <button
          className={`relative flex items-center gap-1.5 h-8 px-2.5 rounded-lg border transition-all group ${
            cartCount > 0
              ? "bg-black dark:bg-white border-black dark:border-white hover:opacity-80"
              : "bg-black/[0.03] dark:bg-white/[0.04] border-black/[0.07] dark:border-white/[0.07] hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
          }`}
          title="عربة التسوق"
          data-testid="button-quick-cart"
        >
          <ShoppingCart className={`w-3.5 h-3.5 transition-colors ${cartCount > 0 ? "text-white dark:text-black" : "text-black/40 dark:text-white/40 group-hover:text-black/70 dark:group-hover:text-white/70"}`} />
          {cartCount > 0 && (
            <span className="text-[10px] font-black text-white dark:text-black hidden sm:inline">{cartCount}</span>
          )}
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none sm:hidden">
              {cartCount}
            </span>
          )}
        </button>
      </Link>
    </div>
  );
}

function AppInner() {
  const [showSplash, setShowSplash] = useState(true);
  const [location] = useLocation();
  const { data: user } = useUser();
  const { t, lang, setLang, dir } = useI18n();
  const { theme, toggle } = useTheme();

  useWebSocket(user?.id);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (location === "/qirox-edit") {
    return (
      <Suspense fallback={<PageLoader />}>
        <QiroxEdit />
        <Toaster />
      </Suspense>
    );
  }

  const isPublicRoute = publicRoutes.some(r => location === r);

  if (isPublicRoute) {
    return (
      <TooltipProvider>
        <div className={`min-h-screen flex flex-col bg-white dark:bg-gray-950 ${dir}`}>
          <PublicRouter />
          <FloatingClientChat />
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
          <div className="flex-1 flex flex-col min-h-screen">
            <header className="h-14 md:h-16 border-b border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-950 md:bg-white/90 md:dark:bg-gray-950/90 md:backdrop-blur-xl flex items-center justify-between px-3 md:px-4 sticky top-0 z-40">
              <div className="flex items-center gap-2 md:gap-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                {user && <div className="hidden sm:block"><GlobalSearch /></div>}
                <ClientQuickNav />
                <button
                  onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                  className="bg-black/[0.03] dark:bg-white/[0.04] text-black/70 dark:text-white/70 border border-black/[0.08] dark:border-white/[0.08] px-2.5 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all"
                  data-testid="button-lang-toggle"
                >
                  {lang === "ar" ? "EN" : "ع"}
                </button>
                <button
                  onClick={toggle}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all"
                  data-testid="button-theme-toggle"
                  title={theme === "dark" ? "وضع نهاري" : "وضع ليلي"}
                >
                  {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-black/50" />}
                </button>
                {user && (
                  <div className="flex items-center gap-1.5 md:hidden">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-black dark:bg-white text-white dark:text-black">
                      {(user.fullName || "U")[0]}
                    </div>
                  </div>
                )}
              </div>
            </header>
            <main className="flex-1 overflow-auto p-3 sm:p-5 md:p-8 dark:bg-gray-950 pb-20 md:pb-8">
              <div className="max-w-7xl mx-auto w-full">
                <AdminRouter />
              </div>
            </main>
            <MobileBottomNav />
            <FloatingClientChat />
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
