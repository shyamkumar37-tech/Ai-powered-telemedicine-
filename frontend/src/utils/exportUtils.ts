import jsPDF from "jspdf";
import "jspdf-autotable";
// @ts-expect-error - Auto-suppressed during migration
import Papa from "papaparse";
import { DynamicStateObject } from "./../types/DynamicState";

/**
 * Export data to a CSV file.
 * @param {Array} data - Array of objects to export.
 * @param {String} filename - The name of the file to save as (without .csv).
 */
export const exportToCSV = (data: DynamicStateObject, filename: DynamicStateObject) => {
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
 * @param {Array} data - Array of objects to export.
 * @param {String} filename - The name of the file to save as (without .pdf).
 * @param {Array} columns - Array of objects containing { header: String, dataKey: String }.
 * @param {String} title - The title of the PDF document.
 */
export const exportToPDF = (data: DynamicStateObject, filename: DynamicStateObject, columns: DynamicStateObject, title = "Report") => {
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
  // @ts-expect-error - Auto-suppressed during migration
  doc.autoTable({
    startY: 36,
    head: [columns.map((col: DynamicStateObject) => col.header)],
    body: data.map((item: DynamicStateObject) => columns.map((col: DynamicStateObject) => (item as DynamicStateObject)[col.dataKey])),
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [79, 179, 160], textColor: 255 }, // matches teal-500 roughly
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`${filename}.pdf`);
};
