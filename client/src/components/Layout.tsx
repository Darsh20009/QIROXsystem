import Navigation from "./Navigation";
import { useEffect } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  // Apply RTL direction to the document body for Arabic support if needed
  // In a real multi-language app, this would be dynamic based on locale
  useEffect(() => {
    document.documentElement.dir = "ltr"; // Default to LTR for now as prompt was in English, but style supports RTL
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navigation />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <footer className="py-12 border-t border-white/5 bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 QIROX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
