export function formatDateToSaoPaulo(
  dateInput: string | Date | undefined,
  format: 'full' | 'short' | 'dateOnly' | 'timeOnly' | 'liberacao' = 'full'
): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const timeZone = 'America/Sao_Paulo';

  if (format === 'liberacao') {
    const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone }).format(date);
    const month = new Intl.DateTimeFormat('pt-BR', { month: '2-digit', timeZone }).format(date);
    const hour = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', hour12: false, timeZone }).format(date).padStart(2, '0');
    const min = new Intl.DateTimeFormat('pt-BR', { minute: '2-digit', timeZone }).format(date).padStart(2, '0');
    return `${day}/${month} às ${hour}h${min}`;
  }

  if (format === 'dateOnly') {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone,
    }).format(date);
  }

  if (format === 'timeOnly') {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone,
    }).format(date);
  }

  if (format === 'short') {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(date);
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(date);
}

export function formatPercent(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '0%';
  return `${Math.round(value)}%`;
}

export function sanitizeText(text: string): string {
  return text.trim();
}
