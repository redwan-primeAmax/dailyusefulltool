import type { VolumeUnit } from '../types';

const ML_PER_OZ = 29.5735;

export const mlToOz = (ml: number) => Math.round((ml / ML_PER_OZ) * 10) / 10;
export const ozToMl = (oz: number) => Math.round(oz * ML_PER_OZ);

export function formatVolume(ml: number, unit: VolumeUnit): string {
  if (unit === 'oz') return `${mlToOz(ml)} oz`;
  return `${ml >= 1000 ? (ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1) + 'L' : ml + 'ml'}`;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatMoney(amount: number, currency: string): string {
  const isIsoCode = /^[A-Za-z]{3}$/.test(currency.trim());
  if (isIsoCode) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency.toUpperCase(),
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      }).format(amount);
    } catch {
      /* fall through to custom-symbol formatting */
    }
  }
  // Custom symbol / name (e.g. "৳", "BDT", "Taka") — prefix with thousands grouping.
  const grouped = amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency.trim() || '';
  return symbol ? `${symbol} ${grouped}` : grouped;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const percent = (value: number, total: number) =>
  total <= 0 ? 0 : clamp(Math.round((value / total) * 100), 0, 999);

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
