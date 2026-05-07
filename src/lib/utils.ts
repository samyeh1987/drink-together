import { CREDIT_LEVELS } from './constants';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getCreditLevel(score: number): { key: string; emoji: string; color: string; label: string } {
  const level = CREDIT_LEVELS.find(l => score >= l.min);
  return level || CREDIT_LEVELS[CREDIT_LEVELS.length - 1];
}

export function formatCurrency(amount: number, currency: string = 'THB'): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string, locale: string = 'en'): string {
  const date = new Date(dateString);
  const localeMap: Record<string, string> = {
    'en': 'en-US',
    'zh-CN': 'zh-CN',
    'th': 'th-TH',
  };
  return date.toLocaleDateString(localeMap[locale] || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateString: string, locale: string = 'en'): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${Math.abs(diffMins)} min`;
  if (diffHours < 24) return `${Math.abs(diffHours)} hr`;
  if (diffDays < 7) return `${Math.abs(diffDays)} d`;
  return formatDate(dateString, locale);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
