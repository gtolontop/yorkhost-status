'use client'

import Link from 'next/link'
import { IncidentWithDetails } from '@/types'
import { AlertTriangle, Info, Wrench, ArrowRight } from 'lucide-react'

interface IncidentBannerProps {
  incidents: IncidentWithDetails[]
}

export default function IncidentBanner({ incidents }: IncidentBannerProps) {
  const safeIncidents = Array.isArray(incidents) ? incidents : []

  if (safeIncidents.length === 0) {
    return null
  }

  // Check if we have any active (non-scheduled) incidents/maintenances
  const activeIncidents = safeIncidents.filter(i =>
    i.status !== 'SCHEDULED' && i.status !== 'RESOLVED' && i.status !== 'COMPLETED'
  )

  // If we only have scheduled maintenances, show the simple format
  if (activeIncidents.length === 0) {
    // Count incidents by type
    const incidentCount = safeIncidents.filter(i => i.type !== 'MAINTENANCE').length
    const maintenanceCount = safeIncidents.filter(i => i.type === 'MAINTENANCE').length

    // Determine the link based on what's active
    let href = '/previous-incidents'
    if (maintenanceCount > 0 && incidentCount === 0) {
      href = '/maintenance' // Only maintenances, go to maintenance page
    } else if (incidentCount > 0 && maintenanceCount === 0) {
      href = '/previous-incidents' // Only incidents
    } else if (incidentCount > 0 && maintenanceCount > 0) {
      href = '/previous-incidents' // Both, go to incidents page which shows both
    }

    return (
      <div className="max-w-3xl mx-auto mb-12">
        <Link
          href={href}
          className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-yorkhost-darkCard hover:bg-gray-100 dark:hover:bg-yorkhost-darkCard/80 rounded-lg border border-gray-200 dark:border-yorkhost-darkBorder shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            {incidentCount > 0 ? (
              <AlertTriangle className="text-orange-500" size={20} />
            ) : (
              <Wrench className="text-blue-500" size={20} />
            )}
            <div className="text-sm">
              {incidentCount > 0 && (
                <span className="font-medium text-gray-900 dark:text-white">
                  {incidentCount} active incident{incidentCount > 1 ? 's' : ''}
                  {maintenanceCount > 0 && ' • '}
                </span>
              )}
              {maintenanceCount > 0 && (
                <span className="font-medium text-gray-900 dark:text-white">
                  {maintenanceCount} scheduled maintenance
                </span>
              )}
              <span className="text-gray-600 dark:text-gray-400 ml-2">
                Click to view details
              </span>
            </div>
          </div>
          <ArrowRight className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" size={16} />
        </Link>
      </div>
    )
  }

  // We have active incidents/maintenances, show detailed format
  // Get the most recent active incident/maintenance to display
  const mostRecent = activeIncidents.sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )[0]

  // Get the latest update if available
  const latestUpdate = mostRecent.updates && mostRecent.updates.length > 0
    ? mostRecent.updates.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]
    : null

  // Determine the link
  const href = mostRecent.type === 'MAINTENANCE' ? `/maintenance/${mostRecent.slug}` : `/incident/${mostRecent.slug}`

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INVESTIGATING': return 'text-orange-500'
      case 'IDENTIFIED': return 'text-red-500'
      case 'MONITORING': return 'text-blue-500'
      case 'RESOLVED': return 'text-green-500'
      case 'SCHEDULED': return 'text-blue-500'
      case 'IN_PROGRESS': return 'text-orange-500'
      case 'COMPLETED': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusText = (status: string, type: string) => {
    if (type === 'MAINTENANCE') {
      switch (status) {
        case 'SCHEDULED': return 'Scheduled'
        case 'IN_PROGRESS': return 'In Progress'
        case 'COMPLETED': return 'Completed'
        default: return status
      }
    }
    return status.charAt(0) + status.slice(1).toLowerCase()
  }

  return (
    <div className="max-w-3xl mx-auto mb-12">
      <Link
        href={href}
        className="group block p-6 bg-gray-50 dark:bg-yorkhost-darkCard hover:bg-gray-100 dark:hover:bg-yorkhost-darkCard/80 rounded-lg border border-gray-200 dark:border-yorkhost-darkBorder shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {mostRecent.type === 'MAINTENANCE' ? (
              <Wrench className="text-blue-500 mt-1 flex-shrink-0" size={20} />
            ) : (
              <AlertTriangle className="text-orange-500 mt-1 flex-shrink-0" size={20} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                  {mostRecent.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(mostRecent.status)}`}>
                  {getStatusText(mostRecent.status, mostRecent.type || 'INCIDENT')}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                {mostRecent.description}
              </p>

              {latestUpdate && (
                <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Latest Update
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(latestUpdate.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {latestUpdate.message}
                  </p>
                </div>
              )}

              {safeIncidents.length > 1 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  +{safeIncidents.length - 1} more active {safeIncidents.length === 2 ? 'item' : 'items'}
                </p>
              )}
            </div>
          </div>
          <ArrowRight className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors mt-1 ml-3 flex-shrink-0" size={16} />
        </div>
      </Link>
    </div>
  )
}