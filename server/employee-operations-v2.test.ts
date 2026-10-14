import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { generateEmployeeWorkContractPdf } from "./services/pdf.service";
import { roleNotice, subscriptionNotice, terminationNotice } from "./domains/employee-operations-v2/routes";

test("employee operation messages name the person, project and role", () => {
  const employee = { fullName: "سارة العتيبي", role: "developer", jobTitle: "مهندسة برمجيات" };
  const roleMessage = roleNotice(employee);
  assert.match(roleMessage, /سارة العتيبي/);
  assert.match(roleMessage, /مطور/);
  assert.match(roleMessage, /مهندسة برمجيات/);

  const terminationMessage = terminationNotice(employee);
  assert.match(terminationMessage, /سارة العتيبي/);
  assert.match(terminationMessage, /إيقاف صلاحيات الدخول/);

  const project = {
    name: "مقهى الساحة",
    client: { name: "شركة الساحة" },
    subscription: { period: "annual", expiresAt: "2027-02-01T12:00:00.000Z" },
  };
  const clientReminder = subscriptionNotice(project, { fullName: "فهد" }, "client");
  const staffReminder = subscriptionNotice(project, employee, "employee");
  assert.match(clientReminder, /فهد/);
  assert.match(clientReminder, /مقهى الساحة/);
  assert.match(staffReminder, /شركة الساحة/);
  assert.match(staffReminder, /مقهى الساحة/);
});

test("employment contract draft renders as a PDF with the shared Arabic logo pipeline", async () => {
  const bytes = await generateEmployeeWorkContractPdf({
    contractNumber: "EMP-TEST-1001",
    employerName: "QIROX Studio",
    employerLegalName: "شركة اختبار",
    employerCommercialReg: "1010101010",
    employeeName: "سارة العتيبي",
    employeeNationalId: "1000000000",
    employeeRole: "مطور",
    jobTitle: "مهندسة برمجيات",
    salaryDescription: "8,000 ريال سعودي شهريًا",
    startDate: "2026-11-01",
    contractType: "fixed",
    endDate: "2027-10-31",
    workLocation: "الرياض",
    weeklyHours: 40,
    probationDays: 90,
    jurisdiction: "المملكة العربية السعودية",
  });
  assert.equal(Buffer.from(bytes).subarray(0, 4).toString("ascii"), "%PDF");
  const parsed = await PDFDocument.load(bytes);
  assert.ok(parsed.getPageCount() >= 1);
});
