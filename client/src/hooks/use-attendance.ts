import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useAttendanceStatus() {
  return useQuery({
    queryKey: ["/api/attendance/status"],
    queryFn: async () => {
      const res = await fetch("/api/attendance/status");
      if (!res.ok) throw new Error("Failed to fetch attendance status");
      return await res.json();
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ipAddress?: string; location?: { lat: number; lng: number } }) => {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to check in");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to check out");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
    },
  });
}
