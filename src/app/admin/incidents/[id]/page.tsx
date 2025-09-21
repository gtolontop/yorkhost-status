'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  User, 
  Send, 
  ChevronDown,
  ChevronUp,
  Activity,
  Shield,
  Server,
  Layers,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  id: string
  username: string
  avatar?: string
}

interface Service {
  id: string
  name: string
}

interface Machine {
  id: string
  name: string
}

interface IncidentUpdate {
  id: string
  title?: string
  message: string
  status?: string
  timestamp: string
  authorId?: string
  authorName?: string
  isStatusChange: boolean
}

interface Incident {
  id: string
  type: 'INCIDENT' | 'MAINTENANCE'
  title: string
  description: string
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  serviceId?: string
  machineId?: string
  service?: Service
  machine?: Machine
  startTime: string
  endTime?: string
  scheduledFor?: string
  scheduledUntil?: string
  isScheduled?: boolean
  updates?: IncidentUpdate[]
  creator?: User
}

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Update form state
  const [updateForm, setUpdateForm] = useState({
    message: '',
    status: '',
    changeStatus: false
  })

  useEffect(() => {
    fetchIncident()
    // Set up polling for real-time updates
    const interval = setInterval(fetchIncident, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  const fetchIncident = async () => {
    try {
      const response = await fetch(`/api/admin/incidents/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Incident not found')
        }
        throw new Error('Failed to fetch incident')
      }
      const result = await response.json()
      setIncident(result.data)
      
      // Set initial status for form
      if (!updateForm.status && result.data) {
        setUpdateForm(prev => ({ ...prev, status: result.data.status }))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load incident')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!updateForm.message.trim()) return
    
    setSubmitting(true)
    try {
      // Create the update
      const updateResponse = await fetch(`/api/admin/incidents/${params.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: updateForm.message,
          title: updateForm.changeStatus ? 'Status Update' : undefined
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to create update')
      }

      // Update status if needed
      if (updateForm.changeStatus && updateForm.status !== incident?.status) {
        const statusResponse = await fetch(`/api/admin/incidents/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...incident,
            status: updateForm.status,
            statusUpdateMessage: updateForm.message
          })
        })

        if (!statusResponse.ok) {
          throw new Error('Failed to update status')
        }
      }

      // Reset form and refresh
      setUpdateForm({
        message: '',
        status: incident?.status || '',
        changeStatus: false
      })
      setShowUpdateForm(false)
      await fetchIncident()
    } catch (err: any) {
      setError(err.message || 'Failed to submit update')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      INVESTIGATING: 'text-orange-600 bg-orange-50',
      IDENTIFIED: 'text-yellow-600 bg-yellow-50',
      MONITORING: 'text-blue-600 bg-blue-50',
      RESOLVED: 'text-green-600 bg-green-50',
      SCHEDULED: 'text-blue-600 bg-blue-50',
      IN_PROGRESS: 'text-orange-600 bg-orange-50',
      COMPLETED: 'text-green-600 bg-green-50'
    }
    return colors[status] || 'text-gray-600 bg-gray-50'
  }

  const getSeverityColor = (severity: string) => {
    const colors: { [key: string]: string } = {
      LOW: 'text-blue-600 bg-blue-50',
      MEDIUM: 'text-yellow-600 bg-yellow-50',
      HIGH: 'text-orange-600 bg-orange-50',
      CRITICAL: 'text-red-600 bg-red-50'
    }
    return colors[severity] || 'text-gray-600 bg-gray-50'
  }

  const getStatusOptions = () => {
    if (incident?.type === 'INCIDENT') {
      return ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED']
    } else {
      return ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED']
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
    
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!incident) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle size={48} className="text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900">Incident not found</p>
          <button
            onClick={() => router.push('/admin/incidents')}
            className="mt-4 px-4 py-2 text-sm text-[#6D96FF] hover:text-[#5A84FF]"
          >
            Back to incidents
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.push('/admin/incidents')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Incident Details</h1>
          <button
            onClick={fetchIncident}
            className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} />
          </button>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3"
            >
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Incident Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="space-y-4">
            {/* Title and badges */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{incident.title}</h2>
                <p className="mt-2 text-gray-600">{incident.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-full',
                  !incident.isScheduled ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
                )}>
                  {incident.isScheduled ? 'MAINTENANCE' : 'INCIDENT'}
                </span>
              </div>
            </div>

            {/* Status and severity */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500">Status:</span>
                <span className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getStatusColor(incident.status)
                )}>
                  {incident.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Shield size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500">Severity:</span>
                <span className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getSeverityColor(incident.severity)
                )}>
                  {incident.severity}
                </span>
              </div>

              {/* Affected services */}
              {(incident.service || incident.machine) && (
                <>
                  {incident.service && (
                    <div className="flex items-center gap-2">
                      <Server size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500">Service:</span>
                      <span className="text-sm font-medium">{incident.service.name}</span>
                    </div>
                  )}
                  {incident.machine && (
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500">Group:</span>
                      <span className="text-sm font-medium">{incident.machine.name}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Timeline info */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500">Started:</span>
                <span className="text-sm font-medium">{new Date(incident.startTime).toLocaleString()}</span>
              </div>
              {incident.endTime && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Ended:</span>
                  <span className="text-sm font-medium">{new Date(incident.endTime).toLocaleString()}</span>
                </div>
              )}
              {incident.creator && (
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Created by:</span>
                  <span className="text-sm font-medium">{incident.creator.username}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Updates Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* Initial incident creation */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar size={16} className="text-gray-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">Incident created</p>
                    <span className="text-xs text-gray-500">{formatTimestamp(incident.startTime)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{incident.description}</p>
                  {incident.creator && (
                    <p className="mt-2 text-xs text-gray-500">by {incident.creator.username}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Updates */}
            <AnimatePresence>
              {incident.updates?.map((update, index) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        update.isStatusChange ? 'bg-blue-100' : 'bg-gray-100'
                      )}>
                        {update.isStatusChange ? (
                          <Activity size={16} className="text-blue-600" />
                        ) : (
                          <User size={16} className="text-gray-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {update.title && (
                          <p className="font-medium text-gray-900">{update.title}</p>
                        )}
                        {update.status && (
                          <span className={clsx(
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            getStatusColor(update.status)
                          )}>
                            {update.status.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{formatTimestamp(update.timestamp)}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{update.message}</p>
                      {update.authorName && (
                        <p className="mt-2 text-xs text-gray-500">by {update.authorName}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {(!incident.updates || incident.updates.length === 0) && (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">No updates yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Add Update Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div 
            className="px-6 py-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowUpdateForm(!showUpdateForm)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Update</h3>
              {showUpdateForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
          
          <AnimatePresence>
            {showUpdateForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleSubmitUpdate} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Message
                    </label>
                    <textarea
                      value={updateForm.message}
                      onChange={(e) => setUpdateForm({ ...updateForm, message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      rows={4}
                      placeholder="Describe the update..."
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={updateForm.changeStatus}
                        onChange={(e) => setUpdateForm({ ...updateForm, changeStatus: e.target.checked })}
                        className="rounded border-gray-300 text-[#6D96FF] focus:ring-primary/20"
                      />
                      <span className="text-sm font-medium text-gray-700">Change status with this update</span>
                    </label>
                  </div>

                  <AnimatePresence>
                    {updateForm.changeStatus && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Status
                        </label>
                        <select
                          value={updateForm.status}
                          onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          {getStatusOptions().map(status => (
                            <option key={status} value={status}>
                              {status.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUpdateForm(false)
                        setUpdateForm({
                          message: '',
                          status: incident.status,
                          changeStatus: false
                        })
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !updateForm.message.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-[#6D96FF] text-white rounded-lg hover:bg-[#5A84FF] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Post Update
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AdminLayout>
  )
}