import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

import InternalGate from "@/pages/InternalGate";
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
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/internal-gate" component={InternalGate} />
      <Route path="/services" component={Services} />
      <Route path="/about" component={About} />
      <Route path="/prices" component={Prices} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/customers" component={Customers} />
      <Route path="/news" component={News} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/join" component={JoinUs} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/segments" component={Segments} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Login} />
      <Route path="/employee/register-secret" component={Login} />
      <Route path="/order" component={OrderFlow} />
      <Route path="/projects/:id" component={ProjectDetails} />
      
      {/* Fallback routes for sidebar links to project details */}
      <Route path="/project/:section" component={ProjectDetails} />
      
      {/* Admin routes */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/services" component={AdminServices} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/employees" component={AdminEmployees} />
      <Route path="/admin/finance" component={AdminFinance} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [lang, setLang] = useState<"ar" | "en">("ar");

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className={`min-h-screen flex w-full bg-background ${lang === "ar" ? "rtl" : "ltr"}`}>
            <AppSidebar />
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
              <header className="h-16 border-b border-border/40 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <h2 className="font-heading font-bold text-foreground hidden md:block text-lg">QIROX</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                    className="bg-white text-foreground border border-border px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-accent hover:text-white transition-all duration-300 shadow-sm"
                  >
                    {lang === "ar" ? "English" : "عربي"}
                  </button>
                </div>
              </header>
              <main className="flex-1 overflow-auto p-6 md:p-8">
                <div className="max-w-7xl mx-auto w-full">
                  <Router />
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
