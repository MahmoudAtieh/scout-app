import ExcelJS from "exceljs";

export async function saveAsExcel(
  filename: string,
  sheets: Array<{ name: string; headers: string[]; rows: (string | number | null)[][] }>
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "نظام إدارة الوحدة الكشفية";
  wb.created = new Date();

  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name, { views: [{ rightToLeft: true }] });
    ws.addRow(s.headers).font = { bold: true };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7F5EC" } };
    s.rows.forEach(r => ws.addRow(r));
    ws.columns.forEach(col => {
      let max = 10;
      col.eachCell?.(c => {
        const len = String(c.value ?? "").length;
        if (len > max) max = len;
      });
      col.width = Math.min(max + 2, 40);
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
