import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  toFile: vi.fn().mockResolvedValue(undefined),
  writeXlsxFile: vi.fn(),
}));

vi.mock('write-excel-file/browser', () => ({
  default: mocks.writeXlsxFile,
}));

import {
  exportMultiSheetExcel,
  exportToExcel,
} from '../../src/services/exports/excel-exporter';

describe('exportador XLSX seguro', () => {
  beforeEach(() => {
    mocks.toFile.mockClear();
    mocks.writeXlsxFile.mockReset();
    mocks.writeXlsxFile.mockReturnValue({ toFile: mocks.toFile });
  });

  it('neutraliza fórmulas, preserva tipos e normaliza o nome do arquivo', async () => {
    await exportToExcel(
      [{ Nome: '=HYPERLINK("https://malicioso.test")', Pontos: 10 }],
      'relatório:final.xlsx',
    );

    const sheets = mocks.writeXlsxFile.mock.calls[0]?.[0];
    expect(sheets[0].data[1]).toEqual([
      '\'=HYPERLINK("https://malicioso.test")',
      10,
    ]);
    expect(mocks.toFile).toHaveBeenCalledWith('relatório_final.xlsx');
  });

  it('gera nomes de abas válidos e únicos', async () => {
    await exportMultiSheetExcel(
      [
        { name: 'Resultados/Inseguros', data: [{ Valor: true }] },
        { name: 'Resultados/Inseguros', data: [{ Valor: false }] },
      ],
      'resultado',
    );

    const sheets = mocks.writeXlsxFile.mock.calls[0]?.[0];
    expect(sheets.map((sheet: { sheet: string }) => sheet.sheet)).toEqual([
      'Resultados_Inseguros',
      'Resultados_Inseguros_2',
    ]);
    expect(mocks.toFile).toHaveBeenCalledWith('resultado.xlsx');
  });
});
