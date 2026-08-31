export type GitHubVisibility = "public" | "private";

export function resetGitHubVisibilitySelection() {
  return {
    visibility: "private" as GitHubVisibility,
    loadedOrderId: null as string | null,
  };
}

export function canSaveGitHubVisibility(
  selectedOrderId: string | undefined,
  loadedOrderId: string | null,
  querySucceeded: boolean,
  queryFetching: boolean,
) {
  return Boolean(
    selectedOrderId
    && loadedOrderId === selectedOrderId
    && querySucceeded
    && !queryFetching,
  );
}