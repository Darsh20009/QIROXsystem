import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertProjectVault } from "@shared/schema";

export function useVault(projectId: string) {
  return useQuery({
    queryKey: ["/api/projects", projectId, "vault"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/vault`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vault items");
      return await res.json();
    },
    enabled: !!projectId,
  });
}

export function useCreateVaultItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: InsertProjectVault }) => {
      const res = await fetch(`/api/projects/${projectId}/vault`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create vault item");
      return await res.json();
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "vault"] });
    },
  });
}
