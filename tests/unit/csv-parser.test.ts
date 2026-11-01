import { describe, it, expect } from 'vitest';
import { parseUserImportCsv } from '../../src/utils/csv-parser';

describe('Validação e Parser de CSV de Colaboradores', () => {
  it('deve processar CSV com ponto-e-vírgula, aspas e quebras de linha', () => {
    const csv = `employeeNumber;email;temporaryPassword;firstName;lastName;displayName;unit;unitNameBackup;company;adminComment;mustChangePassword;description\n` +
      `"101010";"gabriel@honda.com.br";"Pass1234";"Gabriel";"Ferreira";"Gabriel Ferreira";"PROD-SUM";"PROD-SUM";"Honda Automóveis";"Operador";"true";"Linha 1"\n` +
      `"202020";"maria@honda.com.br";"Pass5678";"Maria";"Silva";"Maria Silva";"ITI";"ITI";"Honda";"";"false";""`;

    const result = parseUserImportCsv(csv);
    expect(result.totalRows).toBe(2);
    expect(result.validRowsCount).toBe(2);
    expect(result.rows[0].employeeNumber).toBe('101010');
    expect(result.rows[0].mustChangePassword).toBe(true);
    expect(result.rows[1].mustChangePassword).toBe(false);
  });

  it('deve remover UTF-8 BOM e detectar duplicatas de matrícula no arquivo', () => {
    const bomCsv = `\uFEFFemployeeNumber;email;temporaryPassword\n` +
      `101010;teste1@honda.com.br;pass1234\n` +
      `101010;teste2@honda.com.br;pass5678`;

    const result = parseUserImportCsv(bomCsv);
    expect(result.totalRows).toBe(2);
    expect(result.rows[0].isValid).toBe(true);
    expect(result.rows[1].isValid).toBe(false);
    expect(result.rows[1].errors.employeeNumber).toContain('duplicada');
  });

  it('deve marcar erro em e-mail ou matrícula ausentes', () => {
    const invalidCsv = `employeeNumber;email;temporaryPassword\n` +
      `;email.sem.matricula@honda.com.br;pass1234\n` +
      `303030;;pass1234`;

    const result = parseUserImportCsv(invalidCsv);
    expect(result.rows[0].isValid).toBe(false);
    expect(result.rows[0].errors.employeeNumber).toBeDefined();
    expect(result.rows[1].isValid).toBe(false);
    expect(result.rows[1].errors.email).toBeDefined();
  });
});
