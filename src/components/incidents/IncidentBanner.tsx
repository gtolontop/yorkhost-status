'use client'

import Link from 'next/link'
import { IncidentWithDetails } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import { AlertTriangle, Info, Wrench, ChevronRight } from 'lucide-react'

interface IncidentBannerProps {
  incidents: IncidentWithDetails[]
}

export default function IncidentBanner({ incidents }: IncidentBannerProps) {
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
    
    return new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime()
  })

  const getIncidentStyle = (incident: IncidentWithDetails) => {
    if (incident.type === 'MAINTENANCE') {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        icon: Wrench,
        iconColor: 'text-blue-600'
      }
    }

    switch (incident.severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          icon: AlertTriangle,
          iconColor: 'text-red-600'
        }
      case 'HIGH':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-900',
          icon: AlertTriangle,
          iconColor: 'text-orange-600'
        }
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          icon: Info,
          iconColor: 'text-yellow-600'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          icon: Info,
          iconColor: 'text-gray-600'
        }
    }
  }

  return (
    <div className="mb-6 space-y-3">
      {sortedIncidents.map((incident) => {
        const style = getIncidentStyle(incident)
        const Icon = style.icon

        return (
          <Link
            key={incident.id}
            href={`/incident/${incident.slug || incident.id}`}
            className={`block p-4 rounded-lg border ${style.bg} ${style.border} ${style.text} hover:shadow-md transition-all duration-200 group`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`${style.iconColor} mt-0.5 shrink-0`} size={20} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1 group-hover:underline">
                      {incident.title}
                    </h3>
                    <p className="text-sm opacity-75 line-clamp-1">
                      {incident.description}
                    </p>
                    {incident.updates && incident.updates.length > 0 && (
                      <p className="text-xs opacity-60 mt-1">
                        Latest: {incident.updates[0].message}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        incident.type === 'MAINTENANCE' ? 'bg-blue-100 text-blue-700' :
                        incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        incident.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {incident.type === 'MAINTENANCE' ? 'Maintenance' : incident.severity}
                      </span>
                      <p className="text-xs opacity-60 mt-1">
                        {formatRelativeTime(incident.startTime)}
                      </p>
                    </div>
                    <ChevronRight className="opacity-40 group-hover:opacity-70 transition-opacity" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}