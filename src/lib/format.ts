export const usd = (value: number, opts: { compact?: boolean } = {}) => {
  if (opts.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const num = (value: number) =>
  new Intl.NumberFormat('en-US').format(value);

export const percent = (value: number, digits = 1) =>
  `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;

export const dateShort = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const relativeDays = (iso: string) => {
  const then = new Date(`${iso}T00:00:00`).getTime();
  const today = new Date('2026-10-31T00:00:00').getTime();
  const days = Math.round((today - then) / 86_400_000);
  if (days === 0) return 'today';
  if (days < 0) return `in ${Math.abs(days)}d`;
  return `${days}d ago`;
};
