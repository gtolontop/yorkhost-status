'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Server, Layers } from 'lucide-react'

interface Service {
  id: string
  name: string
  machineId?: string
}

interface Machine {
  id: string
  name: string
}

interface CreateIncidentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateIncidentModal({
  isOpen,
  onClose,
  onSuccess
}: CreateIncidentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    serviceId: '',
    machineId: '',
    tags: [] as string[],
    isScheduled: false,
    scheduledFor: '',
    eta: ''
  })
  const [services, setServices] = useState<Service[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchServicesAndMachines()
      // Reset form
      setFormData({
        title: '',
        description: '',
        severity: 'MEDIUM',
        serviceId: '',
        machineId: '',
        tags: [],
        isScheduled: false,
        scheduledFor: '',
        eta: ''
      })
    }
  }, [isOpen])

  const fetchServicesAndMachines = async () => {
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
        setMachines(machinesData.data)
      }
    } catch (error) {
      console.error('Failed to fetch services and machines:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        serviceId: formData.serviceId || undefined,
        machineId: formData.machineId || undefined,
        scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor).toISOString() : undefined,
        eta: formData.eta ? new Date(formData.eta).toISOString() : undefined
      }

      const response = await fetch('/api/admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create incident')
      }
    } catch (error) {
      console.error('Failed to create incident:', error)
      alert('Failed to create incident')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-yorkhost-darkCard rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 dark:border-yorkhost-darkBorder px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create Incident
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Incident Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                placeholder="Brief description of the incident"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                placeholder="Detailed description of what happened and current status..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="LOW">Low - Minor issues</option>
                <option value="MEDIUM">Medium - Some users affected</option>
                <option value="HIGH">High - Many users affected</option>
                <option value="CRITICAL">Critical - Service unavailable</option>
              </select>
            </div>
          </div>

          {/* Affected Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Affected Resources</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Affected Service
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">No specific service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Affected Group
                </label>
                <select
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">No specific group</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isScheduled}
                  onChange={(e) => setFormData({ ...formData, isScheduled: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  This is a scheduled incident (maintenance)
                </span>
              </label>
            </div>

            {formData.isScheduled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Scheduled For
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Resolution
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.eta}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            )}
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
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Create Incident
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}