// PDF export باستخدام pdfmake مع خط عربي
// ملاحظة: pdfmake يحتاج تسجيل خط عربي vfs. نستعمل أسلوب dynamic import + fallback.
// للخط العربي، نستخدم Amiri (محرر للنشر الرقمي) — سيُحمَّل من شبكة CDN كـ base64 عند أول تصدير.

type PdfMake = {
  createPdf: (doc: unknown) => { download: (filename: string) => void };
  vfs: Record<string, string>;
  fonts?: Record<string, unknown>;
};

let pdfMakeCache: PdfMake | null = null;

async function getPdfMake(): Promise<PdfMake> {
  if (pdfMakeCache) return pdfMakeCache;
  const mod = await import("pdfmake/build/pdfmake");
  const pdfMake = (mod as unknown as { default: PdfMake }).default ?? (mod as unknown as PdfMake);

  // حمّل خط Amiri من ملف محلي إن توفّر، أو من الشبكة
  const fontUrl = "https://cdn.jsdelivr.net/npm/@fontsource/amiri@4.5.0/files/amiri-arabic-400-normal.woff";
  try {
    const res = await fetch(fontUrl);
    const buf = new Uint8Array(await res.arrayBuffer());
    const b64 = btoa(String.fromCharCode(...buf));
    pdfMake.vfs = pdfMake.vfs ?? {};
    pdfMake.vfs["Amiri.woff"] = b64;
    pdfMake.fonts = {
      Amiri: { normal: "Amiri.woff", bold: "Amiri.woff", italics: "Amiri.woff", bolditalics: "Amiri.woff" },
    };
  } catch {
    // fallback: استعمل الخط الافتراضي (قد لا يعرض العربية جيداً)
  }

  pdfMakeCache = pdfMake;
  return pdfMake;
}

type TableCell = string | number | { text: string; bold?: boolean; fillColor?: string };

export async function saveAsPDF(
  filename: string,
  title: string,
  tables: Array<{ heading?: string; headers: string[]; rows: TableCell[][] }>
) {
  const pdfMake = await getPdfMake();

  const content: unknown[] = [
    { text: title, style: "header", alignment: "right" },
    { text: new Date().toLocaleDateString("ar-EG"), alignment: "right", margin: [0, 0, 0, 10] },
  ];

  for (const t of tables) {
    if (t.heading) content.push({ text: t.heading, style: "sub", alignment: "right", margin: [0, 10, 0, 5] });
    content.push({
      table: {
        headerRows: 1,
        widths: t.headers.map(() => "*"),
        body: [
          t.headers.map(h => ({ text: h, bold: true, fillColor: "#E7F5EC", alignment: "right" })),
          ...t.rows.map(r => r.map(c => typeof c === "object" ? c : { text: String(c ?? ""), alignment: "right" })),
        ],
      },
      layout: "lightHorizontalLines",
    });
  }

  const doc = {
    pageOrientation: "portrait" as const,
    pageMargins: [30, 30, 30, 30],
    defaultStyle: { font: "Amiri", fontSize: 10, alignment: "right" as const },
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      sub: { fontSize: 14, bold: true },
    },
    content,
  };

  pdfMake.createPdf(doc).download(filename);
}
