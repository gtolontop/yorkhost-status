'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface StatusControlsContextType {
  isRefreshing: boolean
  lastUpdated: Date
  onRefresh: () => void
  onNotificationClick: () => void
  setIsRefreshing: (refreshing: boolean) => void
  setLastUpdated: (date: Date) => void
  setRefreshCallback: (callback: () => void) => void
  setNotificationCallback: (callback: () => void) => void
}

const StatusControlsContext = createContext<StatusControlsContextType | undefined>(undefined)

export function StatusControlsProvider({ children }: { children: ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [refreshCallback, setRefreshCallback] = useState<() => void>(() => () => window.location.reload())
  const [notificationCallback, setNotificationCallback] = useState<() => void>(() => () => alert('Notifications feature coming soon!'))

  const onRefresh = useCallback(() => {
    refreshCallback()
  }, [refreshCallback])

  const onNotificationClick = useCallback(() => {
    notificationCallback()
  }, [notificationCallback])

  const value = {
    isRefreshing,
    lastUpdated,
    onRefresh,
    onNotificationClick,
    setIsRefreshing,
    setLastUpdated,
    setRefreshCallback,
    setNotificationCallback
  }

  return (
    <StatusControlsContext.Provider value={value}>
      {children}
    </StatusControlsContext.Provider>
  )
}

export function useStatusControls() {
  const context = useContext(StatusControlsContext)
  if (context === undefined) {
    throw new Error('useStatusControls must be used within a StatusControlsProvider')
  }
  return context
}