import { useQuery } from "@tanstack/react-query";
import type { SectorTemplate, PricingPlan } from "@shared/schema";

export function useTemplates() {
  return useQuery<SectorTemplate[]>({
    queryKey: ["/api/templates"],
  });
}

export function useTemplate(id: string) {
  return useQuery<SectorTemplate>({
    queryKey: ["/api/templates", id],
    enabled: !!id,
  });
}

export function usePricingPlans() {
  return useQuery<PricingPlan[]>({
    queryKey: ["/api/pricing"],
  });
}
