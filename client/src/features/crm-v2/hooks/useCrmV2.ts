// ── CRM V2 Hooks ──────────────────────────────────────────────────────────────
// Sprint 008 — CRM V2 Foundation.
// Shared React Query hooks for all CRM V2 data.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const BASE = "/api/v2/crm";

// ── Timeline ──────────────────────────────────────────────────────────────────

export function useCustomerTimeline(customerId: string | null) {
  return useQuery<{ timeline: any[]; total: number }>({
    queryKey: [BASE, "customers", customerId, "timeline"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/customers/${customerId}/timeline`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!customerId,
    staleTime: 30_000,
  });
}

export function useLeadTimeline(leadId: string | null) {
  return useQuery<{ timeline: any[]; total: number; lead: any }>({
    queryKey: [BASE, "leads", leadId, "timeline"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/leads/${leadId}/timeline`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!leadId,
    staleTime: 30_000,
  });
}

// ── Interactions ──────────────────────────────────────────────────────────────

export function useCustomerInteractions(customerId: string | null, type?: string) {
  const url = type
    ? `${BASE}/customers/${customerId}/interactions?type=${type}`
    : `${BASE}/customers/${customerId}/interactions`;
  return useQuery<{ interactions: any[] }>({
    queryKey: [BASE, "customers", customerId, "interactions", type],
    queryFn: async () => {
      const r = await fetch(url);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!customerId,
    staleTime: 30_000,
  });
}

export function useAddCustomerInteraction(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", `${BASE}/customers/${customerId}/interactions`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, "customers", customerId] });
    },
  });
}

export function useLeadInteractions(leadId: string | null) {
  return useQuery<{ interactions: any[] }>({
    queryKey: [BASE, "leads", leadId, "interactions"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/leads/${leadId}/interactions`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!leadId,
    staleTime: 30_000,
  });
}

export function useAddLeadInteraction(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", `${BASE}/leads/${leadId}/interactions`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, "leads", leadId] });
    },
  });
}

// ── Score ─────────────────────────────────────────────────────────────────────

export function useCustomerScore(customerId: string | null) {
  return useQuery<{ score: any }>({
    queryKey: [BASE, "customers", customerId, "score"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/customers/${customerId}/score`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!customerId,
    staleTime: 60_000,
  });
}

export function useRefreshScore(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest("POST", `${BASE}/customers/${customerId}/score/refresh`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, "customers", customerId, "score"] });
    },
  });
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export function useTags(category?: string) {
  const url = category ? `${BASE}/tags?category=${category}` : `${BASE}/tags`;
  return useQuery<{ tags: any[] }>({
    queryKey: [BASE, "tags", category],
    queryFn: async () => {
      const r = await fetch(url);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 60_000,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", `${BASE}/tags`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BASE, "tags"] }); },
  });
}

// ── Segments ──────────────────────────────────────────────────────────────────

export function useSegments() {
  return useQuery<{ segments: any[] }>({
    queryKey: [BASE, "segments"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/segments`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 60_000,
  });
}

export function useCreateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", `${BASE}/segments`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BASE, "segments"] }); },
  });
}

// ── Follow-Up Rules ───────────────────────────────────────────────────────────

export function useFollowUpRules() {
  return useQuery<{ rules: any[]; catalogue: any }>({
    queryKey: [BASE, "follow-up-rules"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/follow-up-rules`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 120_000,
  });
}

// ── Reminders ─────────────────────────────────────────────────────────────────

export function useMyReminders(status?: string) {
  const url = status ? `${BASE}/reminders?status=${status}` : `${BASE}/reminders`;
  return useQuery<{ reminders: any[] }>({
    queryKey: [BASE, "reminders", status],
    queryFn: async () => {
      const r = await fetch(url);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 30_000,
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", `${BASE}/reminders`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BASE, "reminders"] }); },
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `${BASE}/reminders/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BASE, "reminders"] }); },
  });
}

// ── Opportunities ─────────────────────────────────────────────────────────────

export function useOpportunities(filters?: { stageId?: string; assignedTo?: string; subjectId?: string }) {
  const params = new URLSearchParams(filters as any).toString();
  const url = params ? `${BASE}/opportunities?${params}` : `${BASE}/opportunities`;
  return useQuery<{ opportunities: any[] }>({
    queryKey: [BASE, "opportunities", filters],
    queryFn: async () => {
      const r = await fetch(url);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 30_000,
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", `${BASE}/opportunities`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, "opportunities"] });
      qc.invalidateQueries({ queryKey: [BASE, "pipeline"] });
    },
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `${BASE}/opportunities/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BASE, "opportunities"] });
      qc.invalidateQueries({ queryKey: [BASE, "pipeline"] });
    },
  });
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export function usePipeline() {
  return useQuery<{ stages: any[]; totalValue: number; weightedValue: number; totalOpportunities: number }>({
    queryKey: [BASE, "pipeline"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/pipeline`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 30_000,
  });
}

export function useCreatePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", `${BASE}/pipeline/stages`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BASE, "pipeline"] }); },
  });
}

// ── Stats ──────────────────────────────────────────────────────────────────────

export function useCrmV2Stats() {
  return useQuery<any>({
    queryKey: [BASE, "stats"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/stats`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 60_000,
  });
}
