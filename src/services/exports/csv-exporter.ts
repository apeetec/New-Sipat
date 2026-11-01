import Papa from 'papaparse';

export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string,
  delimiter: ';' | ',' = ';'
): void {
  // Convert array to CSV
  const csv = Papa.unparse(data, {
    delimiter,
    quotes: true,
  });

  // Prepend UTF-8 BOM so Excel opens accents correctly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
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
