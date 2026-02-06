import { Layout } from "@/components/Layout";
import { useLocation, useSearch } from "wouter";
import { useService } from "@/hooks/use-services";
import { useCreateOrder } from "@/hooks/use-orders";
import { useUser } from "@/hooks/use-auth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronRight, ChevronLeft, Check, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrderFlow() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const serviceId = Number(params.get("serviceId"));
  
  const { data: user } = useUser();
  const { data: service, isLoading: serviceLoading } = useService(serviceId);
  const { mutate: createOrder, isPending: isCreating } = useCreateOrder();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    requirements: {},
    paymentMethod: "",
    notes: ""
  });

  if (!user) {
    return (
      <Layout>
        <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-2xl font-bold mb-4">Please log in to continue</h2>
          <Button onClick={() => setLocation("/login")}>Go to Login</Button>
        </div>
      </Layout>
    );
  }

  if (serviceLoading) {
    return <Layout><div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div></Layout>;
  }

  if (!service) {
    return <Layout><div className="text-center p-20">Service not found</div></Layout>;
  }

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = () => {
    createOrder({
      serviceId,
      userId: user.id,
      status: "pending",
      requirements: formData.requirements,
      paymentMethod: formData.paymentMethod,
      totalAmount: service.priceMin || 0, // Simplified price logic
    }, {
      onSuccess: () => {
        toast({ title: "Order Created!", description: "We will review it shortly." });
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold font-display">Configure Your Order</h1>
            <div className="text-sm text-muted-foreground">Step {step} of 3</div>
          </div>
          {/* Progress Bar */}
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 rounded-2xl space-y-6"
            >
              <h2 className="text-xl font-bold">{service.title} Details</h2>
              <p className="text-muted-foreground">{service.description}</p>
              
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input 
                    id="project-name" 
                    className="glass-input" 
                    onChange={(e) => setFormData({...formData, requirements: {...formData.requirements, projectName: e.target.value}})}
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea 
                    id="description" 
                    className="glass-input min-h-[120px]" 
                    onChange={(e) => setFormData({...formData, requirements: {...formData.requirements, description: e.target.value}})}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext}>
                  Next Step <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 rounded-2xl space-y-6"
            >
              <h2 className="text-xl font-bold">Payment Method</h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                {['Bank Transfer', 'Credit Card', 'PayPal'].map((method) => (
                  <div 
                    key={method}
                    onClick={() => setFormData({...formData, paymentMethod: method})}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.paymentMethod === method 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mb-2" />
                    <div className="font-medium">{method}</div>
                  </div>
                ))}
              </div>

              <div className="bg-secondary/30 p-4 rounded-lg mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Service Base Price</span>
                  <span className="font-mono">${service.priceMin}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t border-white/10 pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-primary">${service.priceMin}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button onClick={handleNext} disabled={!formData.paymentMethod}>
                  Review Order <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 rounded-2xl space-y-6"
            >
              <h2 className="text-xl font-bold text-center">Confirm Your Order</h2>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted-foreground">Service</span>
                  <span>{service.title}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span>{formData.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold text-primary">${service.priceMin}</span>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isCreating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-1/2"
                >
                  {isCreating ? <Loader2 className="animate-spin" /> : <>Confirm & Pay <Check className="ml-2 w-4 h-4" /></>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
