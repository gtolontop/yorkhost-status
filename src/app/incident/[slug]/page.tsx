'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Calendar, 
  Users,
  ArrowLeft,
  AlertTriangle,
  Wrench
} from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'

interface IncidentUpdate {
  id: string
  title?: string
  message: string
  status?: string
  timestamp: string
  authorName?: string
  isStatusChange: boolean
}

interface IncidentDetail {
  id: string
  slug: string
  title: string
  description: string
  type: 'INCIDENT' | 'MAINTENANCE'
  status: string
  severity: string
  isScheduled: boolean
  scheduledFor?: string
  scheduledEnd?: string
  startTime: string
  endTime?: string
  resolvedAt?: string
  eta?: string
  impact?: string
  affectedServices: string[]
  updates: IncidentUpdate[]
  duration?: string
}

export default function IncidentDetailPage() {
  const params = useParams()
  const [incident, setIncident] = useState<IncidentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.slug) {
      fetchIncident(params.slug as string)
    }
  }, [params.slug])

  const fetchIncident = async (slug: string) => {
    try {
      const response = await fetch(`/api/incidents/${slug}`)
      const result = await response.json()
      
      if (result.success) {
        setIncident(result.data)
      } else {
        setError(result.error || 'Failed to fetch incident')
      }
    } catch (err) {
      setError('Network error')
      console.error('Incident fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'INVESTIGATING':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'IDENTIFIED':
        return <Info className="w-5 h-5 text-blue-600" />
      case 'MONITORING':
        return <Clock className="w-5 h-5 text-orange-600" />
      case 'RESOLVED':
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'SCHEDULED':
        return <Calendar className="w-5 h-5 text-blue-600" />
      case 'IN_PROGRESS':
        return <Wrench className="w-5 h-5 text-orange-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'INVESTIGATING': 'Investigating',
      'IDENTIFIED': 'Identified',
      'MONITORING': 'Monitoring',
      'RESOLVED': 'Resolved',
      'SCHEDULED': 'Scheduled',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'INVESTIGATING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'IDENTIFIED':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'MONITORING':
      case 'IN_PROGRESS':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'SCHEDULED':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50'
      case 'HIGH':
        return 'text-orange-600 bg-orange-50'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50'
      case 'LOW':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start)
    const endTime = end ? new Date(end) : new Date()
    const diff = endTime.getTime() - startTime.getTime()
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`
    }
    return `${minutes} min${minutes !== 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !incident) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading Incident</h2>
            <p className="text-red-700">{error || 'Incident not found'}</p>
            <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              ← Back to Status Page
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Status Page
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {incident.type === 'MAINTENANCE' ? (
                  <Wrench className="w-6 h-6 text-blue-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                )}
                <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${getStatusColor(incident.status)}`}>
                  {getStatusIcon(incident.status)}
                  <span className="font-medium">{getStatusText(incident.status)}</span>
                </div>
                
                {incident.type === 'INCIDENT' && (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${getSeverityColor(incident.severity)}`}>
                    <span className="font-medium">{incident.severity}</span>
                  </div>
                )}
                
                <div className="text-gray-500">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {incident.status === 'RESOLVED' || incident.status === 'COMPLETED' 
                    ? `Duration: ${formatDuration(incident.startTime, incident.endTime)}`
                    : `Started ${formatRelativeTime(incident.startTime)}`
                  }
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{incident.description}</p>

          {/* Impact */}
          {incident.impact && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-amber-900 mb-1">Impact</h3>
              <p className="text-amber-800">{incident.impact}</p>
            </div>
          )}

          {/* Scheduled Maintenance Info */}
          {incident.isScheduled && incident.scheduledFor && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">Scheduled Maintenance</h3>
              <div className="space-y-1 text-blue-800">
                <p>
                  <strong>Start:</strong> {new Date(incident.scheduledFor).toLocaleString()}
                </p>
                {incident.scheduledEnd && (
                  <p>
                    <strong>Expected End:</strong> {new Date(incident.scheduledEnd).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Affected Services */}
          {incident.affectedServices.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Affected Services</h3>
              <div className="flex flex-wrap gap-2">
                {incident.affectedServices.map((service, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Timeline</h2>
          
          <div className="space-y-6">
            {incident.updates.map((update, index) => (
              <div key={update.id} className="relative">
                {index < incident.updates.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
                )}
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      update.isStatusChange ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {update.isStatusChange ? getStatusIcon(update.status || '') : (
                        <Info className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    {update.title && (
                      <h3 className="font-semibold text-gray-900 mb-1">{update.title}</h3>
                    )}
                    {update.isStatusChange && update.status && (
                      <div className="mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-sm font-medium ${getStatusColor(update.status)}`}>
                          {getStatusText(update.status)}
                        </span>
                      </div>
                    )}
                    <p className="text-gray-700 mb-2">{update.message}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{new Date(update.timestamp).toLocaleString()}</span>
                      {update.authorName && (
                        <>
                          <span>•</span>
                          <span>{update.authorName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Initial Event */}
            <div className="relative">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {incident.type === 'MAINTENANCE' ? 'Maintenance Created' : 'Incident Started'}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {new Date(incident.startTime).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}