'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import PageHeader from '@/components/ui/PageHeader'
import { Calendar, Clock, Settings, Wrench, Info, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Maintenance {
  id: string
  title: string
  description: string
  status: string
  severity: string
  scheduledFor?: string
  scheduledEnd?: string
  startTime: string
  endTime?: string
  affectedServices?: string[]
  affectedServicesWithNames?: Array<{
    id: string
    name: string
  }>
  service?: { name: string }
  updates?: Array<{
    title: string
    message: string
    timestamp: string
  }>
}

export default function MaintenancePage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMaintenances()
  }, [])

  const fetchMaintenances = async () => {
    try {
      const response = await fetch('/api/maintenance')
      const data = await response.json()
      if (data.success) {
        setMaintenances(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch maintenances:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return '🔴'
      case 'MEDIUM':
        return '🟠'
      case 'LOW':
        return '🟡'
      default:
        return '🔵'
    }
  }

  return (
    <Layout>
      <div className="container">
        <PageHeader
          icon={<Settings size={96} />}
          title="Scheduled Maintenance"
          subtitle="All planned maintenance windows and system updates for Yorkhost services"
        />

        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading maintenance schedule...</p>
            </div>
          ) : maintenances.length === 0 ? (
            <>
              <div className="bg-gray-50 dark:bg-yorkhost-darkCard border border-gray-200 dark:border-yorkhost-darkBorder rounded-lg p-8 text-left mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar size={20} className="text-info" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    No Scheduled Maintenance
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  There are currently no scheduled maintenance windows. We will notify users in advance of any planned maintenance.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock size={16} />
                  <span>All maintenance is performed during low-traffic hours</span>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-yorkhost-darkCard/50 border border-gray-100 dark:border-yorkhost-darkBorder rounded-md p-4 text-sm text-gray-600 dark:text-gray-400">
                💡 <strong>Tip:</strong> Subscribe to our status updates to receive notifications about scheduled maintenance and incidents.
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Active or upcoming maintenances */}
              {maintenances
                .filter(m => m.status !== 'COMPLETED' && m.status !== 'CANCELLED')
                .map((maintenance) => (
                <div key={maintenance.id} className="bg-white dark:bg-yorkhost-darkCard rounded-lg shadow-sm border border-gray-200 dark:border-yorkhost-darkBorder overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Wrench className="text-blue-500 flex-shrink-0" size={24} />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
                            {maintenance.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(maintenance.status)} mt-1`}>
                            {maintenance.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <span className="text-2xl flex-shrink-0">{getSeverityIcon(maintenance.severity)}</span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-4 break-words">
                      {maintenance.description.length > 200
                        ? `${maintenance.description.substring(0, 200)}...`
                        : maintenance.description
                      }
                    </p>

                    <div className="space-y-2 mb-4">
                      {maintenance.scheduledFor && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar size={16} />
                          <span>
                            Scheduled: {format(new Date(maintenance.scheduledFor), 'PPP p')}
                          </span>
                        </div>
                      )}
                      {maintenance.scheduledEnd && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock size={16} />
                          <span>
                            Expected End: {format(new Date(maintenance.scheduledEnd), 'PPP p')}
                          </span>
                        </div>
                      )}
                    </div>

                    {maintenance.affectedServicesWithNames && maintenance.affectedServicesWithNames.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-yorkhost-darkBorder">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Affected Services ({maintenance.affectedServicesWithNames.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {maintenance.affectedServicesWithNames.map((service, idx) => (
                            <span key={service.id} className="px-2 py-1 bg-gray-100 dark:bg-yorkhost-darkBg rounded text-xs text-gray-700 dark:text-gray-300">
                              {service.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {maintenance.updates && maintenance.updates.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-yorkhost-darkBorder mt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Latest Update</h4>
                        <div className="bg-gray-50 dark:bg-yorkhost-darkBg rounded-md p-3">
                          <p className="text-sm text-gray-900 dark:text-white font-medium break-words">
                            {maintenance.updates[0].title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                            {maintenance.updates[0].message.length > 150
                              ? `${maintenance.updates[0].message.substring(0, 150)}...`
                              : maintenance.updates[0].message
                            }
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {format(new Date(maintenance.updates[0].timestamp), 'PPP p')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* View Details Button */}
                    <div className="pt-4 border-t border-gray-200 dark:border-yorkhost-darkBorder mt-4">
                      <Link
                        href={`/maintenance/${maintenance.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Info size={16} />
                        View Details
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Completed maintenances */}
              {maintenances.filter(m => m.status === 'COMPLETED').length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                    Recent Completed Maintenance
                  </h3>
                  {maintenances
                    .filter(m => m.status === 'COMPLETED')
                    .slice(0, 3)
                    .map((maintenance) => (
                    <div key={maintenance.id} className="bg-gray-50 dark:bg-yorkhost-darkCard/50 rounded-lg p-4 border border-gray-200 dark:border-yorkhost-darkBorder">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white break-words">
                            {maintenance.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Completed on {maintenance.endTime ? format(new Date(maintenance.endTime), 'PPP') : 'N/A'}
                          </p>
                        </div>
                        <span className="text-green-500 flex-shrink-0 ml-2">✓</span>
                      </div>
                      <Link
                        href={`/maintenance/${maintenance.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        <Info size={14} />
                        View Details
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}