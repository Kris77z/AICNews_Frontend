import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatCost(cost: number, currency: 'USD' | 'CNY' = 'USD'): string {
  if (currency === 'CNY') {
    return `¥${(cost * 7.2).toFixed(4)}`
  }
  return `$${cost.toFixed(4)}`
}

