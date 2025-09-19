import { 
  Machine, 
  Service, 
  Check, 
  CheckResult, 
  Incident, 
  IncidentUpdate, 
  User, 
  AdminRole,
  CheckType,
  IncidentStatus,
  IncidentSeverity
} from '@prisma/client'

// Extended types with relations
export interface MachineWithServices extends Machine {
  services: ServiceWithChecks[]
}

export interface ServiceWithChecks extends Service {
  checks: Check[]
  machine: Machine
}

export interface ServiceWithStats extends Service {
  checks: Check[]
  machine: Machine
  uptimePercent24h: number
  uptimePercent7d: number
  uptimePercent30d: number
  currentStatus: 'operational' | 'degraded' | 'outage'
  lastCheck?: Date
  averageResponseTime?: number
}

export interface CheckWithResults extends Check {
  results: CheckResult[]
  service: Service
}

export interface IncidentWithDetails extends Incident {
  updates: IncidentUpdate[]
  service?: Service
  machine?: Machine
  creator: User
}

export interface UserWithRole extends User {
  adminRole?: AdminRole
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface StatusOverview {
  overall: 'operational' | 'degraded' | 'outage'
  services: ServiceWithStats[]
  activeIncidents: IncidentWithDetails[]
  uptimeStats: {
    '24h': number
    '7d': number
    '30d': number
  }
  lastUpdated: Date
}

export interface UptimeData {
  date: string
  uptime: number
  incidents: Array<{
    id: string
    title: string
    status: IncidentStatus
    severity: IncidentSeverity
    startTime: Date
    endTime?: Date
  }>
}

// Chart data types
export interface ChartDataPoint {
  timestamp: Date
  value: number
  status: 'success' | 'warning' | 'error'
  responseTime?: number
}

export interface BarChartData {
  date: string
  status: 'operational' | 'degraded' | 'outage'
  uptime: number
  incidents?: Array<{
    id: string
    title: string
    severity: IncidentSeverity
  }>
}

// Check configuration types
export interface CheckConfig {
  type: CheckType
  target: string
  port?: number
  timeout: number
  interval: number
  retryAttempts: number
  retryInterval: number
  expectedStatus?: number
  expectedBody?: string
  headers?: Record<string, string>
  followRedirects?: boolean
  sslCheck?: boolean
}

// Worker types
export interface CheckJob {
  id: string
  checkId: string
  config: CheckConfig
  scheduledAt: Date
}

export interface CheckJobResult {
  checkId: string
  success: boolean
  responseTime?: number
  statusCode?: number
  error?: string
  responseBody?: string
  timestamp: Date
}

// Real-time event types
export interface StatusUpdateEvent {
  type: 'status_update'
  serviceId: string
  status: 'operational' | 'degraded' | 'outage'
  timestamp: Date
  checkResult: CheckJobResult
}

export interface IncidentEvent {
  type: 'incident_created' | 'incident_updated' | 'incident_resolved'
  incident: IncidentWithDetails
  timestamp: Date
}

export interface MaintenanceWindow {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  affectedServices: string[]
}

// Admin dashboard types
export interface DashboardStats {
  totalServices: number
  totalChecks: number
  activeIncidents: number
  averageUptime: number
  checksLast24h: number
  failedChecksLast24h: number
  responseTimeP95: number
  mttr: number // Mean Time To Recovery
}

// Theme types
export type Theme = 'light' | 'dark'

// Notification types
export interface NotificationConfig {
  type: 'email' | 'webhook' | 'discord' | 'slack'
  target: string
  events: Array<'check_failed' | 'incident_created' | 'incident_resolved'>
  isActive: boolean
}

// Export Prisma types and enums
export { 
  Machine, 
  Service, 
  Check, 
  CheckResult, 
  Incident, 
  IncidentUpdate, 
  User, 
  AdminRole,
  CheckType, 
  IncidentStatus, 
  IncidentSeverity 
}

// Form types
export interface CreateMachineForm {
  name: string
  description?: string
  category: string
  location?: string
  tags: string[]
}

export interface CreateServiceForm {
  machineId: string
  name: string
  description?: string
  url?: string
  icon?: string
}

export interface CreateCheckForm {
  serviceId: string
  name: string
  type: CheckType
  target: string
  port?: number
  timeout: number
  interval: number
  retryAttempts: number
  expectedStatus?: number
  expectedBody?: string
  headers?: Record<string, string>
  followRedirects?: boolean
  sslCheck?: boolean
}

export interface CreateIncidentForm {
  title: string
  description: string
  severity: IncidentSeverity
  isScheduled: boolean
  scheduledFor?: Date
  eta?: Date
  serviceId?: string
  machineId?: string
  tags: string[]
}

// Search and filter types
export interface ServiceFilter {
  category?: string
  status?: 'operational' | 'degraded' | 'outage'
  search?: string
  tags?: string[]
}

export interface IncidentFilter {
  status?: IncidentStatus[]
  severity?: IncidentSeverity[]
  dateRange?: {
    start: Date
    end: Date
  }
  serviceId?: string
  search?: string
}