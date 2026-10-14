import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DocumentCatalogOption } from "@/hooks/use-document-catalog";

export function CatalogItemSelect({
  lang,
  value,
  options,
  isLoading,
  isError,
  onValueChange,
}: {
  lang: string;
  value: string;
  options: DocumentCatalogOption[];
  isLoading: boolean;
  isError: boolean;
  onValueChange: (value: string) => void;
}) {
  const L = lang === "ar";
  const placeholder = isLoading
    ? (L ? "جارٍ تحميل المنتجات والخدمات..." : "Loading products and services...")
    : isError
      ? (L ? "تعذر تحميل قائمة المنتجات والخدمات" : "Could not load the catalog")
      : (L ? "اختر منتجاً أو خدمة موجودة" : "Select an existing product or service");

  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 text-xs border-black/[0.10]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map(option => (
          <SelectItem key={option.id} value={option.id}>
            {option.name} — {option.price.toLocaleString()} {L ? "ر.س" : "SAR"} · {option.source === "service" ? (L ? "خدمة" : "Service") : (L ? "منتج" : "Product")}
          </SelectItem>
        ))}
        {!options.length && !isLoading && (
          <SelectItem value="catalog-empty" disabled>
            {isError ? placeholder : (L ? "لا توجد عناصر في القائمة" : "No catalog items found")}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}