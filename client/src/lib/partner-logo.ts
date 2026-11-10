import type { Partner } from "@shared/schema";

const transparentPartnerLogos: Record<string, { sourceUrl: string; src: string; darkSurface?: boolean }> = {
  "699fd00de7c8894f5e43dce4": { sourceUrl: "/uploads/1d8ee746c22e9535ba72203472d5bf39.png", src: "/partners/partner-699fd00de7c8894f5e43dce4.png", darkSurface: true },
  "69a8a8a06a9a2363a258dfb4": { sourceUrl: "/uploads/0ff34d8536ea862e4eee5ace55af628d.png", src: "/partners/partner-69a8a8a06a9a2363a258dfb4.png" },
  "69b0ef0a989701cb90679391": { sourceUrl: "/uploads/8b6bf8667f70f75c3d0c140693dbb703.jpeg", src: "/partners/partner-69b0ef0a989701cb90679391.png" },
  "69dc1ca38934f3bfb63a79fe": { sourceUrl: "/uploads/80c745d1f89526402d1026debc8031a7.png", src: "/partners/partner-69dc1ca38934f3bfb63a79fe.png", darkSurface: true },
  "69dc1d8e8934f3bfb63a7ab8": { sourceUrl: "/uploads/4dcb30febb869843277cfae588d69257.png", src: "/partners/partner-69dc1d8e8934f3bfb63a7ab8.png" },
  "69e916a8865f56721881ec69": { sourceUrl: "/uploads/e5edcae0acea1e17b27780715b96ba17.png", src: "/partners/partner-69e916a8865f56721881ec69.png", darkSurface: true },
  "69fa4a78d105b6ab105ff38c": { sourceUrl: "/uploads/4bab910748133e1f2f7eaeb184777389.png", src: "/partners/partner-69fa4a78d105b6ab105ff38c.png" },
  "69fb1f09c04e979aa3ffafac": { sourceUrl: "/uploads/052d1870547ec1f36c3f262c796f1d21.png", src: "/partners/partner-69fb1f09c04e979aa3ffafac.png" },
  "69fb2079c04e979aa3ffb128": { sourceUrl: "/uploads/afbe92c25d295e343e80b0d99b6e5a39.png", src: "/partners/partner-69fb2079c04e979aa3ffb128.png" },
  "69fb2199c04e979aa3ffb336": { sourceUrl: "/uploads/4b4530eb2dac142be87de288068df7d8.png", src: "/partners/partner-69fb2199c04e979aa3ffb336.png" },
  "6a21466f2dc76632d50ac3bd": { sourceUrl: "/uploads/3a50aa8cc69aa903b667e8ff0a9c02b8.png", src: "/partners/partner-6a21466f2dc76632d50ac3bd.png" },
  "6a2ea44febc072988ce4e939": { sourceUrl: "/uploads/8ab3ef068db362444bcbb0feabee2ebe.png", src: "/partners/partner-6a2ea44febc072988ce4e939.png" },
  "6a2ea50aebc072988ce4e93a": { sourceUrl: "/uploads/5acb9c189f104650128ddee5073faac1.png", src: "/partners/partner-6a2ea50aebc072988ce4e93a.png", darkSurface: true },
  "6a445bf1a2f4837b4ed95932": { sourceUrl: "/uploads/9dc3eda323b3b79697a3e923c6767a3f.png", src: "/partners/partner-6a445bf1a2f4837b4ed95932.png" },
  "6a445c6ba2f4837b4ed95933": { sourceUrl: "/uploads/71a769f5420c533946bffeec1cb56f52.png", src: "/partners/partner-6a445c6ba2f4837b4ed95933.png", darkSurface: true },
  "6ac04933cd59682fe850216a": { sourceUrl: "/uploads/saas-logos/3578f9c1-eb93-4020-8cf3-b3acb51180a1-original.jpg", src: "/partners/partner-6ac04933cd59682fe850216a.png", darkSurface: true },
};

export function normalizePartnerName(value?: string | null): string {
  return String(value || "").normalize("NFKC").toLocaleLowerCase().replace(/[\s&.'’_-]+/g, "");
}

export function getPartnerLogoPresentation(partner: Pick<Partner, "id" | "logoUrl">) {
  const presentation = transparentPartnerLogos[partner.id];
  const useTransparentLogo = presentation?.sourceUrl === partner.logoUrl;
  return {
    src: useTransparentLogo ? presentation.src : partner.logoUrl,
    darkSurface: Boolean(useTransparentLogo && presentation?.darkSurface),
  };
}

export function findPartnerForProject(
  partners: Partner[],
  partnerId?: string | null,
  projectNames: Array<string | null | undefined> = [],
): Partner | undefined {
  if (partnerId) {
    const byId = partners.find(partner => String(partner.id) === String(partnerId));
    if (byId) return byId;
  }

  const projectNameKeys = new Set(projectNames.map(normalizePartnerName).filter(Boolean));
  if (!projectNameKeys.size) return undefined;

  const matches = partners.filter(partner =>
    [partner.name, partner.nameAr].some(name => projectNameKeys.has(normalizePartnerName(name))),
  );
  return matches.length === 1 ? matches[0] : undefined;
}