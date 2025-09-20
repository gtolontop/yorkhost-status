'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import ServiceGrid from '@/components/status/ServiceGrid'
import IncidentBanner from '@/components/incidents/IncidentBanner'
import PageHeader from '@/components/ui/PageHeader'
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
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading status...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm text-center py-12 px-6">
            <h2 className="text-xl font-semibold text-danger mb-4">Error Loading Status</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={fetchStatus}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-hover transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
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
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Incident Banner */}
        {status?.activeIncidents && status.activeIncidents.length > 0 && (
          <IncidentBanner incidents={status.activeIncidents} />
        )}

        {/* Hero Status Section */}
        <PageHeader
          icon={
            status?.overall === 'operational' ? (
              <svg 
                width="96" 
                height="96" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : status?.overall === 'degraded' ? (
              <svg 
                width="96" 
                height="96" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m12 16 .01 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg 
                width="96" 
                height="96" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="m15 9-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m9 9 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )
          }
          title={
            status?.overall === 'operational' ? 'All Systems Operational' :
            status?.overall === 'degraded' ? 'Some Systems Degraded' : 'System Outage'
          }
          subtitle={
            status?.overall === 'operational' 
              ? 'All Yorkhost services are running smoothly. Everything is working as expected.'
              : status?.overall === 'degraded'
              ? 'Some services may be experiencing issues. Our team is working on it.'
              : 'We are experiencing issues with our services. We apologize for the inconvenience.'
          }
          status={status?.overall}
        />

        {/* Service Grid */}
        <ServiceGridWithGroups services={status?.services || []} />
      </div>
    </Layout>
  )
}