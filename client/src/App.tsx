import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import OrderFlow from "@/pages/OrderFlow";
import ProjectDetails from "@/pages/ProjectDetails";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Login} />
      <Route path="/order" component={OrderFlow} />
      <Route path="/projects/:id" component={ProjectDetails} />
      
      {/* Admin route placeholder - redirects to dashboard for MVP */}
      <Route path="/admin" component={Dashboard} />

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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={lang === "ar" ? "rtl" : "ltr"}>
          <div className="fixed top-4 right-4 z-50">
            <button 
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium"
            >
              {lang === "ar" ? "English" : "عربي"}
            </button>
          </div>
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
