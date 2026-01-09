import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { UserPreferences } from "@shared/schema";

export function usePreferences() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery<UserPreferences | null>({
    queryKey: ["/api/preferences"],
    queryFn: async () => {
      const response = await fetch("/api/preferences", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error("Failed to fetch preferences");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const response = await apiRequest("PATCH", "/api/preferences", updates);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/preferences"], data);
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}
