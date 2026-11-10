import { useQuery } from "@tanstack/react-query";

export type DocumentCatalogOption = {
  id: string;
  name: string;
  price: number;
  description: string;
  source: "service" | "product";
};

type ServiceRecord = {
  id?: string;
  _id?: string;
  title?: string;
  description?: string;
  priceMin?: number;
  priceMax?: number;
  features?: unknown;
};

type ProductRecord = {
  id?: string;
  _id?: string;
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price?: number;
  specs?: unknown;
  specifications?: unknown;
  planBundles?: Array<Record<string, any>>;
};

function textValue(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) return value.flatMap(textValue);
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([key, item]) => textValue(item).map(text => `${key}: ${text}`));
  }
  return [];
}

function localized(primary: unknown, fallback: unknown): string {
  return textValue(primary)[0] || textValue(fallback)[0] || "";
}

function normalizeCatalog(
  services: ServiceRecord[],
  products: ProductRecord[],
  isArabic: boolean,
): DocumentCatalogOption[] {
  const serviceOptions: DocumentCatalogOption[] = services.flatMap((service) => {
    const id = String(service.id || service._id || "");
    if (!id) return [];
    const details = [
      ...textValue(service.description),
      ...textValue(service.features),
    ];
    return [{
      id: `service:${id}`,
      name: String(service.title || (isArabic ? "خدمة" : "Service")),
      price: Number(service.priceMin ?? service.priceMax ?? 0) || 0,
      description: [...new Set(details)].join(" • "),
      source: "service",
    }];
  });

  const productOptions: DocumentCatalogOption[] = products.flatMap((product) => {
    const id = String(product.id || product._id || "");
    if (!id) return [];
    const productName = localized(isArabic ? product.nameAr : product.name, isArabic ? product.name : product.nameAr)
      || (isArabic ? "منتج" : "Product");
    const productDetails = [
      localized(isArabic ? product.descriptionAr : product.description, isArabic ? product.description : product.descriptionAr),
      ...textValue(product.specs ?? product.specifications),
    ];
    const base: DocumentCatalogOption = {
      id: `product:${id}`,
      name: productName,
      price: Number(product.price) || 0,
      description: [...new Set(productDetails.filter(Boolean))].join(" • "),
      source: "product",
    };
    const bundleOptions = (product.planBundles || []).map((bundle, index): DocumentCatalogOption => {
      const bundleName = localized(
        isArabic ? bundle.planNameAr : bundle.planName,
        isArabic ? bundle.planName : bundle.planNameAr,
      ) || (isArabic ? `باقة ${index + 1}` : `Plan ${index + 1}`);
      const bundleDetails = [
        localized(isArabic ? bundle.planDescAr : bundle.planDesc, isArabic ? bundle.planDesc : bundle.planDescAr),
        ...textValue(bundle.features),
      ];
      return {
        id: `bundle:${id}:${index}`,
        name: `${productName} — ${bundleName}`,
        price: bundle.isFree ? 0 : Number(bundle.customPrice ?? product.price ?? 0) || 0,
        description: [...new Set([...productDetails, ...bundleDetails].filter(Boolean))].join(" • "),
        source: "product",
      };
    });
    return [base, ...bundleOptions];
  });

  return [...serviceOptions, ...productOptions];
}

export function useDocumentCatalog(isArabic: boolean) {
  return useQuery<DocumentCatalogOption[]>({
    queryKey: ["/api/document-catalog", isArabic ? "ar" : "en"],
    staleTime: 30_000,
    queryFn: async () => {
      const [servicesResponse, productsResponse] = await Promise.all([
        fetch("/api/services", { credentials: "include" }),
        fetch("/api/admin/products", { credentials: "include" }),
      ]);
      if (!servicesResponse.ok || !productsResponse.ok) {
        throw new Error("Unable to load the product and service catalog");
      }
      const [servicesPayload, productsPayload] = await Promise.all([
        servicesResponse.json(),
        productsResponse.json(),
      ]);
      const services = Array.isArray(servicesPayload) ? servicesPayload : servicesPayload?.services || [];
      const products = Array.isArray(productsPayload) ? productsPayload : productsPayload?.products || [];
      return normalizeCatalog(services, products, isArabic);
    },
  });
}