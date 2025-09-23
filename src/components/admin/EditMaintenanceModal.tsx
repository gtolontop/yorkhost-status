'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Server, AlertTriangle } from 'lucide-react'

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
  severity: string
  scheduledFor?: string
  scheduledEnd?: string
  affectedServices?: string[]
}

interface EditMaintenanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  maintenance?: Maintenance | null
}

export default function EditMaintenanceModal({
  isOpen,
  onClose,
  onSuccess,
  maintenance
}: EditMaintenanceModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'SCHEDULED',
    severity: 'MEDIUM',
    scheduledFor: '',
    scheduledEnd: '',
    affectedServices: [] as string[]
  })
  const [services, setServices] = useState<Service[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchServices()
      if (maintenance) {
        setFormData({
          title: maintenance.title,
          description: maintenance.description,
          status: maintenance.status,
          severity: maintenance.severity,
          scheduledFor: maintenance.scheduledFor ? new Date(maintenance.scheduledFor).toISOString().slice(0, 16) : '',
          scheduledEnd: maintenance.scheduledEnd ? new Date(maintenance.scheduledEnd).toISOString().slice(0, 16) : '',
          affectedServices: maintenance.affectedServices || []
        })
        setSelectedServices(maintenance.affectedServices || [])
      } else {
        setFormData({
          title: '',
          description: '',
          status: 'SCHEDULED',
          severity: 'MEDIUM',
          scheduledFor: '',
          scheduledEnd: '',
          affectedServices: []
        })
        setSelectedServices([])
      }
    }
  }, [isOpen, maintenance])

  const fetchServices = async () => {
    try {
      const [servicesRes, machinesRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/groups')
      ])

      const servicesData = await servicesRes.json()
      const machinesData = await machinesRes.json()

      const servicesList = servicesData.success ? servicesData.data : servicesData
      if (Array.isArray(servicesList)) {
        setServices(servicesList)
      }

      if (machinesData.success) {
        const machinesWithServices = machinesData.data.map((machine: Machine) => ({
          ...machine,
          services: servicesList?.filter((service: Service) => service.machineId === machine.id) || []
        }))

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
      console.error('Failed to fetch services:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor).toISOString() : undefined,
        scheduledEnd: formData.scheduledEnd ? new Date(formData.scheduledEnd).toISOString() : undefined,
        affectedServices: selectedServices
      }

      const response = await fetch(`/api/admin/maintenances/${maintenance?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update maintenance')
      }
    } catch (error) {
      console.error('Failed to update maintenance:', error)
      alert('Failed to update maintenance')
    } finally {
      setLoading(false)
    }
  }

  const toggleServiceSelection = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId))
    } else {
      setSelectedServices([...selectedServices, serviceId])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-yorkhost-darkCard rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 dark:border-yorkhost-darkBorder px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Maintenance
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Schedule</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
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
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedServices.length} service(s) selected
              </span>
            </div>

            <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
              {machines.map((machine) => (
                <div key={machine.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <Server className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {machine.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({machine.services?.length || 0} services)
                      </span>
                    </div>
                    {machine.services && (
                      <div className="ml-7 space-y-2">
                        {machine.services.map((service) => (
                          <label
                            key={service.id}
                            className="flex items-center gap-2 cursor-pointer"
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
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                'Update Maintenance'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}