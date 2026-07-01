import ExcelJS from "exceljs";

export interface ExcelSheet {
  name: string;
  data: Record<string, unknown>[];
}

export async function exportToExcel(filename: string, sheets: ExcelSheet[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    if (sheet.data.length === 0) continue;

    const headers = Object.keys(sheet.data[0]);
    worksheet.addRow(headers);

    for (const row of sheet.data) {
      worksheet.addRow(headers.map((h) => row[h] ?? ""));
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
