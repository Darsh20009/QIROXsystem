export function rewriteSandboxPreviewPath(requestPath: string, projectId: string, preserveBasePath: boolean): string {
  const prefix = `/sandbox/${projectId}/preview`;
  const queryAt = requestPath.indexOf("?");
  const pathname = queryAt < 0 ? requestPath : requestPath.slice(0, queryAt);
  const query = queryAt < 0 ? "" : requestPath.slice(queryAt);
  const hasPrefix = pathname === prefix || pathname.startsWith(`${prefix}/`);
  const relativePath = hasPrefix ? pathname.slice(prefix.length) || "/" : pathname || "/";
  const normalizedPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${preserveBasePath ? prefix : ""}${normalizedPath}${query}`;
}