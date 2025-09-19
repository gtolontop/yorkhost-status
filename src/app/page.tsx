'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
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

        {/* Hero Status Section */}
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 20px 60px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            {status?.overall === 'operational' ? (
              <svg 
                width="96" 
                height="96" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ color: 'var(--color-success)' }}
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
                style={{ color: 'var(--color-warning)' }}
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
                style={{ color: 'var(--color-danger)' }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="m15 9-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m9 9 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: status?.overall === 'operational' ? 'var(--color-success)' : 
                  status?.overall === 'degraded' ? 'var(--color-warning)' : 'var(--color-danger)',
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            {status?.overall === 'operational' ? 'All Systems Operational' :
             status?.overall === 'degraded' ? 'Some Systems Degraded' : 'System Outage'}
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            marginBottom: '48px',
            lineHeight: '1.6'
          }}>
            {status?.overall === 'operational' 
              ? 'All Yorkhost services are running smoothly. Everything is working as expected.'
              : status?.overall === 'degraded'
              ? 'Some services may be experiencing issues. Our team is working on it.'
              : 'We are experiencing issues with our services. We apologize for the inconvenience.'
            }
          </p>
        </div>

        {/* Service Grid */}
        <ServiceGrid services={status?.services || []} />
      </div>
    </Layout>
  )
}