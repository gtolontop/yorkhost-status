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