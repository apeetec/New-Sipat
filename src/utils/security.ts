export async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function maskEmployeeNumber(emp: string, shouldMask: boolean = true): string {
  if (!emp) return '';
  if (!shouldMask) return emp;
  if (emp.length <= 4) return '***' + emp.slice(-2);
  const prefix = emp.slice(0, 2);
  const suffix = emp.slice(-2);
  const middle = '*'.repeat(Math.max(2, emp.length - 4));
  return `${prefix}${middle}${suffix}`;
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  lengthOk: boolean;
  hasNumber: boolean;
  hasLetter: boolean;
  message?: string;
} {
  const lengthOk = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const valid = lengthOk && hasNumber && hasLetter;

  let message = '';
  if (!valid) {
    if (!lengthOk) message = 'A senha deve ter no mínimo 8 caracteres.';
    else if (!hasNumber) message = 'A senha deve incluir pelo menos um número.';
    else if (!hasLetter) message = 'A senha deve incluir pelo menos uma letra.';
  }

  return { valid, lengthOk, hasNumber, hasLetter, message };
}
