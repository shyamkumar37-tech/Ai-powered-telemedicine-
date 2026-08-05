import jsPDF from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";

export interface PDFColumnDefinition {
  header: string;
  dataKey: string;
}

/**
 * Export data to a CSV file.
 * @param data Array of objects to export.
 * @param filename The name of the file to save as (without .csv).
 */
export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data || data.length === 0) {
    console.warn("No data available to export to CSV");
    return;
  }
  
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to a PDF file.
 * @param data Array of objects to export.
 * @param filename The name of the file to save as (without .pdf).
 * @param columns Array of objects containing { header: string, dataKey: string }.
 * @param title The title of the PDF document.
 */
export const exportToPDF = (
  data: Record<string, unknown>[],
  filename: string,
  columns: PDFColumnDefinition[],
  title = "Report"
) => {
  if (!data || data.length === 0) {
    console.warn("No data available to export to PDF");
    return;
  }

  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  // Add table
  (doc as unknown as { autoTable: (options: Record<string, unknown>) => void }).autoTable({
    startY: 36,
    head: [columns.map((col) => col.header)],
    body: data.map((item) => columns.map((col) => item[col.dataKey])),
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [79, 179, 160], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`${filename}.pdf`);
};
