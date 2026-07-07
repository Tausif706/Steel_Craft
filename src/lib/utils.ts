import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
export const pct = (o: number, p: number) => Math.round((1 - p / o) * 100);

export const stars = (r: number) =>
  Array.from({ length: 5 }, (_, i) => i < Math.round(r));

export const orderStatusClass: Record<string, string> = {
  Delivered:    'bg-green-100 text-green-800',
  'In Transit': 'bg-blue-100  text-blue-800',
  Packed:       'bg-blue-100  text-blue-800',
  Processing:   'bg-yellow-100 text-yellow-800',
  Cancelled:    'bg-red-100   text-red-800',
  Quoted:       'bg-purple-100 text-purple-800',
  Converted:    'bg-green-100  text-green-800',
  Pending:      'bg-yellow-100 text-yellow-800',
  Rejected:     'bg-red-100   text-red-800',
};

// Category lookups now read from the live `categories` array (fetched
// from Supabase) instead of a hardcoded list.
import type { Category } from '../types';
export const catById = (categories: Category[], id: string) => categories.find(c => c.id === id);
export const catIC = (categories: Category[], id: string) => catById(categories, id)?.ic ?? 'ti-package';
export const catN  = (categories: Category[], id: string) => catById(categories, id)?.n ?? id;
