import Papa from 'papaparse';

export interface UserImportRow {
  index: number;
  employeeNumber: string;
  email: string;
  temporaryPassword?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  unit: string;
  unitNameBackup?: string;
  company?: string;
  adminComment?: string;
  mustChangePassword: boolean;
  description?: string;
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

export interface CsvValidationResult {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  rows: UserImportRow[];
  headers: string[];
  missingHeaders: string[];
  unknownHeaders: string[];
}

export const EXPECTED_IMPORT_COLUMNS = [
  'employeeNumber',
  'email',
  'temporaryPassword',
  'firstName',
  'lastName',
  'displayName',
  'unit',
  'unitNameBackup',
  'company',
  'adminComment',
  'mustChangePassword',
  'description',
] as const;

export const COLUMN_LABELS_PT: Record<string, string> = {
  employeeNumber: 'Matrícula',
  email: 'E-mail',
  temporaryPassword: 'Senha Provisória',
  firstName: 'Primeiro Nome',
  lastName: 'Sobrenome',
  displayName: 'Nome de Exibição',
  unit: 'Unidade',
  unitNameBackup: 'Unidade (Backup)',
  company: 'Empresa',
  adminComment: 'Observação Admin',
  mustChangePassword: 'Exigir Troca Senha',
  description: 'Descrição/Cargo',
};

export function parseBooleanValue(val: any, defaultVal = true): boolean {
  if (val === undefined || val === null || val === '') return defaultVal;
  const s = String(val).trim().toLowerCase();
  if (['1', 'true', 'sim', 's', 'yes', 'y'].includes(s)) return true;
  if (['0', 'false', 'não', 'nao', 'n', 'no'].includes(s)) return false;
  return defaultVal;
}

export function parseUserImportCsv(csvContent: string): CsvValidationResult {
  // Strip BOM if present
  let cleanCsv = csvContent;
  if (cleanCsv.charCodeAt(0) === 0xFEFF) {
    cleanCsv = cleanCsv.slice(1);
  }

  // Auto-detect delimiter (; or ,)
  const firstLine = cleanCsv.split(/\r?\n/)[0] || '';
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const parsed = Papa.parse<Record<string, string>>(cleanCsv, {
    delimiter,
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: h => h.trim(),
  });

  const headers = parsed.meta.fields || [];
  const normalizedHeaders = headers.map(h => h.trim());

  const missingHeaders = EXPECTED_IMPORT_COLUMNS.filter(
    col => !['temporaryPassword', 'unitNameBackup', 'company', 'adminComment', 'description'].includes(col) &&
           !normalizedHeaders.some(h => h.toLowerCase() === col.toLowerCase())
  );

  const unknownHeaders = normalizedHeaders.filter(
    h => !EXPECTED_IMPORT_COLUMNS.some(col => col.toLowerCase() === h.toLowerCase())
  );

  const rows: UserImportRow[] = [];
  const seenEmployees = new Set<string>();
  const seenEmails = new Set<string>();

  parsed.data.forEach((row, idx) => {
    // Map case-insensitive keys
    const getVal = (key: string): string => {
      const actualKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
      return (actualKey ? row[actualKey] || '' : '').trim();
    };

    const employeeNumber = getVal('employeeNumber') || getVal('matricula') || getVal('login');
    const email = getVal('email') || getVal('e-mail');
    const temporaryPassword = getVal('temporaryPassword') || getVal('senha') || getVal('password');
    const firstName = getVal('firstName') || getVal('nome') || '';
    const lastName = getVal('lastName') || getVal('sobrenome') || '';
    const displayName = getVal('displayName') || `${firstName} ${lastName}`.trim() || employeeNumber;
    const unit = getVal('unit') || getVal('unidade') || '';
    const unitNameBackup = getVal('unitNameBackup');
    const company = getVal('company') || getVal('empresa');
    const adminComment = getVal('adminComment');
    const mustChangePassword = parseBooleanValue(getVal('mustChangePassword'), true);
    const description = getVal('description');

    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // Validations
    if (!employeeNumber) {
      errors.employeeNumber = 'Matrícula é obrigatória.';
    } else if (seenEmployees.has(employeeNumber.toLowerCase())) {
      errors.employeeNumber = 'Matrícula duplicada no arquivo.';
    } else {
      seenEmployees.add(employeeNumber.toLowerCase());
    }

    if (!email) {
      errors.email = 'E-mail é obrigatório.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Formato de e-mail inválido.';
    } else if (seenEmails.has(email.toLowerCase())) {
      errors.email = 'E-mail duplicado no arquivo.';
    } else {
      seenEmails.add(email.toLowerCase());
    }

    if (!temporaryPassword) {
      errors.temporaryPassword = 'Senha provisória é obrigatória.';
    } else if (temporaryPassword.length < 6) {
      warnings.push('Senha provisória com menos de 6 caracteres.');
    }

    if (!unit) {
      warnings.push('Unidade não informada; usuário ficará sem unidade vinculada.');
    }

    const isValid = Object.keys(errors).length === 0;

    rows.push({
      index: idx + 1,
      employeeNumber,
      email,
      temporaryPassword,
      firstName,
      lastName,
      displayName,
      unit,
      unitNameBackup,
      company,
      adminComment,
      mustChangePassword,
      description,
      isValid,
      errors,
      warnings,
    });
  });

  return {
    totalRows: rows.length,
    validRowsCount: rows.filter(r => r.isValid).length,
    invalidRowsCount: rows.filter(r => !r.isValid).length,
    rows,
    headers,
    missingHeaders,
    unknownHeaders,
  };
}
