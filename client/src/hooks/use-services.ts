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

export function useService(id: string) {
  return useQuery({
    queryKey: [api.services.get.path, id],
    queryFn: async () => {
      const url = api.services.get.path.replace(":id", id);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch service");
      return res.json();
    },
    enabled: !!id,
  });
}
