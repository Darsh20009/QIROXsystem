import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import { SplashScreen } from "@/components/qirox-brand";

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
import Partners from "@/pages/Partners";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const publicRoutes = ["/", "/services", "/about", "/prices", "/portfolio", "/partners", "/customers", "/news", "/jobs", "/join", "/contact", "/privacy", "/terms", "/segments", "/login", "/register", "/employee/register-secret", "/order"];

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [showSplash, setShowSplash] = useState(true);
  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  const isPublicRoute = publicRoutes.some(r => location === r);

  if (isPublicRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className={`min-h-screen flex flex-col bg-[#0A0A0F] ${lang === "ar" ? "rtl" : "ltr"}`}>
            <PublicRouter />
            <Toaster />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className={`min-h-screen flex w-full bg-[#0A0A0F] ${lang === "ar" ? "rtl" : "ltr"}`}>
            <AppSidebar />
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
              <header className="h-16 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                    className="bg-white/5 text-white/70 border border-white/10 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
                  >
                    {lang === "ar" ? "English" : "عربي"}
                  </button>
                </div>
              </header>
              <main className="flex-1 overflow-auto p-6 md:p-8">
                <div className="max-w-7xl mx-auto w-full">
                  <AdminRouter />
                </div>
              </main>
              <Toaster />
            </div>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
