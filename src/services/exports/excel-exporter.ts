import * as XLSX from 'xlsx';

export interface ExcelSheetDefinition {
  name: string;
  data: Record<string, any>[];
}

/**
 * Export a single dataset as an Excel spreadsheet
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName = 'Resultados'
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, `${filename.replace(/\.xlsx$/, '')}.xlsx`);
}

/**
 * Export multiple datasets as a multi-sheet Excel spreadsheet workbook
 */
export function exportMultiSheetExcel(
  sheets: ExcelSheetDefinition[],
  filename: string
): void {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(sheetDef => {
    const worksheet = XLSX.utils.json_to_sheet(sheetDef.data);

    // Auto-fit column widths
    if (sheetDef.data.length > 0) {
      const colKeys = Object.keys(sheetDef.data[0]);
      worksheet['!cols'] = colKeys.map(key => {
        let maxLen = key.length;
        sheetDef.data.slice(0, 100).forEach(row => {
          const valStr = String(row[key] ?? '');
          if (valStr.length > maxLen) {
            maxLen = Math.min(valStr.length, 60);
          }
        });
        return { wch: Math.max(maxLen + 3, 12) };
      });
    }

    const safeSheetName = sheetDef.name.slice(0, 31).replace(/[\\/?*[\]]/g, '_');
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  });

  XLSX.writeFile(workbook, `${filename.replace(/\.xlsx$/, '')}.xlsx`);
}
