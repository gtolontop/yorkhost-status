'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import '../admin.css'
import {
  Download,
  FileText,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  Clock,
  Server,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react'

interface Service {
  id: string
  name: string
}

export default function ReportsPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [exportType, setExportType] = useState<'uptime' | 'incidents' | 'services'>('uptime')
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedService, setSelectedService] = useState('')
  const [copiedBadge, setCopiedBadge] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      const result = await response.json()
      if (result.success || Array.isArray(result)) {
        setServices(result.success ? result.data : result)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    }
  }

  const handleExport = async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        format,
        type: exportType,
        startDate,
        endDate,
        ...(selectedService && exportType === 'uptime' && { serviceId: selectedService })
      })

      const response = await fetch(`/api/reports/export?${params}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportType}-report-${startDate}-to-${endDate}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const copyBadgeCode = (serviceId: string, type: 'status' | 'uptime') => {
    const baseUrl = window.location.origin
    const badgeUrl = `${baseUrl}/api/badges/${serviceId}?${type === 'uptime' ? 'uptime=true' : ''}`
    const markdown = `![Status](${badgeUrl})`

    navigator.clipboard.writeText(markdown)
    setCopiedBadge(`${serviceId}-${type}`)
    setTimeout(() => setCopiedBadge(''), 2000)
  }

  const getBadgePreviewUrl = (serviceId: string, type: 'status' | 'uptime') => {
    return `/api/badges/${serviceId}?${type === 'uptime' ? 'uptime=true' : ''}`
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">
              <FileText className="admin-title-icon" />
              Reports & Export
            </h1>
            <p className="admin-subtitle">Export data and generate status badges</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Section */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                <Download className="w-5 h-5" />
                Export Data
              </h2>
            </div>

            <div className="admin-card-content space-y-4">
              {/* Export Type */}
              <div>
                <label className="admin-label">Export Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setExportType('uptime')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      exportType === 'uptime'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Uptime
                  </button>
                  <button
                    onClick={() => setExportType('incidents')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      exportType === 'incidents'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Incidents
                  </button>
                  <button
                    onClick={() => setExportType('services')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      exportType === 'services'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Server className="w-4 h-4 inline mr-1" />
                    Services
                  </button>
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="admin-label">Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormat('csv')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      format === 'csv'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => setFormat('json')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      format === 'json'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="admin-label">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Service Filter (for uptime only) */}
              {exportType === 'uptime' && (
                <div>
                  <label className="admin-label">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Filter by Service (Optional)
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="admin-input"
                  >
                    <option value="">All Services</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={loading}
                className="admin-button-primary w-full"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export {format.toUpperCase()}
                  </>
                )}
              </button>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <BarChart3 className="w-4 h-4 inline mr-1" />
                {exportType === 'uptime' && 'Export uptime data grouped by date and service'}
                {exportType === 'incidents' && 'Export all incidents with duration and affected services'}
                {exportType === 'services' && 'Export service list with current status and uptime'}
              </div>
            </div>
          </div>

          {/* Status Badges Section */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                <CheckCircle className="w-5 h-5" />
                Status Badges
              </h2>
            </div>

            <div className="admin-card-content space-y-4">
              <p className="text-sm text-gray-600">
                Embed dynamic status badges in your documentation, README, or website
              </p>

              {/* Services List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>

                    {/* Status Badge */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={getBadgePreviewUrl(service.id, 'status')}
                          alt="Status Badge"
                          className="h-5"
                        />
                        <button
                          onClick={() => copyBadgeCode(service.id, 'status')}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {copiedBadge === `${service.id}-status` ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy Markdown
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Uptime Badge */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={getBadgePreviewUrl(service.id, 'uptime')}
                          alt="Uptime Badge"
                          className="h-5"
                        />
                        <button
                          onClick={() => copyBadgeCode(service.id, 'uptime')}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {copiedBadge === `${service.id}-uptime` ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy Markdown
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Documentation */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700">
                <strong>Usage:</strong>
                <br />
                Markdown: <code>![Status](badge-url)</code>
                <br />
                HTML: <code>&lt;img src="badge-url" /&gt;</code>
                <br />
                <a
                  href="/api/badges/docs"
                  target="_blank"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  Full Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
