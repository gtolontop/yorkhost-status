'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Monitor {
  id: string
  name: string
  type: string
  target: string
  port?: number
  timeout?: number
  interval?: number
  retryAttempts?: number
  retryInterval?: number
  expectedStatus?: number
  expectedBody?: string
  followRedirects?: boolean
  sslCheck?: boolean
  isActive: boolean
  service?: {
    id: string
    name: string
  }
}

interface EditMonitorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  monitor: Monitor
}

export default function EditMonitorModal({ isOpen, onClose, onSuccess, monitor }: EditMonitorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'HTTP',
    target: '',
    port: '',
    timeout: 10,
    interval: 60,
    retryAttempts: 3,
    retryInterval: 5,
    expectedStatus: '',
    expectedBody: '',
    followRedirects: true,
    sslCheck: true,
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && monitor) {
      setFormData({
        name: monitor.name,
        type: monitor.type,
        target: monitor.target,
        port: monitor.port?.toString() || '',
        timeout: monitor.timeout || 10,
        interval: monitor.interval || 60,
        retryAttempts: monitor.retryAttempts || 3,
        retryInterval: monitor.retryInterval || 5,
        expectedStatus: monitor.expectedStatus?.toString() || '',
        expectedBody: monitor.expectedBody || '',
        followRedirects: monitor.followRedirects ?? true,
        sslCheck: monitor.sslCheck ?? true,
        isActive: monitor.isActive
      })
    }
  }, [isOpen, monitor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/monitors/${monitor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          port: formData.port ? parseInt(formData.port) : null,
          expectedStatus: formData.expectedStatus ? parseInt(formData.expectedStatus) : null
        })
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Failed to update monitor')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const monitorTypes = [
    { value: 'HTTP', label: 'HTTP/HTTPS' },
    { value: 'TCP', label: 'TCP Port' },
    { value: 'ICMP', label: 'Ping (ICMP)' },
    { value: 'DNS', label: 'DNS Query' }
  ]

  const intervalOptions = [
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' }
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
            Edit Monitor
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
              Monitor Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              Monitoring Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            >
              {monitorTypes.map((option) => (
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
              Target *
            </label>
            <input
              type="text"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              placeholder={
                formData.type === 'HTTP' ? 'https://example.com' :
                formData.type === 'TCP' ? '192.168.1.100' :
                formData.type === 'ICMP' ? '8.8.8.8' :
                'example.com'
              }
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

          {(formData.type === 'TCP' || formData.type === 'HTTP') && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                Port {formData.type === 'TCP' ? '*' : '(optional)'}
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                placeholder={formData.type === 'HTTP' ? '80 or 443' : '22, 3306, 5432...'}
                min="1"
                max="65535"
                required={formData.type === 'TCP'}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Timeout (seconds)
            </label>
            <input
              type="number"
              value={formData.timeout}
              onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) || 10 })}
              min="1"
              max="300"
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
              Check Interval
            </label>
            <select
              value={formData.interval}
              onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            >
              {intervalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                Retry Attempts
              </label>
              <input
                type="number"
                value={formData.retryAttempts}
                onChange={(e) => setFormData({ ...formData, retryAttempts: parseInt(e.target.value) || 3 })}
                min="0"
                max="10"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                Retry Interval (seconds)
              </label>
              <input
                type="number"
                value={formData.retryInterval}
                onChange={(e) => setFormData({ ...formData, retryInterval: parseInt(e.target.value) || 5 })}
                min="1"
                max="60"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {(formData.type === 'HTTP' || formData.type === 'HTTPS') && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  Expected HTTP Status (optional)
                </label>
                <input
                  type="number"
                  value={formData.expectedStatus}
                  onChange={(e) => setFormData({ ...formData, expectedStatus: e.target.value })}
                  placeholder="200, 301, etc."
                  min="100"
                  max="599"
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
                  Expected Response Body (optional)
                </label>
                <input
                  type="text"
                  value={formData.expectedBody}
                  onChange={(e) => setFormData({ ...formData, expectedBody: e.target.value })}
                  placeholder="Text to search in response"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.followRedirects}
                    onChange={(e) => setFormData({ ...formData, followRedirects: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Follow Redirects
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.sslCheck}
                    onChange={(e) => setFormData({ ...formData, sslCheck: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Check SSL Certificate
                </label>
              </div>
            </>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ marginRight: '0.5rem' }}
              />
              Active monitor
            </label>
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