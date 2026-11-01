import { describe, it, expect } from 'vitest';
import { validatePasswordStrength, constantTimeCompare } from '../../src/utils/security';
import { formatDateToSaoPaulo } from '../../src/utils/formatters';

describe('Utilitários de Segurança e Formatação de Fuso Horário', () => {
  it('deve validar política de senhas fortes (8 car, letra e número)', () => {
    expect(validatePasswordStrength('12345').valid).toBe(false);
    expect(validatePasswordStrength('abcdefgh').valid).toBe(false); // sem número
    expect(validatePasswordStrength('12345678').valid).toBe(false); // sem letra
    expect(validatePasswordStrength('Honda2026').valid).toBe(true);
  });

  it('deve realizar comparação em tempo constante segura', () => {
    expect(constantTimeCompare('sipat123', 'sipat123')).toBe(true);
    expect(constantTimeCompare('sipat123', 'sipat999')).toBe(false);
    expect(constantTimeCompare('curto', 'muitolongo')).toBe(false);
  });

  it('deve formatar data no fuso de America/Sao_Paulo', () => {
    // 2026-11-10T11:00:00.000Z corresponds to 08:00 in America/Sao_Paulo (UTC-3)
    const utcString = '2026-11-10T11:00:00.000Z';
    const formatted = formatDateToSaoPaulo(utcString, 'liberacao');
    expect(formatted).toBe('10/11 às 08h00');
  });
});
