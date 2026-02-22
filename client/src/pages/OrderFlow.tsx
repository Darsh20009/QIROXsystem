import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useUser } from "@/hooks/use-auth";
import { useService, useServices } from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle, ArrowLeft, ArrowRight, Check, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";

export default function OrderFlow() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const serviceIdFromUrl = searchParams.get("service") || "";
  const [selectedServiceId, setSelectedServiceId] = useState(serviceIdFromUrl);
  const { t, lang } = useI18n();

  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: services, isLoading: isServicesLoading } = useServices();
  const { data: service, isLoading: isServiceLoading } = useService(selectedServiceId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectType: "",
    sector: "",
    competitors: "",
    visualStyle: "",
    favoriteExamples: "",
    requiredFunctions: "",
    requiredSystems: "",
    siteLanguage: "ar",
    whatsappIntegration: false,
    socialIntegration: false,
    hasLogo: false,
    needsLogoDesign: false,
    hasHosting: false,
    hasDomain: false,
    logoUrl: "",
    brandIdentityUrl: "",
    filesUrl: "",
    contentUrl: "",
    imagesUrl: "",
    videoUrl: "",
    accessCredentials: "",
    paymentMethod: "bank_transfer",
    paymentProofUrl: ""
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: t("order.success"),
        description: t("order.successDesc"),
      });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: t("order.error"),
        description: t("order.errorDesc"),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      setLocation("/login");
    }
  }, [user, isUserLoading, setLocation]);

  if (isUserLoading || isServicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <Loader2 className="w-10 h-10 animate-spin text-[#00D4FF]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!selectedServiceId || !service) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
        <Navigation />
        <div className="flex-1 container mx-auto px-4 py-8 pt-32 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
              <Briefcase className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="text-white/40 text-xs tracking-wider uppercase">{t("order.step1")}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-heading text-white mb-4">
              {t("order.step1.title")}
            </h1>
            <p className="text-white/30 text-lg">{t("services.subtitle")}</p>
          </div>

          {services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => setSelectedServiceId(String(svc.id))}
                  className="glass-card p-6 rounded-2xl text-right hover:border-[#00D4FF]/30 border border-transparent transition-all group"
                  data-testid={`select-service-${svc.id}`}
                >
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#00D4FF] transition-colors">{svc.title}</h3>
                  <p className="text-sm text-white/30 line-clamp-2 mb-4">{svc.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20">
                      {svc.category}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {svc.priceMin?.toLocaleString()} {t("order.sar")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-white/40 text-lg mb-4">{t("order.serviceNotFound")}</p>
              <Button onClick={() => setLocation("/services")} className="premium-btn" data-testid="button-back-services">
                {t("order.backToServices")}
              </Button>
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = () => {
    createOrderMutation.mutate({
      serviceId: service.id,
      ...formData,
      status: "pending",
      isDepositPaid: false,
      totalAmount: service.priceMin
    });
  };

  const stepLabels = [t("order.step1"), t("order.step2"), t("order.step3"), t("order.step4"), t("order.step5")];

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <Navigation />

      <div className="flex-1 container mx-auto px-4 py-8 pt-32 max-w-3xl" dir="rtl">
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10"></div>
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border ${
                  step >= s
                    ? "bg-[#00D4FF] text-[#0A0A0F] border-[#00D4FF] scale-110"
                    : "bg-white/5 text-white/30 border-white/10"
                }`}
                data-testid={`step-indicator-${s}`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[10px] md:text-sm text-white/30 font-medium px-1">
            {stepLabels.map((label, i) => (
              <span key={i} className={step === i + 1 ? "text-[#00D4FF]" : ""}>{label}</span>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC]" style={{ width: `${(step / 5) * 100}%`, transition: "width 0.3s" }} />
          <div className="p-6 md:p-8 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">
              {step === 1 && t("order.step1.title")}
              {step === 2 && t("order.step2.title")}
              {step === 3 && t("order.step3.title")}
              {step === 4 && t("order.step4.title")}
              {step === 5 && t("order.step5.title")}
            </h2>
            <p className="text-sm text-white/30 mt-1">
              {t("order.serviceLabel")}: <span className="text-[#00D4FF]">{service.title}</span>
            </p>
          </div>

          <div className="p-6 md:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm mb-2 block text-white/60">{t("order.projectType")}</Label>
                    <Input
                      placeholder={t("order.projectTypePlaceholder")}
                      className="bg-white/5 border-white/10 text-white"
                      value={formData.projectType}
                      onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                      data-testid="input-projectType"
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block text-white/60">{t("order.sector")}</Label>
                    <Input
                      placeholder={t("order.sectorPlaceholder")}
                      className="bg-white/5 border-white/10 text-white"
                      value={formData.sector}
                      onChange={e => setFormData({ ...formData, sector: e.target.value })}
                      data-testid="input-sector"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-2 block text-white/60">{t("order.competitors")}</Label>
                  <Input
                    className="bg-white/5 border-white/10 text-white"
                    placeholder={t("order.competitorsPlaceholder")}
                    value={formData.competitors}
                    onChange={e => setFormData({ ...formData, competitors: e.target.value })}
                    data-testid="input-competitors"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm mb-2 block text-white/60">{t("order.visualStyle")}</Label>
                    <Input
                      placeholder={t("order.visualStylePlaceholder")}
                      className="bg-white/5 border-white/10 text-white"
                      value={formData.visualStyle}
                      onChange={e => setFormData({ ...formData, visualStyle: e.target.value })}
                      data-testid="input-visualStyle"
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block text-white/60">{t("order.siteLanguage")}</Label>
                    <Input
                      placeholder={t("order.siteLanguagePlaceholder")}
                      className="bg-white/5 border-white/10 text-white"
                      value={formData.siteLanguage}
                      onChange={e => setFormData({ ...formData, siteLanguage: e.target.value })}
                      data-testid="input-siteLanguage"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-2 block text-white/60">{t("order.requiredFunctions")}</Label>
                  <Textarea
                    className="h-24 resize-none bg-white/5 border-white/10 text-white"
                    placeholder={t("order.requiredFunctionsPlaceholder")}
                    value={formData.requiredFunctions}
                    onChange={e => setFormData({ ...formData, requiredFunctions: e.target.value })}
                    data-testid="input-requiredFunctions"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'whatsapp', label: t("order.whatsapp"), field: 'whatsappIntegration' },
                    { id: 'social', label: t("order.social"), field: 'socialIntegration' },
                    { id: 'hosting', label: t("order.hasHosting"), field: 'hasHosting' },
                    { id: 'domain', label: t("order.hasDomain"), field: 'hasDomain' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={item.id}
                        checked={(formData as any)[item.field]}
                        onChange={e => setFormData({ ...formData, [item.field]: e.target.checked })}
                        className="accent-[#00D4FF]"
                        data-testid={`checkbox-${item.id}`}
                      />
                      <Label htmlFor={item.id} className="text-xs cursor-pointer text-white/50">{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <p className="text-sm text-white/30 mb-4">{t("order.docsNote")}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: t("order.logo"), field: 'logoUrl' },
                    { label: t("order.brandIdentity"), field: 'brandIdentityUrl' },
                    { label: t("order.content"), field: 'contentUrl' },
                    { label: t("order.accessCredentials"), field: 'accessCredentials' },
                  ].map(item => (
                    <div key={item.field}>
                      <Label className="text-sm mb-1 block text-white/60">{item.label}</Label>
                      <Input
                        placeholder={t("order.filePlaceholder")}
                        className="bg-white/5 border-white/10 text-white"
                        value={(formData as any)[item.field]}
                        onChange={e => setFormData({ ...formData, [item.field]: e.target.value })}
                        data-testid={`input-${item.field}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <RadioGroup value={formData.paymentMethod} onValueChange={val => setFormData({ ...formData, paymentMethod: val })}>
                  <div className="flex flex-col space-y-2 border border-white/10 p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center space-x-reverse space-x-3">
                      <RadioGroupItem value="bank_transfer" id="bank" data-testid="radio-bank" />
                      <Label htmlFor="bank" className="flex-1 cursor-pointer font-medium text-white">{t("order.bankTransfer")}</Label>
                    </div>
                    {formData.paymentMethod === 'bank_transfer' && (
                      <div className="mt-4 p-4 bg-[#00D4FF]/5 rounded-lg border border-[#00D4FF]/20 text-xs text-white/60">
                        <p className="font-bold text-[#00D4FF] mb-2">{t("order.bankDetails")}</p>
                        <p className="font-mono">IBAN: SA0380205098017222121010</p>
                        <p className="mt-1">{t("order.bankNote")}</p>
                        <div className="mt-3">
                          <Label className="mb-1 block text-white/50">{t("order.receiptLink")}</Label>
                          <Input
                            placeholder={t("order.receiptPlaceholder")}
                            className="bg-white/5 border-white/10 text-white"
                            value={formData.paymentProofUrl}
                            onChange={e => setFormData({ ...formData, paymentProofUrl: e.target.value })}
                            data-testid="input-paymentProof"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-reverse space-x-3 border border-white/10 p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                    <RadioGroupItem value="paypal" id="paypal" data-testid="radio-paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer font-medium text-white">{t("order.paypal")}</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-xl space-y-4 border border-white/10">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/40">{t("order.serviceLabel")}</span>
                    <span className="font-bold text-[#00D4FF]">{service.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/40">{t("order.projectType")}</span>
                    <span className="font-bold text-white">{formData.projectType || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/40">{t("order.paymentMethod")}</span>
                    <span className="font-bold text-white">
                      {formData.paymentMethod === 'bank_transfer' ? t("order.bankTransfer") : t("order.paypal")}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/40">{t("order.startingPrice")}</span>
                    <span className="font-bold text-[#00D4FF]">{service.priceMin?.toLocaleString()} {t("order.sar")}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-white/40 block mb-2">{t("order.functionsRequired")}</span>
                    <p className="text-xs text-white/60 bg-white/5 p-3 rounded-lg border border-white/10">
                      {formData.requiredFunctions || t("order.noDetails")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack} className="min-w-[100px] border-white/10 text-white/60" data-testid="button-prev-step">
                  <ArrowRight className="ml-2 w-4 h-4" />
                  {t("order.prev")}
                </Button>
              ) : <div></div>}

              {step < 5 ? (
                <Button onClick={handleNext} className="premium-btn min-w-[100px]" data-testid="button-next-step">
                  {t("order.next")}
                  <ArrowLeft className="mr-2 w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createOrderMutation.isPending}
                  className="min-w-[100px] font-bold"
                  style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)", color: "#0A0A0F" }}
                  data-testid="button-confirm-order"
                >
                  {createOrderMutation.isPending ? <Loader2 className="animate-spin" /> : (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      {t("order.confirm")}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
