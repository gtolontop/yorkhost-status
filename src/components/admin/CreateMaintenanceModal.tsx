'use client'

import { useState, useEffect } from 'react'
import { X, Wrench, Server, ChevronDown, ChevronUp } from 'lucide-react'

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

interface CreateMaintenanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: any
}

export default function CreateMaintenanceModal({ isOpen, onClose, onSuccess, editData }: CreateMaintenanceModalProps) {
  const [services, setServices] = useState<Service[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: editData?.title || '',
    description: editData?.description || '',
    type: 'MAINTENANCE' as const,
    status: editData?.status || 'SCHEDULED',
    severity: editData?.severity || 'MEDIUM',
    impact: editData?.impact || '',
    scheduledFor: editData?.scheduledFor ? new Date(editData.scheduledFor).toISOString().slice(0, 16) : '',
    scheduledEnd: editData?.scheduledEnd ? new Date(editData.scheduledEnd).toISOString().slice(0, 16) : '',
    affectedServices: editData?.affectedServices || []
  })

  useEffect(() => {
    fetchServicesAndMachines()
    if (editData?.affectedServices) {
      setSelectedServices(editData.affectedServices)
    }
  }, [editData])

  const fetchServicesAndMachines = async () => {
    try {
      // Fetch services
      const servicesResponse = await fetch('/api/services')
      const servicesData = await servicesResponse.json()
      const servicesList = servicesData.success ? servicesData.data : servicesData
      if (Array.isArray(servicesList)) {
        setServices(servicesList)
      }

      // Fetch machines/groups
      const machinesResponse = await fetch('/api/groups')
      const machinesData = await machinesResponse.json()
      if (machinesData.success) {
        const machinesWithServices = machinesData.data.map((machine: Machine) => ({
          ...machine,
          services: servicesList?.filter((service: Service) => service.machineId === machine.id) || []
        }))

        // Add ungrouped services
        const ungroupedServices = servicesList?.filter((service: Service) => !service.machineId) || []
        if (ungroupedServices.length > 0) {
          machinesWithServices.push({
            id: 'ungrouped',
            name: 'Ungrouped Services',
            services: ungroupedServices
          })
        }

        setMachines(machinesWithServices)
      }
    } catch (error) {
      console.error('Failed to fetch services and machines:', error)
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
      setSelectedServices(selectedServices.filter(id => !groupServiceIds.includes(id)))
    } else {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' + Date.now()

      const payload = {
        ...formData,
        slug,
        isScheduled: true,
        startTime: formData.scheduledFor
          ? new Date(formData.scheduledFor).toISOString()
          : new Date().toISOString(),
        scheduledFor: formData.scheduledFor
          ? new Date(formData.scheduledFor).toISOString()
          : undefined,
        scheduledEnd: formData.scheduledEnd
          ? new Date(formData.scheduledEnd).toISOString()
          : undefined,
        affectedServices: selectedServices
      }

      const response = await fetch(
        editData ? `/api/admin/maintenances/${editData.id}` : '/api/admin/maintenances',
        {
          method: editData ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save maintenance')
      }
    } catch (error) {
      console.error('Failed to save maintenance:', error)
      alert('Failed to save maintenance')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl my-8">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editData ? 'Edit' : 'Schedule'} Maintenance
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Database maintenance and optimization"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
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
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
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
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {loading ? 'Saving...' : (editData ? 'Update' : 'Schedule')} Maintenance
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}