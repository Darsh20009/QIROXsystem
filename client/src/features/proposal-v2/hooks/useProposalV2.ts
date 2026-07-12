// ── Proposal V2 Hooks ────────────────────────────────────────────────────────
// Sprint D — Proposal Builder V2 Architecture.
// React Query hooks for the /api/v2/proposals/* namespace.
// Gated server-side behind FEATURE_PROPOSAL_V2 — every call 404s until the
// flag is enabled; the page shows a placeholder instead of mounting these.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ProposalV2Item {
  name: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ProposalV2Section {
  id: string;
  type: "text" | "items" | "pricing" | "terms" | "custom";
  title: string;
  content: string;
  items: ProposalV2Item[];
  order: number;
}

export interface ProposalV2 {
  id: string;
  proposalNumber: string;
  userId: { id: string; fullName: string; email: string } | string | null;
  externalName?: string;
  externalEmail?: string;
  externalCompany?: string;
  title: string;
  sections: ProposalV2Section[];
  currency: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  validUntil?: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  notes?: string;
  termsAndConditions?: string;
  viewToken: string;
  viewCount: number;
  sourceQuotationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalV2Stats {
  total: number;
  byStatus: Record<string, { count: number; value: number }>;
  totalValue: number;
  acceptedValue: number;
}

const KEY = ["/api/v2/proposals"];

export function useProposals(filters: { status?: string; search?: string } = {}) {
  const qs = new URLSearchParams();
  if (filters.status && filters.status !== "all") qs.set("status", filters.status);
  if (filters.search) qs.set("search", filters.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  return useQuery<ProposalV2[]>({
    queryKey: [...KEY, filters],
    queryFn: async () => {
      const r = await fetch(`/api/v2/proposals${suffix}`, { credentials: "include" });
      if (r.status === 404) return [];
      if (!r.ok) throw new Error("Failed to load proposals");
      return r.json();
    },
  });
}

export function useProposalStats() {
  return useQuery<ProposalV2Stats>({
    queryKey: [...KEY, "stats"],
    queryFn: async () => {
      const r = await fetch("/api/v2/proposals/stats", { credentials: "include" });
      if (r.status === 404) return { total: 0, byStatus: {}, totalValue: 0, acceptedValue: 0 };
      if (!r.ok) throw new Error("Failed to load stats");
      return r.json();
    },
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const r = await apiRequest("POST", "/api/v2/proposals", body);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const r = await apiRequest("PATCH", `/api/v2/proposals/${id}`, body);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useChangeProposalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const r = await apiRequest("POST", `/api/v2/proposals/${id}/status`, { status });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/v2/proposals/${id}`);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function usePrefillFromQuotation() {
  return useMutation({
    mutationFn: async (quotationId: string) => {
      const r = await apiRequest("GET", `/api/v2/proposals/from-quotation/${quotationId}`);
      return r.json();
    },
  });
}
