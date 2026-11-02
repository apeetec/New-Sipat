import writeXlsxFile, {
  type Cell,
  type Row,
  type Sheet,
} from 'write-excel-file/browser';

export interface ExcelSheetDefinition {
  name: string;
  data: Record<string, unknown>[];
}

const FORMULA_PREFIX = /^[\u0000-\u0020]*[=+\-@]/;

/**
 * Converte valores arbitrários da aplicação para tipos válidos do XLSX.
 * O apóstrofo neutraliza conteúdo que planilhas poderiam interpretar como
 * fórmula ao abrir um arquivo exportado (CSV/Excel formula injection).
 */
function toSpreadsheetValue(value: unknown): Cell {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);

  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (!text) return '';
  return FORMULA_PREFIX.test(text) ? `'${text}` : text;
}

function normalizeFilename(filename: string): string {
  const baseName = filename.replace(/\.xlsx$/i, '').trim() || 'exportacao';
  return `${baseName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')}.xlsx`;
}

function normalizeSheetName(name: string): string {
  return (name.trim() || 'Planilha').replace(/[\\/?*[\]:]/g, '_').slice(0, 31);
}

function uniqueSheetName(name: string, usedNames: Set<string>): string {
  const normalized = normalizeSheetName(name);
  let candidate = normalized;
  let suffix = 2;

  while (usedNames.has(candidate.toLocaleLowerCase('pt-BR'))) {
    const marker = `_${suffix}`;
    candidate = `${normalized.slice(0, 31 - marker.length)}${marker}`;
    suffix += 1;
  }

  usedNames.add(candidate.toLocaleLowerCase('pt-BR'));
  return candidate;
}

function collectColumns(data: Record<string, unknown>[]): string[] {
  const columns = new Set<string>();
  data.forEach(row => Object.keys(row).forEach(key => columns.add(key)));
  return [...columns];
}

function createSheet(
  definition: ExcelSheetDefinition,
  usedNames: Set<string>
): Sheet<Blob> {
  const keys = collectColumns(definition.data);

  if (keys.length === 0) {
    return {
      sheet: uniqueSheetName(definition.name, usedNames),
      data: [[{ value: 'Sem dados', fontWeight: 'bold' }]],
      columns: [{ width: 18 }],
      stickyRowsCount: 1,
    };
  }

  const header: Row = keys.map(key => ({
    value: key,
    fontWeight: 'bold',
    backgroundColor: '#E2E8F0',
  }));

  const rows: Row[] = definition.data.map(row =>
    keys.map(key => toSpreadsheetValue(row[key]))
  );

  const columns = keys.map((key, columnIndex) => {
    let maxLength = key.length;
    rows.slice(0, 100).forEach(row => {
      const value = row[columnIndex];
      const displayValue = typeof value === 'object' && value && 'value' in value
        ? value.value
        : value;
      maxLength = Math.max(maxLength, String(displayValue ?? '').length);
    });
    return { width: Math.min(Math.max(maxLength + 3, 12), 63) };
  });

  return {
    sheet: uniqueSheetName(definition.name, usedNames),
    data: [header, ...rows],
    columns,
    stickyRowsCount: 1,
  };
}

/** Exporta um conjunto de dados como uma planilha Excel. */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = 'Resultados'
): Promise<void> {
  const usedNames = new Set<string>();
  const sheet = createSheet({ name: sheetName, data }, usedNames);
  await writeXlsxFile([sheet]).toFile(normalizeFilename(filename));
}

/** Exporta vários conjuntos de dados em abas de um único arquivo Excel. */
export async function exportMultiSheetExcel(
  sheets: ExcelSheetDefinition[],
  filename: string
): Promise<void> {
  await writeXlsxFile(createWorkbookSheets(sheets)).toFile(normalizeFilename(filename));
}

/** Gera o XLSX em memória para envio seguro à API, sem baixar o arquivo. */
export async function createMultiSheetExcelBlob(
  sheets: ExcelSheetDefinition[]
): Promise<Blob> {
  return writeXlsxFile(createWorkbookSheets(sheets)).toBlob();
}

function createWorkbookSheets(sheets: ExcelSheetDefinition[]): Sheet<Blob>[] {
  const usedNames = new Set<string>();
  return (sheets.length > 0
    ? sheets
    : [{ name: 'Resultados', data: [] }]
  ).map(sheet => createSheet(sheet, usedNames));
}
