'use client'

import Link from 'next/link'
import { IncidentWithDetails } from '@/types'
import { getSeverityColor, formatRelativeTime } from '@/lib/utils'
import { AlertTriangle, XCircle, Clock, ExternalLink } from 'lucide-react'

interface IncidentBannerProps {
  incidents: IncidentWithDetails[]
}

export default function IncidentBanner({ incidents }: IncidentBannerProps) {
  // Ensure incidents is an array
  const safeIncidents = Array.isArray(incidents) ? incidents : []
  
  if (safeIncidents.length === 0) {
    return null
  }

  // Sort by severity and recency
  const sortedIncidents = [...safeIncidents].sort((a, b) => {
    const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
    const aSeverity = severityOrder[a.severity] || 1
    const bSeverity = severityOrder[b.severity] || 1
    
    if (aSeverity !== bSeverity) {
      return bSeverity - aSeverity
    }
    
    const bTime = new Date(b.startTime || 0).getTime()
    const aTime = new Date(a.startTime || 0).getTime()
    return bTime - aTime
  })

  const primaryIncident = sortedIncidents[0]
  const additionalCount = safeIncidents.length - 1

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return XCircle
      case 'HIGH':
        return AlertTriangle
      default:
        return Clock
    }
  }

  const SeverityIcon = getSeverityIcon(primaryIncident.severity)
  const severityColor = getSeverityColor(primaryIncident.severity)

  return (
    <div className={`mb-8 rounded-lg shadow-lg overflow-hidden animate-fade-in ${
      severityColor === 'success' ? 'bg-gradient-to-br from-success-light to-success border border-success text-success-dark' :
      severityColor === 'warning' ? 'bg-gradient-to-br from-warning-light to-warning border border-warning text-warning-dark' :
      'bg-gradient-to-br from-danger-light to-danger border border-danger text-danger-dark'
    }`}>
      <div className="flex items-start gap-4 p-6 md:p-8 md:gap-6">
        <div className="flex-shrink-0 mt-1 opacity-90">
          <SeverityIcon size={24} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <h3 className="text-lg md:text-xl font-bold mb-2">{primaryIncident.title}</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-white bg-opacity-30">
                {primaryIncident.severity}
              </span>
              <span className="text-sm opacity-90">
                Started {formatRelativeTime(primaryIncident.startTime)}
              </span>
            </div>
          </div>
          
          <p className="mb-3 leading-relaxed opacity-90">
            {primaryIncident.description}
          </p>
          
          {primaryIncident.updates && primaryIncident.updates.length > 0 && (
            <div className="mb-2 p-3 bg-white bg-opacity-20 rounded-md text-sm leading-relaxed">
              <strong className="font-semibold">Latest Update:</strong> {primaryIncident.updates[0].message}
            </div>
          )}
          
          {additionalCount > 0 && (
            <p className="text-sm font-medium opacity-80 m-0">
              +{additionalCount} additional incident{additionalCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="flex flex-col gap-2 items-end flex-shrink-0 sm:flex-row sm:gap-3">
          <Link 
            href={`/incidents/${primaryIncident.id}`}
            className="flex items-center gap-2 px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md text-sm font-medium transition-all whitespace-nowrap hover:bg-opacity-30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:ring-offset-2"
          >
            <span>View Details</span>
            <ExternalLink size={16} />
          </Link>
          
          {additionalCount > 0 && (
            <Link 
              href="/incidents"
              className="px-3 py-2 text-sm font-medium opacity-80 transition-all rounded-md whitespace-nowrap hover:opacity-100 hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:ring-offset-2"
            >
              View All Incidents
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}