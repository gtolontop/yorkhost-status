'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import ServiceGrid from '@/components/status/ServiceGrid'
import GroupedServiceGrid from '@/components/status/GroupedServiceGrid'
import IncidentBanner from '@/components/incidents/IncidentBanner'
import PageHeader from '@/components/ui/PageHeader'
import { StatusOverview as StatusOverviewType } from '@/types'
import { useStatusUpdates } from '@/lib/pusher/client'
import { UptimeHistoryProvider } from '@/contexts/UptimeHistoryContext'

export default function HomePage() {
  const [status, setStatus] = useState<StatusOverviewType | null>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
    fetchGroups()
    
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

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups')
      const result = await response.json()
      
      if (result.success) {
        setGroups(result.data.filter((g: any) => g.id !== 'ungrouped'))
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
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
            ) : status?.overall === 'maintenance' ? (
              <svg 
                width="96" 
                height="96" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2"/>
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
            status?.overall === 'maintenance' ? 'Maintenance in Progress' :
            status?.overall === 'degraded' ? 'Some Systems Degraded' : 'System Outage'
          }
          subtitle={
            status?.overall === 'operational' 
              ? 'All Yorkhost services are running smoothly. Everything is working as expected.'
              : status?.overall === 'maintenance'
              ? 'We are currently performing scheduled maintenance. Some services may be temporarily unavailable.'
              : status?.overall === 'degraded'
              ? 'Some services may be experiencing issues. Our team is working on it.'
              : 'We are experiencing issues with our services. We apologize for the inconvenience.'
          }
          status={status?.overall}
        />

        {/* Service Grid */}
        <UptimeHistoryProvider>
          <GroupedServiceGrid services={status?.services || []} groups={groups} />
        </UptimeHistoryProvider>
      </div>
    </Layout>
  )
}