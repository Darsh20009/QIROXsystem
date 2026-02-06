import { Layout } from "@/components/Layout";
import { useServices } from "@/hooks/use-services";
import { Loader2, Server, Globe, Smartphone, BarChart, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

// Map icon strings to components
const icons: Record<string, any> = {
  "server": Server,
  "globe": Globe,
  "smartphone": Smartphone,
  "chart": BarChart,
  "pen": PenTool,
};

export default function Services() {
  const { data: services, isLoading } = useServices();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold font-display mb-4">Our Premium Services</h1>
          <p className="text-muted-foreground text-lg">
            Choose the perfect solution for your business needs. 
            We deliver excellence in every line of code.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services?.map((service, index) => {
              const Icon = service.icon ? icons[service.icon] : Globe;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-8 flex flex-col hover:border-primary/50 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground mb-6 flex-1">{service.description}</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Time</span>
                      <span className="font-medium text-foreground">{service.estimatedDuration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Starting at</span>
                      <span className="font-bold text-primary text-lg">${service.priceMin}</span>
                    </div>
                    
                    <Link href={`/order?serviceId=${service.id}`}>
                      <Button className="w-full bg-white/5 hover:bg-primary hover:text-primary-foreground border border-white/10 transition-all">
                        Select Service
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
