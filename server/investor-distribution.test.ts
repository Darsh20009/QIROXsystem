import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import {
  EmployeePaymentModel,
  FinanceAdjustmentModel,
  InvestorDistributionModel,
  InvestmentPaymentModel,
  InvestorProfileModel,
  InvoiceModel,
  OperationalExpenseModel,
  OrderExpenseModel,
  OrderModel,
  PayrollRecordModel,
  UserModel,
  approveInvestmentPayment,
} from "./models";
import { calculateMonthlyProfit, ensureInvestorDistributionIndex, parseDistributionPeriod } from "./services/investor-distribution";

test("monthly investor distributions calculate snapshots and protect payouts", async () => {
  assert.ok(process.env.MONGODB_URI, "MONGODB_URI is required for this integration check");
  await mongoose.connect(process.env.MONGODB_URI!);
  const marker = `investor-distribution-test-${Date.now()}`;
  const testYear = 2200 + (Math.floor(Date.now() / 1000) % 100);
  const testMonth = (Math.floor(Date.now() / 1000) % 12) + 1;
  const period = `${testYear}-${String(testMonth).padStart(2, "0")}`;
  const { start } = parseDistributionPeriod(period);
  const paidAt = new Date(start.getFullYear(), start.getMonth(), 10);
  const userIds: mongoose.Types.ObjectId[] = [];
  const distributionIds: mongoose.Types.ObjectId[] = [];
  const paymentIds: mongoose.Types.ObjectId[] = [];

  try {
    await ensureInvestorDistributionIndex();
    assert.throws(() => parseDistributionPeriod("2026-13"), /YYYY-MM/);

    const [client, investorA, investorB, admin] = await Promise.all([
      UserModel.create({ username: `${marker}-client`, email: `${marker}-client@example.test`, fullName: "Distribution client", role: "client" }),
      UserModel.create({ username: `${marker}-investor-a`, email: `${marker}-investor-a@example.test`, fullName: "Investor A", role: "investor" }),
      UserModel.create({ username: `${marker}-investor-b`, email: `${marker}-investor-b@example.test`, fullName: "Investor B", role: "investor" }),
      UserModel.create({ username: `${marker}-admin`, email: `${marker}-admin@example.test`, fullName: "Distribution admin", role: "admin" }),
    ]) as any[];
    userIds.push(client._id, investorA._id, investorB._id, admin._id);
    const [profileA, profileB] = await Promise.all([
      InvestorProfileModel.create({ userId: investorA._id, stakePercentage: 25, isActive: true }),
      InvestorProfileModel.create({ userId: investorB._id, stakePercentage: 75, isActive: true }),
    ]) as any[];

    const investmentPayment: any = await InvestmentPaymentModel.create({
      investorId: profileA._id,
      userId: investorA._id,
      amount: 2500,
      description: marker,
    });
    paymentIds.push(investmentPayment._id);
    const concurrentApprovals = await Promise.all(
      Array.from({ length: 8 }, () => approveInvestmentPayment(investmentPayment._id, admin._id)),
    );
    assert.equal(
      concurrentApprovals.filter((result) => result.applied).length,
      1,
      "only one concurrent approval can apply the investment",
    );
    assert.equal(
      Number((await InvestorProfileModel.findById(profileA._id)).totalInvested),
      2500,
      "concurrent approval must increment totalInvested once",
    );
    const retryApproval = await approveInvestmentPayment(investmentPayment._id, admin._id);
    assert.equal(retryApproval.applied, false, "retrying an approved payment is a no-op");
    assert.equal(
      Number((await InvestorProfileModel.findById(profileA._id)).totalInvested),
      2500,
      "retrying approval must not increment totalInvested again",
    );

    const order: any = await OrderModel.create({ userId: client._id, status: "approved", businessName: marker, totalAmount: 1000 });
    const invoice: any = await InvoiceModel.create({
      orderId: order._id, userId: client._id, invoiceNumber: marker, amount: 1000, totalAmount: 1000, status: "paid", paidAt,
    });
    const expense: any = await OrderExpenseModel.create({ orderId: order._id, description: marker, amount: 100, addedBy: admin._id });
    // Bypass Mongoose's immutable timestamp guard to seed an accounting-period
    // record; production records keep using their original createdAt value.
    await OrderExpenseModel.collection.updateOne({ _id: expense._id }, { $set: { createdAt: paidAt } });
    const opExpense: any = await OperationalExpenseModel.create({ category: "operational", description: marker, amount: 50, month: period, date: paidAt, createdBy: admin._id });
    const payroll: any = await PayrollRecordModel.create({ userId: admin._id, month: testMonth, year: testYear, netSalary: 100, status: "paid", paidAt });
    const employeePayment: any = await EmployeePaymentModel.create({ userId: admin._id, amount: 50, type: "bonus", status: "paid", paidAt });
    const credit: any = await FinanceAdjustmentModel.create({ type: "correction", direction: "credit", amount: 20, category: "other", description: marker, date: paidAt, month: period, addedBy: admin._id });
    const debit: any = await FinanceAdjustmentModel.create({ type: "correction", direction: "debit", amount: 10, category: "other", description: marker, date: paidAt, month: period, addedBy: admin._id });
    const voided: any = await FinanceAdjustmentModel.create({ type: "correction", direction: "credit", amount: 999, category: "other", description: marker, date: paidAt, month: period, isVoided: true, addedBy: admin._id });

    const calculation = await calculateMonthlyProfit(period);
    assert.equal(calculation.revenue, 1000);
    assert.equal(calculation.projectExpenses, 100);
    assert.equal(calculation.operationalExpenses, 50);
    assert.equal(calculation.payrollExpenses, 100);
    assert.equal(calculation.employeePaymentExpenses, 50);
    assert.equal(calculation.adjustments, 10, "credit and debit adjustments are signed and voided adjustments excluded");
    assert.equal(calculation.netProfit, 710);

    const dueA = calculation.netProfit * 0.25;
    const distribution: any = await InvestorDistributionModel.create({
      period, year: testYear, month: testMonth, currency: "SAR",
      revenue: calculation.revenue, projectExpenses: calculation.projectExpenses,
      operationalExpenses: calculation.operationalExpenses, payrollExpenses: calculation.payrollExpenses,
      employeePaymentExpenses: calculation.employeePaymentExpenses, adjustments: calculation.adjustments,
      totalCosts: calculation.totalCosts, netProfit: calculation.netProfit,
      distributionPercentage: 100, distributableAmount: calculation.netProfit, status: "approved", createdBy: admin._id,
      investorLines: [
        { investorId: profileA._id, userId: investorA._id, investorName: "Investor A", ownershipPercentage: 25, dueAmount: dueA, remainingAmount: dueA },
        { investorId: profileB._id, userId: investorB._id, investorName: "Investor B", ownershipPercentage: 75, dueAmount: calculation.netProfit * 0.75, remainingAmount: calculation.netProfit * 0.75 },
      ],
    });
    distributionIds.push(distribution._id);
    await InvestorProfileModel.updateOne({ _id: profileA._id }, { $set: { stakePercentage: 5 } });
    const savedLine = distribution.investorLines.find((line: any) => String(line.investorId) === String(profileA._id));
    assert.equal(savedLine.ownershipPercentage, 25, "distribution retains the ownership snapshot");

    const duplicate = InvestorDistributionModel.create({
      period, year: testYear, month: testMonth, currency: "SAR", revenue: 1, projectExpenses: 0, operationalExpenses: 0,
      payrollExpenses: 0, employeePaymentExpenses: 0, adjustments: 0, totalCosts: 0, netProfit: 1,
      distributionPercentage: 100, distributableAmount: 1, createdBy: admin._id,
    });
    await assert.rejects(duplicate, (error: any) => error?.code === 11000, "only one distribution may exist for a month");

    const lineId = savedLine._id;
    const reservePayment = (amount: number) => InvestorDistributionModel.findOneAndUpdate(
      { _id: distribution._id, status: { $in: ["approved", "partial_paid"] }, investorLines: { $elemMatch: { _id: lineId, remainingAmount: { $gte: amount } } } },
      [
        {
          $set: {
            investorLines: {
              $map: {
                input: "$investorLines",
                as: "line",
                in: {
                  $cond: [
                    { $eq: [{ $toString: "$$line._id" }, String(lineId)] },
                    {
                      $mergeObjects: [
                        "$$line",
                        {
                          paidAmount: { $add: ["$$line.paidAmount", amount] },
                          remainingAmount: { $subtract: ["$$line.remainingAmount", amount] },
                          status: { $cond: [{ $lte: [{ $subtract: ["$$line.remainingAmount", amount] }, 0.000001] }, "paid", "partial"] },
                        },
                      ],
                    },
                    "$$line",
                  ],
                },
              },
            },
          },
        },
        {
          $set: {
            status: {
              $cond: [
                {
                  $allElementsTrue: {
                    $map: { input: "$investorLines", as: "line", in: { $lte: ["$$line.remainingAmount", 0.000001] } },
                  },
                },
                "paid",
                "partial_paid",
              ],
            },
          },
        },
      ] as any,
      { returnDocument: "after", updatePipeline: true },
    );
    const concurrentPayments = await Promise.all([reservePayment(100), reservePayment(100), reservePayment(100)]);
    assert.equal(concurrentPayments.filter(Boolean).length, 1, "only one concurrent payout can reserve the available balance");
    const afterPartial: any = await InvestorDistributionModel.findById(distribution._id);
    const partialLine = afterPartial.investorLines.id(lineId);
    assert.equal(partialLine.paidAmount, 100);
    assert.equal(partialLine.remainingAmount, dueA - 100);
    assert.equal(partialLine.status, "partial");
    const finalPayment = await reservePayment(dueA - 100);
    assert.ok(finalPayment, "the remaining entitlement can be paid exactly once");
    const afterFull: any = await InvestorDistributionModel.findById(distribution._id);
    assert.equal(afterFull.investorLines.id(lineId).status, "paid");
    assert.equal(await reservePayment(0.01), null, "overpayment is rejected atomically");

    const investorALines = (await InvestorDistributionModel.find({ "investorLines.investorId": profileA._id }).lean())
      .map((item: any) => item.investorLines.find((line: any) => String(line.investorId) === String(profileA._id)));
    assert.equal(investorALines.length, 1);
    assert.equal(String(investorALines[0].investorId), String(profileA._id), "an investor result contains only its own line item");

    await Promise.all([
      InvoiceModel.deleteOne({ _id: invoice._id }),
      OrderExpenseModel.deleteOne({ _id: expense._id }),
      OperationalExpenseModel.deleteOne({ _id: opExpense._id }),
      PayrollRecordModel.deleteOne({ _id: payroll._id }),
      EmployeePaymentModel.deleteOne({ _id: employeePayment._id }),
      FinanceAdjustmentModel.deleteMany({ _id: { $in: [credit._id, debit._id, voided._id] } }),
      OrderModel.deleteOne({ _id: order._id }),
    ]);
  } finally {
    await Promise.all([
      InvestorDistributionModel.deleteMany({ _id: { $in: distributionIds } }),
      InvestmentPaymentModel.deleteMany({ _id: { $in: paymentIds } }),
      InvestorProfileModel.deleteMany({ userId: { $in: userIds } }),
      UserModel.deleteMany({ _id: { $in: userIds } }),
      InvoiceModel.deleteMany({ invoiceNumber: marker }),
      OperationalExpenseModel.deleteMany({ description: marker }),
      FinanceAdjustmentModel.deleteMany({ description: marker }),
      OrderExpenseModel.deleteMany({ addedBy: { $in: userIds } }),
      OrderModel.deleteMany({ businessName: marker }),
      PayrollRecordModel.deleteMany({ userId: { $in: userIds } }),
      EmployeePaymentModel.deleteMany({ userId: { $in: userIds } }),
    ]);
    await mongoose.disconnect();
  }
});