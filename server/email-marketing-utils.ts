export function getEmailMarketingBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const configuredUrl = env.EMAIL_SITE_URL;
  if (configuredUrl) {
    return configuredUrl.startsWith("http") ? configuredUrl : `https://${configuredUrl}`;
  }

  const domain = env.REPLIT_DEV_DOMAIN || "https://qiroxstudio.online";
  return domain.startsWith("http") ? domain : `https://${domain}`;
}
