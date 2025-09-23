'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import {
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
  RefreshCw,
  Wrench,
  Edit,
  Settings
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

interface MaintenanceUpdate {
  id: string
  title?: string
  message: string
  status?: string
  timestamp: string
  authorId?: string
  authorName?: string
  isStatusChange: boolean
}

interface Maintenance {
  id: string
  type: 'MAINTENANCE'
  title: string
  description: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  serviceId?: string
  machineId?: string
  service?: Service
  machine?: Machine
  startTime: string
  endTime?: string
  scheduledFor?: string
  scheduledEnd?: string
  affectedServices?: string[]
  affectedServicesWithNames?: Array<{
    id: string
    name: string
  }>
  isScheduled?: boolean
  updates?: MaintenanceUpdate[]
  creator?: User
}

export default function MaintenanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  // Update form state
  const [updateForm, setUpdateForm] = useState({
    message: '',
    status: '',
    changeStatus: false
  })

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    scheduledFor: '',
    scheduledEnd: ''
  })

  useEffect(() => {
    fetchMaintenance()
    checkAutoStatus()
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchMaintenance()
      checkAutoStatus()
    }, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [params.id])

  const checkAutoStatus = async () => {
    try {
      await fetch('/api/admin/maintenances/auto-status', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to check auto status:', error)
    }
  }

  const fetchMaintenance = async () => {
    try {
      const response = await fetch(`/api/admin/maintenances/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Maintenance not found')
        }
        throw new Error('Failed to fetch maintenance')
      }
      const result = await response.json()
      setMaintenance(result.data)

      // Set initial status for form
      if (!updateForm.status && result.data) {
        setUpdateForm(prev => ({ ...prev, status: result.data.status }))
      }

      // Set edit form data
      if (result.data) {
        setEditForm({
          title: result.data.title,
          description: result.data.description,
          scheduledFor: result.data.scheduledFor ? new Date(result.data.scheduledFor).toISOString().slice(0, 16) : '',
          scheduledEnd: result.data.scheduledEnd ? new Date(result.data.scheduledEnd).toISOString().slice(0, 16) : ''
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load maintenance')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!updateForm.message.trim()) return

    setSubmitting(true)
    try {
      const updatePayload: any = {
        message: updateForm.message,
        title: updateForm.changeStatus ? 'Status Update' : undefined
      }

      if (updateForm.changeStatus && updateForm.status !== maintenance?.status) {
        updatePayload.status = updateForm.status
      }

      const updateResponse = await fetch(`/api/admin/maintenances/${params.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to create update')
      }

      // Reset form and refresh
      setUpdateForm({
        message: '',
        status: maintenance?.status || '',
        changeStatus: false
      })
      setShowUpdateForm(false)
      await fetchMaintenance()
    } catch (err: any) {
      setError(err.message || 'Failed to submit update')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/maintenances/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          scheduledFor: editForm.scheduledFor ? new Date(editForm.scheduledFor).toISOString() : undefined,
          scheduledEnd: editForm.scheduledEnd ? new Date(editForm.scheduledEnd).toISOString() : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update maintenance')
      }

      setShowEditForm(false)
      await fetchMaintenance()
    } catch (err: any) {
      setError(err.message || 'Failed to update maintenance')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
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

  if (!maintenance) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Wrench size={48} className="text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">Maintenance not found</p>
          <button
            onClick={() => router.push('/admin/maintenances')}
            className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Back to maintenances
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
            onClick={() => router.push('/admin/maintenances')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance Details</h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => window.open(`/maintenance/${maintenance?.id}`, '_blank')}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="View public maintenance page"
            >
              View Public Page
            </button>
            <button
              onClick={fetchMaintenance}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
          </div>
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

        {/* Maintenance Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-yorkhost-darkCard rounded-lg shadow-sm border border-gray-200 dark:border-yorkhost-darkBorder p-6"
        >
          <div className="space-y-4">
            {/* Title and badges */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{maintenance.title}</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{maintenance.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Edit maintenance"
                >
                  <Edit size={16} />
                </button>
                <span className="px-3 py-1 text-xs font-medium rounded-full text-blue-600 bg-blue-50">
                  MAINTENANCE
                </span>
              </div>
            </div>

            {/* Status and severity */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 dark:border-yorkhost-darkBorder">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                <span className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getStatusColor(maintenance.status)
                )}>
                  {maintenance.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Shield size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Severity:</span>
                <span className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getSeverityColor(maintenance.severity)
                )}>
                  {maintenance.severity}
                </span>
              </div>

              {/* Affected services */}
              {maintenance.affectedServicesWithNames && maintenance.affectedServicesWithNames.length > 0 && (
                <div className="flex items-center gap-2">
                  <Server size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Services:</span>
                  <div className="flex flex-wrap gap-1">
                    {maintenance.affectedServicesWithNames.slice(0, 3).map((service) => (
                      <span key={service.id} className="text-sm font-medium text-gray-900 dark:text-white">
                        {service.name}
                      </span>
                    ))}
                    {maintenance.affectedServicesWithNames.length > 3 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        +{maintenance.affectedServicesWithNames.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline info */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-200 dark:border-yorkhost-darkBorder">
              {maintenance.scheduledFor && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Scheduled:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(maintenance.scheduledFor).toLocaleString()}</span>
                </div>
              )}
              {maintenance.scheduledEnd && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Expected End:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(maintenance.scheduledEnd).toLocaleString()}</span>
                </div>
              )}
              {maintenance.creator && (
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Created by:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{maintenance.creator.username}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Edit Form Modal */}
        <AnimatePresence>
          {showEditForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-yorkhost-darkCard rounded-lg shadow-xl w-full max-w-2xl"
              >
                <div className="border-b border-gray-200 dark:border-yorkhost-darkBorder px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Maintenance</h3>
                </div>
                <form onSubmit={handleEditMaintenance} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Scheduled Start
                      </label>
                      <input
                        type="datetime-local"
                        value={editForm.scheduledFor}
                        onChange={(e) => setEditForm({ ...editForm, scheduledFor: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Scheduled End
                      </label>
                      <input
                        type="datetime-local"
                        value={editForm.scheduledEnd}
                        onChange={(e) => setEditForm({ ...editForm, scheduledEnd: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Updates Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-yorkhost-darkCard rounded-lg shadow-sm border border-gray-200 dark:border-yorkhost-darkBorder"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-yorkhost-darkBorder">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Timeline</h3>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-yorkhost-darkBorder">
            {/* Initial maintenance creation */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wrench size={16} className="text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">Maintenance scheduled</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(maintenance.startTime)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{maintenance.description}</p>
                  {maintenance.creator && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">by {maintenance.creator.username}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Updates */}
            <AnimatePresence>
              {maintenance.updates?.map((update, index) => (
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
                        update.isStatusChange ? 'bg-orange-100' : 'bg-gray-100'
                      )}>
                        {update.isStatusChange ? (
                          <Activity size={16} className="text-orange-600" />
                        ) : (
                          <User size={16} className="text-gray-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {update.title && (
                          <p className="font-medium text-gray-900 dark:text-white">{update.title}</p>
                        )}
                        {update.status && (
                          <span className={clsx(
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            getStatusColor(update.status)
                          )}>
                            {update.status.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(update.timestamp)}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{update.message}</p>
                      {update.authorName && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">by {update.authorName}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {(!maintenance.updates || maintenance.updates.length === 0) && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
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
          className="bg-white dark:bg-yorkhost-darkCard rounded-lg shadow-sm border border-gray-200 dark:border-yorkhost-darkBorder"
        >
          <div
            className="px-6 py-4 border-b border-gray-200 dark:border-yorkhost-darkBorder cursor-pointer hover:bg-gray-50 dark:hover:bg-yorkhost-darkBg/50 transition-colors"
            onClick={() => setShowUpdateForm(!showUpdateForm)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Update</h3>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Update Message
                    </label>
                    <textarea
                      value={updateForm.message}
                      onChange={(e) => setUpdateForm({ ...updateForm, message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      rows={4}
                      placeholder="Describe the maintenance progress..."
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={updateForm.changeStatus}
                        onChange={(e) => setUpdateForm({ ...updateForm, changeStatus: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Change status with this update</span>
                    </label>
                  </div>

                  <AnimatePresence>
                    {updateForm.changeStatus && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Status
                        </label>
                        <select
                          value={updateForm.status}
                          onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
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
                          status: maintenance.status,
                          changeStatus: false
                        })
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !updateForm.message.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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