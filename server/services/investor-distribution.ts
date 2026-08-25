import {
  EmployeePaymentModel,
  FinanceAdjustmentModel,
  InvestorDistributionModel,
  InvoiceModel,
  OperationalExpenseModel,
  OrderExpenseModel,
  PayrollRecordModel,
} from "../models";

/**
 * Production keeps Mongoose autoIndex disabled, so financial uniqueness must
 * be established explicitly during database startup rather than relying on a
 * development-only schema side effect.
 */
export async function ensureInvestorDistributionIndex(): Promise<void> {
  const duplicatePeriods = await InvestorDistributionModel.aggregate([
    { $group: { _id: "$period", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]);
  if (duplicatePeriods.length) {
    throw new Error(`تعذر تفعيل توزيعات الأرباح: توجد توزيعات مكررة للفترة ${duplicatePeriods[0]._id}`);
  }
  await InvestorDistributionModel.collection.createIndex(
    { period: 1 },
    { unique: true },
  );
}

export type MonthlyProfitCalculation = {
  period: string;
  year: number;
  month: number;
  start: Date;
  end: Date;
  revenue: number;
  projectExpenses: number;
  operationalExpenses: number;
  payrollExpenses: number;
  employeePaymentExpenses: number;
  adjustments: number;
  totalCosts: number;
  netProfit: number;
  invoiceCount: number;
  adjustmentCount: number;
};

export function parseDistributionPeriod(value: unknown): { period: string; year: number; month: number; start: Date; end: Date } {
  const period = String(value || "");
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(period);
  if (!match) throw new Error("الفترة يجب أن تكون بصيغة YYYY-MM");
  const year = Number(match[1]);
  const month = Number(match[2]);
  return {
    period,
    year,
    month,
    // Finance records currently use the server's local calendar month.
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  };
}

export async function calculateMonthlyProfit(value: unknown): Promise<MonthlyProfitCalculation> {
  const parsed = parseDistributionPeriod(value);
  const [
    paidInvoices,
    projectExpenses,
    operationalExpenses,
    payrollRecords,
    employeePayments,
    adjustments,
  ] = await Promise.all([
    InvoiceModel.find({ status: "paid", paidAt: { $gte: parsed.start, $lt: parsed.end } })
      .select("totalAmount").lean(),
    OrderExpenseModel.find({ createdAt: { $gte: parsed.start, $lt: parsed.end } })
      .select("amount").lean(),
    OperationalExpenseModel.find({ month: parsed.period }).select("amount").lean(),
    PayrollRecordModel.find({ year: parsed.year, month: parsed.month, status: "paid" })
      .select("netSalary").lean(),
    // These are ad-hoc employee payments, separate from monthly payroll rows.
    EmployeePaymentModel.find({ status: "paid", paidAt: { $gte: parsed.start, $lt: parsed.end } })
      .select("amount").lean(),
    FinanceAdjustmentModel.find({ month: parsed.period, isVoided: { $ne: true } })
      .select("amount direction").lean(),
  ]);

  const sum = (items: any[], field: string) =>
    items.reduce((total, item) => total + Math.max(0, Number(item?.[field]) || 0), 0);
  const adjustmentsTotal = (adjustments as any[]).reduce((total, item) => {
    const amount = Math.max(0, Number(item?.amount) || 0);
    return total + (item?.direction === "debit" ? -amount : amount);
  }, 0);
  const revenue = sum(paidInvoices as any[], "totalAmount");
  const projectCost = sum(projectExpenses as any[], "amount");
  const operationalCost = sum(operationalExpenses as any[], "amount");
  const payrollCost = sum(payrollRecords as any[], "netSalary");
  const employeePaymentCost = sum(employeePayments as any[], "amount");
  const totalCosts = projectCost + operationalCost + payrollCost + employeePaymentCost;
  const netProfit = revenue + adjustmentsTotal - totalCosts;

  return {
    ...parsed,
    revenue,
    projectExpenses: projectCost,
    operationalExpenses: operationalCost,
    payrollExpenses: payrollCost,
    employeePaymentExpenses: employeePaymentCost,
    adjustments: adjustmentsTotal,
    totalCosts,
    netProfit,
    invoiceCount: paidInvoices.length,
    adjustmentCount: adjustments.length,
  };
}