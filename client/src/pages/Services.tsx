import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useServices } from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Check, Server, ShoppingBag, Utensils, Building2 } from "lucide-react";
import { Link } from "wouter";

// Helper to map icon string names to Lucide components
const IconMap: Record<string, any> = {
  Utensils,
  ShoppingBag,
  Building2,
  Server
};

export default function Services() {
  const { data: services, isLoading } = useServices();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      
      <section className="pt-32 pb-16 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        {/* Abstract technology background */}
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold font-heading mb-6">خدماتنا المتميزة</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            اختر الباقة التي تناسب احتياجات عملك، ودعنا نتكفل بالباقي. حلول مصممة خصيصاً لنمو أعمالك.
          </p>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services?.map((service) => {
              const Icon = IconMap[service.icon || "Server"] || Server;
              
              return (
                <Card key={service.id} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden group">
                  <div className="h-2 bg-gradient-to-r from-primary to-secondary w-full"></div>
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                       <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                       <Badge variant="secondary" className="bg-blue-50 text-primary hover:bg-blue-100 mb-2">
                          {service.category === 'restaurants' ? 'مطاعم وكافيهات' : 
                           service.category === 'stores' ? 'متاجر إلكترونية' : 'شركات ومؤسسات'}
                       </Badge>
                    </div>
                    <CardTitle className="text-2xl font-bold font-heading text-primary">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-slate-600 mb-6 leading-relaxed">
                      {service.description}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      {service.features?.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-700">
                          <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between py-4 border-t border-slate-100 mt-auto">
                       <div className="text-sm text-slate-500">المدة التقديرية</div>
                       <div className="font-semibold text-primary">{service.estimatedDuration}</div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-6">
                    <Link href={`/order?service=${service.id}`} className="w-full">
                      <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                        اطلب الخدمة الآن
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
