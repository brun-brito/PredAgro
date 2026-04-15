export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value: string) {
  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(value));
}

export function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits,
  }).format(value);
}

export function formatPercentage(value: number) {
  return `${formatNumber(value, 0)}%`;
}
