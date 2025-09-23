'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import CreateIncidentModal from '@/components/admin/CreateIncidentModal'
import { formatDistanceToNow } from 'date-fns'
import { Calendar, Wrench, Clock, Edit, Trash2, Eye, Plus, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Server } from 'lucide-react'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  machineId?: string
}

interface Machine {
  id: string
  name: string
  services?: Service[]
}

interface Maintenance {
  id: string
  title: string
  description: string
  status: string
  type: string
  severity: string
  scheduledFor?: string
  scheduledEnd?: string
  startTime: string
  endTime?: string
  affectedServices?: string[]
  serviceId?: string
  machineId?: string
  service?: { name: string }
  machine?: { name: string }
  creator?: { username: string }
  updates?: Array<{ message: string }>
}

export default function MaintenancesPage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null)
  const [showAdvancedModal, setShowAdvancedModal] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'MAINTENANCE',
    status: 'SCHEDULED',
    severity: 'MEDIUM',
    impact: '',
    scheduledFor: '',
    scheduledEnd: '',
    affectedServices: [] as string[]
  })

  useEffect(() => {
    fetchMaintenances()
    fetchServicesAndMachines()
  }, [])

  const fetchMaintenances = async () => {
    try {
      const response = await fetch('/api/admin/incidents')
      const data = await response.json()
      if (data.success) {
        // Filter only maintenance type incidents
        const maintenanceOnly = data.data.filter((item: Maintenance) => item.type === 'MAINTENANCE')
        setMaintenances(maintenanceOnly)
      }
    } catch (error) {
      console.error('Failed to fetch maintenances:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServicesAndMachines = async () => {
    try {
      // Fetch services
      const servicesResponse = await fetch('/api/services')
      const servicesData = await servicesResponse.json()
      console.log('Services data:', servicesData)

      // Handle different response formats
      const servicesList = servicesData.success ? servicesData.data : servicesData
      if (Array.isArray(servicesList)) {
        setServices(servicesList)
      }

      // Fetch machines/groups
      const machinesResponse = await fetch('/api/groups')
      const machinesData = await machinesResponse.json()
      if (machinesData.success) {
        // Associate services with machines
        const machinesWithServices = machinesData.data.map((machine: Machine) => ({
          ...machine,
          services: servicesList?.filter((service: Service) => service.machineId === machine.id) || []
        }))

        // Add ungrouped services as a special group
        const ungroupedServices = servicesList?.filter((service: Service) => !service.machineId) || []
        if (ungroupedServices.length > 0) {
          machinesWithServices.push({
            id: 'ungrouped',
            name: 'Ungrouped Services',
            services: ungroupedServices
          })
        }

        console.log('Machines with services:', machinesWithServices)
        setMachines(machinesWithServices)
      }
    } catch (error) {
      console.error('Failed to fetch services and machines:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance?')) return

    try {
      const response = await fetch(`/api/admin/incidents/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchMaintenances()
      }
    } catch (error) {
      console.error('Failed to delete maintenance:', error)
    }
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    setShowAdvancedModal(false)
    setEditingMaintenance(null)
    setSelectedServices([])
    fetchMaintenances()
  }

  const handleAdvancedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' + Date.now()

      const payload = {
        ...formData,
        slug,
        startTime: formData.scheduledFor
          ? new Date(formData.scheduledFor).toISOString()
          : new Date().toISOString(),
        scheduledFor: formData.scheduledFor
          ? new Date(formData.scheduledFor).toISOString()
          : undefined,
        scheduledEnd: formData.scheduledEnd
          ? new Date(formData.scheduledEnd).toISOString()
          : undefined,
        affectedServices: selectedServices,
        isScheduled: true
      }

      const response = await fetch(
        editingMaintenance ? `/api/admin/incidents/${editingMaintenance.id}` : '/api/admin/incidents',
        {
          method: editingMaintenance ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      if (response.ok) {
        handleCreateSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save maintenance')
      }
    } catch (error) {
      console.error('Failed to save maintenance:', error)
      alert('Failed to save maintenance')
    }
  }

  const toggleGroup = (machineId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(machineId)) {
      newExpanded.delete(machineId)
    } else {
      newExpanded.add(machineId)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleGroupSelection = (machine: Machine) => {
    const groupServiceIds = machine.services?.map(s => s.id) || []
    const allSelected = groupServiceIds.every(id => selectedServices.includes(id))

    if (allSelected) {
      // Deselect all services from this group
      setSelectedServices(selectedServices.filter(id => !groupServiceIds.includes(id)))
    } else {
      // Select all services from this group
      const newSelection = Array.from(new Set([...selectedServices, ...groupServiceIds]))
      setSelectedServices(newSelection)
    }
  }

  const toggleServiceSelection = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId))
    } else {
      setSelectedServices([...selectedServices, serviceId])
    }
  }

  const openAdvancedModal = (maintenance?: Maintenance) => {
    if (maintenance) {
      setEditingMaintenance(maintenance)
      setFormData({
        title: maintenance.title,
        description: maintenance.description,
        type: 'MAINTENANCE',
        status: maintenance.status,
        severity: maintenance.severity,
        impact: '',
        scheduledFor: maintenance.scheduledFor ? new Date(maintenance.scheduledFor).toISOString().slice(0, 16) : '',
        scheduledEnd: maintenance.scheduledEnd ? new Date(maintenance.scheduledEnd).toISOString().slice(0, 16) : '',
        affectedServices: maintenance.affectedServices || []
      })
      setSelectedServices(maintenance.affectedServices || [])
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'MAINTENANCE',
        status: 'SCHEDULED',
        severity: 'MEDIUM',
        impact: '',
        scheduledFor: '',
        scheduledEnd: '',
        affectedServices: []
      })
      setSelectedServices([])
    }
    setShowAdvancedModal(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="w-4 h-4" />
      case 'IN_PROGRESS':
        return <Wrench className="w-4 h-4 animate-pulse" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
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
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Maintenance Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Schedule and manage maintenance windows
            </p>
          </div>
          <button
            onClick={() => openAdvancedModal()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2"
          >
            <Plus className="w-4 h-4" />
            Schedule Maintenance
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-yorkhost-darkCard p-4 rounded-lg border border-gray-200 dark:border-yorkhost-darkBorder">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {maintenances.filter(m => m.status === 'SCHEDULED').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-yorkhost-darkCard p-4 rounded-lg border border-gray-200 dark:border-yorkhost-darkBorder">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {maintenances.filter(m => m.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <Wrench className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-yorkhost-darkCard p-4 rounded-lg border border-gray-200 dark:border-yorkhost-darkBorder">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {maintenances.filter(m => m.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-yorkhost-darkCard p-4 rounded-lg border border-gray-200 dark:border-yorkhost-darkBorder">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {maintenances.length}
                </p>
              </div>
              <Wrench className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Maintenances List */}
        <div className="bg-white dark:bg-yorkhost-darkCard rounded-lg shadow-sm border border-gray-200 dark:border-yorkhost-darkBorder">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Maintenance Windows
            </h2>

            {maintenances.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No maintenance windows scheduled
                </p>
                <button
                  onClick={() => openAdvancedModal()}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Schedule First Maintenance
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-yorkhost-darkBorder">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Affected</th>
                      <th className="pb-3">Scheduled</th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3">Created By</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-yorkhost-darkBorder">
                    {maintenances.map((maintenance) => (
                      <tr key={maintenance.id} className="hover:bg-gray-50 dark:hover:bg-yorkhost-darkBg/50">
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${getStatusColor(maintenance.status)}`}>
                            {getStatusIcon(maintenance.status)}
                            {maintenance.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {maintenance.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                              {maintenance.description}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-sm">
                            {maintenance.affectedServices && maintenance.affectedServices.length > 0 ? (
                              <p className="text-gray-900 dark:text-white">
                                {maintenance.affectedServices.length} service(s)
                              </p>
                            ) : maintenance.service ? (
                              <p className="text-gray-900 dark:text-white">
                                Service: {maintenance.service.name}
                              </p>
                            ) : maintenance.machine ? (
                              <p className="text-gray-500 dark:text-gray-400">
                                Machine: {maintenance.machine.name}
                              </p>
                            ) : (
                              <p className="text-gray-400">All Services</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-900 dark:text-white">
                          {maintenance.scheduledFor ? (
                            <div>
                              <p>{new Date(maintenance.scheduledFor).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(maintenance.scheduledFor).toLocaleTimeString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not scheduled</span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="text-sm">
                            {maintenance.scheduledFor && maintenance.scheduledEnd ? (
                              <p className="text-gray-900 dark:text-white">
                                {Math.round((new Date(maintenance.scheduledEnd).getTime() - new Date(maintenance.scheduledFor).getTime()) / (1000 * 60 * 60))}h
                              </p>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-900 dark:text-white">
                          {maintenance.creator?.username || 'System'}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/incident/${maintenance.id}`}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => openAdvancedModal(maintenance)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(maintenance.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Modal with Service Selection */}
        {showAdvancedModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-yorkhost-darkCard rounded-lg shadow-xl w-full max-w-4xl my-8">
              <div className="border-b border-gray-200 dark:border-yorkhost-darkBorder px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingMaintenance ? 'Edit' : 'Schedule'} Maintenance
                </h2>
                <button
                  onClick={() => setShowAdvancedModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdvancedSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Database maintenance and optimization"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Describe the maintenance work to be performed..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Impact
                      </label>
                      <input
                        type="text"
                        value={formData.impact}
                        onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="e.g., Services may be slow"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Schedule</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.scheduledFor}
                        onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.scheduledEnd}
                        onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Affected Services */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Affected Services</h3>
                    <span className="text-sm text-gray-500">
                      {selectedServices.length} service(s) selected
                    </span>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
                    {machines.map((machine) => (
                      <div key={machine.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                        {/* Group Header */}
                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleGroup(machine.id)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                              {expandedGroups.has(machine.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <Server className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {machine.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({machine.services?.length || 0} services)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleGroupSelection(machine)}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              machine.services?.every(s => selectedServices.includes(s.id))
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {machine.services?.every(s => selectedServices.includes(s.id))
                              ? 'Deselect All'
                              : 'Select All'}
                          </button>
                        </div>

                        {/* Services List */}
                        {expandedGroups.has(machine.id) && machine.services && (
                          <div className="pl-10 pb-2">
                            {machine.services.map((service) => (
                              <label
                                key={service.id}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedServices.includes(service.id)}
                                  onChange={() => toggleServiceSelection(service.id)}
                                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {service.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    {editingMaintenance ? 'Update' : 'Schedule'} Maintenance
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