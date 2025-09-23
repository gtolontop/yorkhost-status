'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Wrench } from 'lucide-react'

interface Service {
  id: string
  name: string
}

interface CreateIncidentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: any
}

export default function CreateIncidentModal({ isOpen, onClose, onSuccess, editData }: CreateIncidentModalProps) {
  const [services, setServices] = useState<Service[]>([])
  const [formData, setFormData] = useState({
    title: editData?.title || '',
    description: editData?.description || '',
    type: 'INCIDENT' as const,
    status: editData?.status || 'INVESTIGATING',
    severity: editData?.severity || 'MEDIUM',
    impact: editData?.impact || '',
    isScheduled: false,
    scheduledFor: '',
    scheduledEnd: '',
    affectedServices: editData?.affectedServices || []
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      const result = await response.json()
      if (result.success) {
        setServices(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + 
        '-' + Date.now()

      const payload = {
        ...formData,
        slug,
        startTime: formData.isScheduled && formData.scheduledFor 
          ? new Date(formData.scheduledFor).toISOString()
          : new Date().toISOString()
      }

      const response = await fetch(
        editData ? `/api/admin/incidents/${editData.id}` : '/api/admin/incidents',
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
        alert(error.error || 'Failed to save incident')
      }
    } catch (error) {
      console.error('Failed to save incident:', error)
      alert('Failed to save incident')
    } finally {
      setLoading(false)
    }
  }

  const getStatusOptions = () => {
    return [
      { value: 'INVESTIGATING', label: 'Investigating' },
      { value: 'IDENTIFIED', label: 'Identified' },
      { value: 'MONITORING', label: 'Monitoring' },
      { value: 'RESOLVED', label: 'Resolved' }
    ]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editData ? 'Edit' : 'Create'} Incident
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Remove type selection - incidents only */}
            <div className="hidden">
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'MAINTENANCE', status: 'SCHEDULED', isScheduled: true })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.type === 'MAINTENANCE'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Wrench className={`w-6 h-6 mx-auto mb-1 ${
                      formData.type === 'MAINTENANCE' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className={`text-sm font-medium ${
                      formData.type === 'MAINTENANCE' ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      Maintenance
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={formData.type === 'MAINTENANCE' ? 'Database maintenance' : 'API service outage'}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide details about the incident or maintenance..."
              />
            </div>

            {/* Status and Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getStatusOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.type === 'INCIDENT' && (
                <div>
                  <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
                    Severity <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="severity"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              )}
            </div>

            {/* Impact */}
            <div>
              <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-1">
                Impact
              </label>
              <textarea
                id="impact"
                rows={2}
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the impact on users or services..."
              />
            </div>

            {/* Scheduled Dates (for maintenance) */}
            {formData.type === 'MAINTENANCE' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Start <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="scheduledFor"
                      required
                      value={formData.scheduledFor}
                      onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="scheduledEnd" className="block text-sm font-medium text-gray-700 mb-1">
                      Expected End
                    </label>
                    <input
                      type="datetime-local"
                      id="scheduledEnd"
                      value={formData.scheduledEnd}
                      onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Affected Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affected Services
              </label>
              <div className="border border-gray-300 rounded-md max-h-32 overflow-y-auto p-2">
                {services.map(service => (
                  <label key={service.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.affectedServices.includes(service.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ 
                            ...formData, 
                            affectedServices: [...formData.affectedServices, service.name]
                          })
                        } else {
                          setFormData({ 
                            ...formData, 
                            affectedServices: formData.affectedServices.filter((s: string) => s !== service.name)
                          })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{service.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (editData ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}