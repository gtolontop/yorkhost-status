'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import StatusOverview from '@/components/status/StatusOverview'
import ServiceGrid from '@/components/status/ServiceGrid'
import IncidentBanner from '@/components/incidents/IncidentBanner'
import { StatusOverview as StatusOverviewType } from '@/types'
import { useStatusUpdates } from '@/lib/pusher/client'

export default function HomePage() {
  const [status, setStatus] = useState<StatusOverviewType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
    
    // Subscribe to real-time updates
    const unsubscribe = useStatusUpdates((data) => {
      console.log('Real-time status update:', data)
      // Refresh status when we get updates
      fetchStatus()
    })

    return unsubscribe
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status')
      const result = await response.json()
      
      if (result.success) {
        setStatus(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch status')
      }
    } catch (err) {
      setError('Network error')
      console.error('Status fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <div className="loading" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', margin: '0 auto 16px' }}></div>
              <p className="text-secondary">Loading status...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="container">
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h2 className="text-xl font-semibold text-danger mb-4">Error Loading Status</h2>
            <p className="text-secondary mb-6">{error}</p>
            <button 
              onClick={fetchStatus}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        {/* Incident Banner */}
        {status?.activeIncidents && status.activeIncidents.length > 0 && (
          <IncidentBanner incidents={status.activeIncidents} />
        )}

        {/* Status Overview */}
        <StatusOverview 
          overall={status?.overall || 'operational'}
          uptimeStats={status?.uptimeStats || { '24h': 100, '7d': 100, '30d': 100 }}
          lastUpdated={status?.lastUpdated ? new Date(status.lastUpdated) : new Date()}
        />

        {/* Service Grid */}
        <ServiceGrid 
          services={status?.services || []}
        />
      </div>
    </Layout>
  )
}