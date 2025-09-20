'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { UptimeData } from '@/types'

interface UptimeHistoryContextType {
  historyData: Record<string, UptimeData[]>
  loading: boolean
  error: string | null
  refetch: () => void
}

const UptimeHistoryContext = createContext<UptimeHistoryContextType | undefined>(undefined)

export function UptimeHistoryProvider({ children }: { children: React.ReactNode }) {
  const [historyData, setHistoryData] = useState<Record<string, UptimeData[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllHistory = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/services/history?days=90')
      const result = await response.json()
      
      if (result.success) {
        setHistoryData(result.data)
      } else {
        setError(result.error || 'Failed to fetch history')
      }
    } catch (err) {
      setError('Network error while fetching history')
      console.error('Failed to fetch uptime history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllHistory()
  }, [])

  return (
    <UptimeHistoryContext.Provider value={{
      historyData,
      loading,
      error,
      refetch: fetchAllHistory
    }}>
      {children}
    </UptimeHistoryContext.Provider>
  )
}

export function useUptimeHistory(serviceId?: string) {
  const context = useContext(UptimeHistoryContext)
  if (!context) {
    throw new Error('useUptimeHistory must be used within UptimeHistoryProvider')
  }
  
  if (serviceId) {
    return {
      ...context,
      serviceHistory: context.historyData[serviceId] || []
    }
  }
  
  return context
}