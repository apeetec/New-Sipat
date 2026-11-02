import Papa from 'papaparse';

const FORMULA_PREFIX = /^[\u0000-\u0020]*[=+\-@]/;

function safeSpreadsheetValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return FORMULA_PREFIX.test(value) ? `'${value}` : value;
}

export function createCsvBlob<T extends Record<string, any>>(
  data: T[],
  delimiter: ';' | ',' = ';'
): Blob {
  const safeData = data.map(row => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, safeSpreadsheetValue(value)])
  ));
  const csv = Papa.unparse(safeData, { delimiter, quotes: true });
  return new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
}

export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string,
  delimiter: ';' | ',' = ';'
): void {
  const blob = createCsvBlob(data, delimiter);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyTableToClipboard<T extends Record<string, any>>(data: T[]): Promise<void> {
  if (data.length === 0) return Promise.resolve();
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => String(row[h] ?? '')).join('\t'));
  const tsv = [headers.join('\t'), ...rows].join('\n');
  return navigator.clipboard.writeText(tsv);
}
