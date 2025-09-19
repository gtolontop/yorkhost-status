import Pusher from 'pusher'

if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
  throw new Error('Missing Pusher environment variables')
}

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
})

// Event types and channels
export const PUSHER_CHANNELS = {
  STATUS_UPDATES: 'status-updates',
  INCIDENTS: 'incidents',
  ADMIN: 'admin'
} as const

export const PUSHER_EVENTS = {
  STATUS_CHANGE: 'status-change',
  INCIDENT_CREATED: 'incident-created',
  INCIDENT_UPDATED: 'incident-updated',
  INCIDENT_RESOLVED: 'incident-resolved',
  CHECK_RESULT: 'check-result'
} as const

// Helper functions to send events
export async function sendStatusUpdate(data: {
  serviceId: string
  status: 'operational' | 'degraded' | 'outage'
  timestamp: Date
  checkResult?: any
}) {
  try {
    await pusher.trigger(PUSHER_CHANNELS.STATUS_UPDATES, PUSHER_EVENTS.STATUS_CHANGE, {
      ...data,
      timestamp: data.timestamp.toISOString()
    })
  } catch (error) {
    console.error('Failed to send status update:', error)
  }
}

export async function sendIncidentUpdate(data: {
  type: 'created' | 'updated' | 'resolved'
  incident: any
  timestamp: Date
}) {
  try {
    const eventMap = {
      created: PUSHER_EVENTS.INCIDENT_CREATED,
      updated: PUSHER_EVENTS.INCIDENT_UPDATED,
      resolved: PUSHER_EVENTS.INCIDENT_RESOLVED
    }

    await pusher.trigger(PUSHER_CHANNELS.INCIDENTS, eventMap[data.type], {
      ...data,
      timestamp: data.timestamp.toISOString()
    })
  } catch (error) {
    console.error('Failed to send incident update:', error)
  }
}

export async function sendCheckResult(data: {
  checkId: string
  serviceId: string
  success: boolean
  responseTime?: number
  timestamp: Date
}) {
  try {
    await pusher.trigger(PUSHER_CHANNELS.STATUS_UPDATES, PUSHER_EVENTS.CHECK_RESULT, {
      ...data,
      timestamp: data.timestamp.toISOString()
    })
  } catch (error) {
    console.error('Failed to send check result:', error)
  }
}

export async function sendAdminNotification(data: {
  type: 'info' | 'warning' | 'error'
  title: string
  message: string
  userId?: string
  timestamp: Date
}) {
  try {
    await pusher.trigger(PUSHER_CHANNELS.ADMIN, 'notification', {
      ...data,
      timestamp: data.timestamp.toISOString()
    })
  } catch (error) {
    console.error('Failed to send admin notification:', error)
  }
}