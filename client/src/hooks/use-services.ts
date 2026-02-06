import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useServices() {
  return useQuery({
    queryKey: [api.services.list.path],
    queryFn: async () => {
      const res = await fetch(api.services.list.path);
      if (!res.ok) throw new Error("Failed to fetch services");
      return api.services.list.responses[200].parse(await res.json());
    },
  });
}

export function useService(id: number) {
  return useQuery({
    queryKey: [api.services.get.path, id],
    queryFn: async () => {
      // Manually construct URL since buildUrl helper is on server side or shared
      // Ideally import buildUrl from shared/routes if possible, or replicate logic
      const url = api.services.get.path.replace(":id", id.toString());
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch service");
      return api.services.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
