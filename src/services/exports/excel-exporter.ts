import * as XLSX from 'xlsx';

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName = 'Resultados'
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename.replace(/\.xlsx$/, '')}.xlsx`);
}
