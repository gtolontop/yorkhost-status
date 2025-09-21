'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { AlertTriangle, AlertCircle, Clock, Activity, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'

interface DownService {
  id: string
  name: string
  description?: string
  status: string
  lastCheck?: string
  uptimePercent24h: number
  averageResponseTime: number
  machine?: {
    id: string
    name: string
  }
  activeIncident?: {
    id: string
    title: string
    status: string
    startTime: string
    slug?: string
  }
}

interface DownServicesData {
  totalDown: number
  withIncident: DownService[]
  withoutIncident: DownService[]
  lastUpdated: string
}

export default function AdminDownServicesPage() {
  const [downData, setDownData] = useState<DownServicesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchDownServices = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/down-services')
      if (!response.ok) throw new Error('Failed to fetch down services')
      const data = await response.json()
      setDownData(data)
    } catch (err) {
      setError('Failed to load down services')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDownServices()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDownServices, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  const hasDownServices = downData && downData.totalDown > 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Down Services</h1>
            <p className="text-gray-600 mt-1">Real-time overview of all services experiencing outages</p>
          </div>
          <button
            onClick={fetchDownServices}
            disabled={refreshing}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              "bg-gray-100 text-gray-700 hover:bg-gray-200",
              refreshing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Down</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{downData?.totalDown || 0}</p>
                <p className="mt-1 text-sm text-gray-600">Services currently experiencing issues</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Without Incidents</p>
                <p className="mt-2 text-3xl font-semibold text-red-600">{downData?.withoutIncident.length || 0}</p>
                <p className="mt-1 text-sm text-gray-600">Major outages requiring incident reports</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">With Incidents</p>
                <p className="mt-2 text-3xl font-semibold text-orange-600">{downData?.withIncident.length || 0}</p>
                <p className="mt-1 text-sm text-gray-600">Acknowledged with active incidents</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {!hasDownServices && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Systems Operational</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Great news! All services are currently operating normally.
              </p>
            </div>
          </div>
        )}

        {/* Services without incidents */}
        {downData?.withoutIncident && downData.withoutIncident.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Major Outages (No Incident Linked)
            </h2>
            <div className="space-y-4">
              {downData.withoutIncident.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 bg-red-600 rounded-full animate-pulse" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {service.name}
                            {service.machine && (
                              <span className="text-sm text-gray-500 font-normal ml-2">
                                on {service.machine.name}
                              </span>
                            )}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-full">
                        DOWN
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Status</p>
                        <p className="font-medium text-gray-900">Requires Incident Report</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Last Check</p>
                        <p className="font-medium text-gray-900">
                          {service.lastCheck ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(service.lastCheck), { addSuffix: true })}
                            </span>
                          ) : (
                            'Never'
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">24h Uptime</p>
                        <p className="font-medium text-gray-900">{service.uptimePercent24h.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Response Time</p>
                        <p className="font-medium text-gray-900">
                          {service.averageResponseTime > 0 
                            ? `${Math.round(service.averageResponseTime)}ms` 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Link 
                        href={`/admin/incidents/new?serviceId=${service.id}`}
                        className="inline-flex items-center gap-1 text-sm text-[#6D96FF] hover:text-[#5A84FF] transition-colors"
                      >
                        Create Incident Report
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services with incidents */}
        {downData?.withIncident && downData.withIncident.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Acknowledged Outages (With Active Incidents)
            </h2>
            <div className="space-y-4">
              {downData.withIncident.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-sm border border-orange-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 bg-orange-600 rounded-full animate-pulse" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {service.name}
                            {service.machine && (
                              <span className="text-sm text-gray-500 font-normal ml-2">
                                on {service.machine.name}
                              </span>
                            )}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium text-white bg-orange-600 rounded-full">
                        DOWN - ACKNOWLEDGED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Active Incident</p>
                        <p className="font-medium text-gray-900">{service.activeIncident?.title}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Incident Status</p>
                        <p className="font-medium">
                          <span className={clsx(
                            "px-2 py-1 text-xs rounded-full",
                            "text-orange-600 bg-orange-50"
                          )}>
                            {service.activeIncident?.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Started</p>
                        <p className="font-medium text-gray-900">
                          {service.activeIncident?.startTime ? (
                            formatDistanceToNow(new Date(service.activeIncident.startTime), { addSuffix: true })
                          ) : (
                            'Unknown'
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">24h Uptime</p>
                        <p className="font-medium text-gray-900">{service.uptimePercent24h.toFixed(2)}%</p>
                      </div>
                    </div>

                    {service.activeIncident && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Link 
                          href={`/incident/${service.activeIncident.slug || service.activeIncident.id}`}
                          className="inline-flex items-center gap-1 text-sm text-[#6D96FF] hover:text-[#5A84FF] transition-colors"
                        >
                          View Incident Details
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last updated */}
        {downData && (
          <div className="text-center text-sm text-gray-500">
            Last updated: {formatDistanceToNow(new Date(downData.lastUpdated), { addSuffix: true })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}