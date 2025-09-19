import { type ClassValue, clsx } from 'clsx'
import { format, formatDistanceToNow, isToday, isYesterday, differenceInSeconds } from 'date-fns'

// Utility function for conditional class names
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format date utilities
export function formatDate(date: Date | string, formatStr: string = 'MMM dd, yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, formatStr)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isToday(d)) {
    return `Today at ${format(d, 'HH:mm')}`
  }
  
  if (isYesterday(d)) {
    return `Yesterday at ${format(d, 'HH:mm')}`
  }
  
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}

// Calculate uptime percentage
export function calculateUptime(
  totalChecks: number,
  successfulChecks: number
): number {
  if (totalChecks === 0) return 100
  return Math.round((successfulChecks / totalChecks) * 10000) / 100
}

// Get status color based on uptime percentage
export function getStatusColor(uptime: number): 'success' | 'warning' | 'danger' {
  if (uptime >= 99.5) return 'success'
  if (uptime >= 95) return 'warning'
  return 'danger'
}

// Get status text based on uptime
export function getStatusText(uptime: number): 'operational' | 'degraded' | 'outage' {
  if (uptime >= 99.5) return 'operational'
  if (uptime >= 95) return 'degraded'
  return 'outage'
}

// Format response time
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  
  const seconds = ms / 1000
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any }
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj as T
  }
  return obj
}

// Validate URL
export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Format bytes
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Parse user agent
export function parseUserAgent(userAgent: string): {
  browser: string
  os: string
  device: string
} {
  // Simple user agent parsing (in production, use a proper library)
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                 userAgent.includes('Firefox') ? 'Firefox' :
                 userAgent.includes('Safari') ? 'Safari' :
                 userAgent.includes('Edge') ? 'Edge' : 'Unknown'
  
  const os = userAgent.includes('Windows') ? 'Windows' :
            userAgent.includes('Mac') ? 'macOS' :
            userAgent.includes('Linux') ? 'Linux' :
            userAgent.includes('Android') ? 'Android' :
            userAgent.includes('iOS') ? 'iOS' : 'Unknown'
  
  const device = userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
  
  return { browser, os, device }
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

// Group array by key
export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    groups[groupKey] = groups[groupKey] || []
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

// Calculate incident duration
export function calculateIncidentDuration(startTime: Date, endTime?: Date): string {
  const end = endTime || new Date()
  const durationInSeconds = differenceInSeconds(end, startTime)
  return formatDuration(durationInSeconds)
}

// Get severity color
export function getSeverityColor(severity: string): 'success' | 'warning' | 'danger' {
  switch (severity.toLowerCase()) {
    case 'low':
      return 'success'
    case 'medium':
      return 'warning'
    case 'high':
    case 'critical':
      return 'danger'
    default:
      return 'warning'
  }
}

// Generate chart colors
export function generateChartColors(count: number): string[] {
  const baseColors = [
    '#6D96FF', '#22c55e', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
  ]
  
  const colors = []
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length])
  }
  
  return colors
}

// Sanitize HTML (basic)
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

// Local storage helpers
export const localStorage = {
  get: <T>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : fallback
    } catch {
      return fallback
    }
  },
  
  set: (key: string, value: any): void => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Silent fail
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Silent fail
    }
  }
}

// Environment helpers
export const env = {
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
}