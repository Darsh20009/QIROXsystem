export type QuotationLineInput = {
  name?: unknown;
  description?: unknown;
  qty?: unknown;
  unitPrice?: unknown;
};

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateQuotationTotals(
  items: QuotationLineInput[],
  vatRateInput: unknown = 15,
  discountPercentInput: unknown = 0,
) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("يجب إضافة بند واحد على الأقل");
  }
  const vatRate = Number(vatRateInput);
  const discountPercent = Number(discountPercentInput);
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    throw new Error("نسبة الضريبة يجب أن تكون بين 0 و100");
  }
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error("نسبة الخصم يجب أن تكون بين 0 و100");
  }

  const normalizedItems = items.map((item) => {
    const qty = Number(item.qty);
    const unitPrice = Number(item.unitPrice);
    if (!String(item.name || "").trim() || !Number.isFinite(qty) || qty <= 0 ||
        !Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error("تحقق من اسم وكمية وسعر كل بند");
    }
    return {
      name: String(item.name).trim(),
      description: String(item.description || ""),
      qty,
      unitPrice: money(unitPrice),
      total: money(qty * unitPrice),
    };
  });

  const amount = money(normalizedItems.reduce((sum, item) => sum + item.total, 0));
  const discountAmount = money(amount * discountPercent / 100);
  const taxableAmount = money(amount - discountAmount);
  const vatAmount = money(taxableAmount * vatRate / 100);
  return {
    items: normalizedItems,
    amount,
    discountPercent,
    discountAmount,
    vatRate,
    vatAmount,
    totalAmount: money(taxableAmount + vatAmount),
  };
}
