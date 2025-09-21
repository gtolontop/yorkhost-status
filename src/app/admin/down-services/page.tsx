'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { AlertTriangle, AlertCircle, Clock, Activity, ExternalLink, RefreshCw, Plus } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

interface DownService {
  id: string
  name: string
  description?: string
  status: string
  enhancedStatus: string
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

  useEffect(() => {
    fetchDownServices()
    const interval = setInterval(fetchDownServices, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchDownServices = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/down-services')
      if (!response.ok) throw new Error('Failed to fetch down services')
      const data = await response.json()
      setDownData(data)
      setError('')
    } catch (err) {
      setError('Failed to fetch down services')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatTimeAgo = (date: string | undefined) => {
    if (!date) return 'Unknown'
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (loading && !downData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6D96FF]"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Down Services</h1>
            <p className="text-gray-600 mt-1">Monitor and manage services experiencing outages</p>
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
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Down</p>
                <p className="text-2xl font-bold text-gray-900">{downData?.totalDown || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Without Incident</p>
                <p className="text-2xl font-bold text-red-600">{downData?.withoutIncident.length || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Incident</p>
                <p className="text-2xl font-bold text-orange-600">{downData?.withIncident.length || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Activity className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Services without incidents (Major Outages) */}
        {downData && downData.withoutIncident.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="text-red-600" size={20} />
              Major Outages - No Incident Reported
            </h2>
            <div className="space-y-3">
              {downData.withoutIncident.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-lg border border-red-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded">
                          <AlertTriangle className="text-red-600" size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-gray-600">{service.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              Last check: {formatTimeAgo(service.lastCheck)}
                            </span>
                            <span>Uptime: {service.uptimePercent24h.toFixed(2)}%</span>
                            {service.machine && (
                              <span>Group: {service.machine.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/services/${service.id}`}
                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                        title="View service"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <Link
                        href={`/admin/incidents?serviceId=${service.id}`}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        <Plus size={16} />
                        Create Incident
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services with incidents (Acknowledged Outages) */}
        {downData && downData.withIncident.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="text-orange-600" size={20} />
              Acknowledged Outages - With Active Incidents
            </h2>
            <div className="space-y-3">
              {downData.withIncident.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-lg border border-orange-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded">
                          <AlertTriangle className="text-orange-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-gray-600">{service.description}</p>
                          )}
                          {service.activeIncident && (
                            <div className="mt-2 p-2 bg-orange-50 rounded">
                              <p className="text-sm font-medium text-orange-900">
                                Active Incident: {service.activeIncident.title}
                              </p>
                              <p className="text-xs text-orange-700 mt-1">
                                Status: {service.activeIncident.status} • Started: {formatTimeAgo(service.activeIncident.startTime)}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              Last check: {formatTimeAgo(service.lastCheck)}
                            </span>
                            <span>Uptime: {service.uptimePercent24h.toFixed(2)}%</span>
                            {service.machine && (
                              <span>Group: {service.machine.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/services/${service.id}`}
                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                        title="View service"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      {service.activeIncident && (
                        <Link
                          href={`/admin/incidents/${service.activeIncident.id}`}
                          className="px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                        >
                          View Incident
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No down services */}
        {downData && downData.totalDown === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <AlertCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Services Operational</h3>
            <p className="text-gray-600">No services are currently experiencing downtime.</p>
          </div>
        )}

        {/* Last Updated */}
        {downData && (
          <p className="text-sm text-gray-500 text-center">
            Last updated: {formatTimeAgo(downData.lastUpdated)}
          </p>
        )}
      </div>
    </AdminLayout>
  )
}