'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Incident {
  id: string
  title: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED' | 'SCHEDULED'
  isScheduled: boolean
  startTime: string
  endTime?: string
  eta?: string
  serviceId?: string
  machineId?: string
  tags: string[]
  creator: {
    id: string
    username: string
    avatar?: string
  }
  service?: {
    id: string
    name: string
  }
}

interface Service {
  id: string
  name: string
}

interface EditIncidentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  incident: Incident
}

export default function EditIncidentModal({ isOpen, onClose, onSuccess, incident }: EditIncidentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    status: 'INVESTIGATING' as 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED' | 'SCHEDULED',
    serviceId: ''
  })
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && incident) {
      setFormData({
        title: incident.title,
        description: incident.description || '',
        severity: incident.severity,
        status: incident.status,
        serviceId: incident.serviceId || ''
      })
      fetchServices()
    }
  }, [isOpen, incident])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services')
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
    setError('')

    try {
      const response = await fetch(`/api/admin/incidents/${incident.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          serviceId: formData.serviceId || null
        })
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Failed to update incident')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const severityOptions = [
    { value: 'LOW', label: 'Low', color: '#10b981' },
    { value: 'MEDIUM', label: 'Medium', color: '#f59e0b' },
    { value: 'HIGH', label: 'High', color: '#f97316' },
    { value: 'CRITICAL', label: 'Critical', color: '#ef4444' }
  ]

  const statusOptions = [
    { value: 'INVESTIGATING', label: 'Investigating' },
    { value: 'IDENTIFIED', label: 'Identified' },
    { value: 'MONITORING', label: 'Monitoring' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'SCHEDULED', label: 'Scheduled' }
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            Edit Incident
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Incident Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Severity *
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            >
              {severityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Affected Service
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            >
              <option value="">No specific service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                background: loading ? '#9ca3af' : '#000000',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}