'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import PageHeader from '@/components/ui/PageHeader'
import { Calendar, Clock, Settings, Wrench, Info, ChevronRight, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

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
  affectedServicesWithNames?: Array<{
    id: string
    name: string
  }>
  updates?: Array<{
    id: string
    title?: string
    message: string
    timestamp: string
    authorName?: string
    isStatusChange: boolean
  }>
}

export default function MaintenanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMaintenance()
  }, [params.id])

  const fetchMaintenance = async () => {
    try {
      const response = await fetch(`/api/maintenance/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Maintenance not found')
        }
        throw new Error('Failed to fetch maintenance')
      }
      const result = await response.json()

      if (result.success) {
        setMaintenance(result.data)
      } else {
        throw new Error(result.error || 'Failed to load maintenance')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load maintenance')
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

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading maintenance details...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !maintenance) {
    return (
      <Layout>
        <div className="container">
          <div className="text-center py-12">
            <Wrench size={48} className="text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {error || 'Maintenance not found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The maintenance you're looking for could not be found or is no longer available.
            </p>
            <button
              onClick={() => router.push('/maintenance')}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors gap-2"
            >
              <ArrowLeft size={16} />
              Back to All Maintenances
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/maintenance')}
              className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors gap-1"
            >
              <ArrowLeft size={16} />
              All Maintenances
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <PageHeader
              icon={<Wrench size={96} />}
              title={
                <div className="break-words max-w-full">
                  {maintenance.title}
                </div>
              }
              subtitle={
                <div className="break-words max-w-full">
                  {maintenance.description}
                </div>
              }
              status="maintenance"
            />
          </div>

          {/* Maintenance Info Card */}
          <div className="bg-white dark:bg-yorkhost-darkCard border border-gray-200 dark:border-yorkhost-darkBorder rounded-lg p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(maintenance.status)}`}>
                  {maintenance.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Severity:</span>
                <span className="text-sm flex items-center gap-1">
                  {getSeverityIcon(maintenance.severity)}
                  {maintenance.severity}
                </span>
              </div>
            </div>

            {/* Schedule Information */}
            <div className="space-y-2 mb-4">
              {maintenance.scheduledFor && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Scheduled: {format(new Date(maintenance.scheduledFor), 'PPP p')}
                  </span>
                </div>
              )}
              {maintenance.scheduledEnd && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Expected End: {format(new Date(maintenance.scheduledEnd), 'PPP p')}
                  </span>
                </div>
              )}
            </div>

            {/* Affected Services */}
            {maintenance.affectedServicesWithNames && maintenance.affectedServicesWithNames.length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-yorkhost-darkBorder">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Affected Services ({maintenance.affectedServicesWithNames.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {maintenance.affectedServicesWithNames.map((service) => (
                    <span key={service.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded text-xs font-medium break-words">
                      {service.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Updates Timeline */}
          <div className="bg-white dark:bg-yorkhost-darkCard border border-gray-200 dark:border-yorkhost-darkBorder rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-yorkhost-darkBorder">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Timeline</h3>
            </div>

            <div className="p-6">
              {maintenance.updates && maintenance.updates.length > 0 ? (
                <div className="space-y-6">
                  {maintenance.updates.map((update, index) => (
                    <div key={update.id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          update.isStatusChange ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          {update.isStatusChange ? (
                            <Settings size={16} className="text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Info size={16} className="text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col gap-2 mb-1">
                          {update.title && (
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white break-words">
                              {update.title}
                            </h4>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(update.timestamp), 'PPP p')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 whitespace-pre-wrap break-words overflow-wrap-anywhere">
                          {update.message}
                        </p>
                        {update.authorName && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            by {update.authorName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No updates available for this maintenance.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}