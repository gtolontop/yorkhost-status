'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Plus, Edit2, Trash2, AlertCircle, Calendar, Filter, X, Eye } from 'lucide-react'
import { clsx } from 'clsx'
import Link from 'next/link'

interface Service {
  id: string
  name: string
}

interface Machine {
  id: string
  name: string
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
  updates?: any[]
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'INCIDENT' | 'MAINTENANCE'>('INCIDENT')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Form state
  const [formData, setFormData] = useState({
    type: 'INCIDENT' as 'INCIDENT' | 'MAINTENANCE',
    title: '',
    description: '',
    status: 'INVESTIGATING' as Incident['status'],
    severity: 'MEDIUM' as Incident['severity'],
    serviceId: '',
    machineId: '',
    scheduledFor: '',
    scheduledUntil: ''
  })

  useEffect(() => {
    fetchIncidents()
    fetchServices()
    fetchMachines()
  }, [])

  const fetchIncidents = async () => {
    try {
      const response = await fetch('/api/admin/incidents')
      if (!response.ok) throw new Error('Failed to fetch incidents')
      const result = await response.json()
      // Filter only INCIDENT type, not MAINTENANCE
      const incidentsOnly = result.success
        ? result.data.filter((item: Incident) => item.type === 'INCIDENT')
        : []
      setIncidents(incidentsOnly)
    } catch (err) {
      setError('Failed to load incidents')
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (!response.ok) throw new Error('Failed to fetch services')
      const data = await response.json()
      setServices(data.error ? [] : data)
    } catch (err) {
      setServices([])
    }
  }

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/groups')
      if (!response.ok) throw new Error('Failed to fetch groups')
      const result = await response.json()
      if (result.success) {
        setMachines(result.data.map((g: any) => ({ id: g.id, name: g.name })))
      }
    } catch (err) {
      setMachines([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingIncident 
        ? `/api/admin/incidents/${editingIncident.id}`
        : '/api/admin/incidents'
      
      const method = editingIncident ? 'PUT' : 'POST'
      
      // Transform form data to match API schema
      const payload = editingIncident ? {
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        status: formData.status,
        serviceId: formData.serviceId || undefined,
        machineId: formData.machineId || undefined,
        tags: []
      } : {
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        isScheduled: formData.type === 'MAINTENANCE',
        serviceId: formData.serviceId || undefined,
        machineId: formData.machineId || undefined,
        scheduledFor: formData.scheduledFor || undefined,
        tags: []
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save incident')
      }
      
      await fetchIncidents()
      closeModal()
    } catch (err: any) {
      setError(err.message || 'Failed to save incident')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) return
    
    try {
      const response = await fetch(`/api/admin/incidents/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete incident')
      await fetchIncidents()
    } catch (err) {
      setError('Failed to delete incident')
    }
  }

  const openModal = (incident?: Incident) => {
    if (incident) {
      setEditingIncident(incident)
      setFormData({
        type: 'INCIDENT', // Always INCIDENT on this page
        title: incident.title,
        description: incident.description,
        status: incident.status,
        severity: incident.severity,
        serviceId: incident.serviceId || '',
        machineId: incident.machineId || '',
        scheduledFor: '',
        scheduledUntil: ''
      })
    } else {
      setEditingIncident(null)
      setFormData({
        type: 'INCIDENT',
        title: '',
        description: '',
        status: 'INVESTIGATING',
        severity: 'MEDIUM',
        serviceId: '',
        machineId: '',
        scheduledFor: '',
        scheduledUntil: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingIncident(null)
  }

  const getStatusOptions = () => {
    if (formData.type === 'INCIDENT') {
      return ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED']
    } else {
      return ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED']
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

  const filteredIncidents = incidents.filter(incident => {
    if (typeFilter !== 'all') {
      if (typeFilter === 'INCIDENT' && incident.isScheduled) return false
      if (typeFilter === 'MAINTENANCE' && !incident.isScheduled) return false
    }
    if (statusFilter !== 'all' && incident.status !== statusFilter) return false
    return true
  })

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Incident Management</h1>
            <p className="text-gray-600 mt-1">Track and manage system incidents</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#6D96FF] text-white rounded-lg hover:bg-[#5A84FF] transition-colors"
          >
            <Plus size={20} />
            Create Incident
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-500" />
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Types</option>
              <option value="INCIDENT">Incidents</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="IDENTIFIED">Identified</option>
              <option value="MONITORING">Monitoring</option>
              <option value="RESOLVED">Resolved</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        !incident.isScheduled ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
                      )}>
                        {incident.isScheduled ? 'MAINTENANCE' : 'INCIDENT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={`/admin/incidents/${incident.id}`}
                        className="group"
                      >
                        <div className="text-sm font-medium text-gray-900 group-hover:text-[#6D96FF] transition-colors">{incident.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{incident.description}</div>
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        getStatusColor(incident.status)
                      )}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        getSeverityColor(incident.severity)
                      )}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.service && (
                        <div>{incident.service.name}</div>
                      )}
                      {incident.machine && (
                        <div>{incident.machine.name}</div>
                      )}
                      {!incident.service && !incident.machine && <span className="text-gray-400">None</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(incident.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/incidents/${incident.id}`}
                          className="text-[#6D96FF] hover:text-[#5A84FF]"
                          title="View details"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => openModal(incident)}
                          className="text-[#6D96FF] hover:text-[#5A84FF]"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(incident.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredIncidents.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No incidents found</p>
                <p className="text-sm mt-1">Create your first incident or adjust your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingIncident ? 'Edit' : 'Create'} Incident
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Type - Hidden for incidents page */}
                <input type="hidden" value="INCIDENT" />

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    rows={4}
                    required
                  />
                </div>

                {/* Status and Severity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Incident['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {getStatusOptions().map(status => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as Incident['severity'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Affected Service/Group */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Affected Service</label>
                    <select
                      value={formData.serviceId}
                      onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">None</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Affected Group</label>
                    <select
                      value={formData.machineId}
                      onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">None</option>
                      {machines.map(machine => (
                        <option key={machine.id} value={machine.id}>
                          {machine.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Scheduled Times removed - not needed for incidents */}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#6D96FF] text-white rounded-lg hover:bg-[#5A84FF]"
                  >
                    {editingIncident ? 'Update' : 'Create'} {formData.type === 'INCIDENT' ? 'Incident' : 'Maintenance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}