import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in EUR (Belgian format)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format date in Belgian format
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Format time in Belgian format
 */
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Calculate VAT amount from a gross amount
 */
export function calculateVat(grossAmount: number, vatRate: number): number {
  return grossAmount - grossAmount / (1 + vatRate)
}

/**
 * VAT rates for Belgium
 */
export const VAT_RATES = {
  A: 0.21, // 21% - Standard (drinks)
  B: 0.12, // 12% - Food
  C: 0.06, // 6%  - Reduced
  D: 0,    // 0%  - Zero (tobacco)
  X: 0,    // Out of scope
} as const

export type VatLabel = keyof typeof VAT_RATES
