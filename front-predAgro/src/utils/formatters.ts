export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
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
