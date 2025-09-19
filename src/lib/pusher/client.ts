'use client'

import Pusher from 'pusher-js'

let pusher: Pusher | null = null

export function getPusher(): Pusher {
  if (!pusher) {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    
    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher credentials not configured, using mock client')
      // Return a mock pusher client for development
      return {
        subscribe: () => ({ bind: () => {}, unbind: () => {} }),
        unsubscribe: () => {}
      } as any
    }
    
    pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true
    })

    // Enable debug logging in development
    if (process.env.NODE_ENV === 'development') {
      Pusher.logToConsole = true
    }
  }

  return pusher
}

// Hook for subscribing to status updates
export function useStatusUpdates(callback: (data: any) => void) {
  const pusherClient = getPusher()
  
  const channel = pusherClient.subscribe('status-updates')
  
  channel.bind('status-change', callback)
  channel.bind('check-result', callback)

  return () => {
    channel.unbind('status-change', callback)
    channel.unbind('check-result', callback)
    pusherClient.unsubscribe('status-updates')
  }
}

// Hook for subscribing to incident updates
export function useIncidentUpdates(callback: (data: any) => void) {
  const pusherClient = getPusher()
  
  const channel = pusherClient.subscribe('incidents')
  
  channel.bind('incident-created', callback)
  channel.bind('incident-updated', callback)
  channel.bind('incident-resolved', callback)

  return () => {
    channel.unbind('incident-created', callback)
    channel.unbind('incident-updated', callback)
    channel.unbind('incident-resolved', callback)
    pusherClient.unsubscribe('incidents')
  }
}

// Hook for admin notifications
export function useAdminUpdates(callback: (data: any) => void) {
  const pusherClient = getPusher()
  
  const channel = pusherClient.subscribe('admin')
  
  channel.bind('notification', callback)

  return () => {
    channel.unbind('notification', callback)
    pusherClient.unsubscribe('admin')
  }
}