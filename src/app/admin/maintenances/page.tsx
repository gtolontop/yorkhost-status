'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import CreateMaintenanceModal from '@/components/admin/CreateMaintenanceModal'
import EditMaintenanceModal from '@/components/admin/EditMaintenanceModal'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Calendar,
  Wrench,
  Clock,
  Edit,
  Trash2,
  Eye,
  Plus,
  CheckCircle,
  AlertCircle,
  Server,
  ExternalLink,
  Play,
  Pause,
  Square,
  Filter,
  Search,
  MoreHorizontal,
  Settings,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'

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
  affectedServicesWithNames?: Array<{
    id: string
    name: string
  }>
  creator?: { username: string }
  updates?: Array<{
    id: string
    message: string
    timestamp: string
    authorName?: string
  }>
}

export default function MaintenancesPage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [filteredMaintenances, setFilteredMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchMaintenances()
  }, [])

  // Filter maintenances based on search and status
  useEffect(() => {
    let filtered = maintenances

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(maintenance =>
        maintenance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maintenance.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(maintenance => maintenance.status === statusFilter)
    }

    setFilteredMaintenances(filtered)
  }, [maintenances, searchTerm, statusFilter])

  const fetchMaintenances = async () => {
    try {
      const response = await fetch('/api/admin/maintenances')
      const data = await response.json()
      if (data.success) {
        setMaintenances(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch maintenances:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickStatusChange = async (maintenanceId: string, newStatus: string) => {
    try {
      const maintenance = maintenances.find(m => m.id === maintenanceId)
      if (!maintenance) return

      const response = await fetch(`/api/admin/maintenances/${maintenanceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: maintenance.title,
          description: maintenance.description,
          status: newStatus,
          scheduledFor: maintenance.scheduledFor,
          scheduledEnd: maintenance.scheduledEnd,
          affectedServices: maintenance.affectedServices
        })
      })

      if (response.ok) {
        // Add status update
        await fetch(`/api/admin/maintenances/${maintenanceId}/updates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Status changed to ${newStatus.replace('_', ' ').toLowerCase()}`,
            status: newStatus
          })
        })

        fetchMaintenances()
      } else {
        alert('Failed to update maintenance status')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update maintenance status')
    }
  }

  const handleEdit = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    setIsEditModalOpen(false)
    setEditingMaintenance(null)
    fetchMaintenances()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance?')) return

    try {
      const response = await fetch(`/api/admin/maintenances/${id}`, {
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
    fetchMaintenances()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="w-4 h-4" />
      case 'IN_PROGRESS':
        return <Wrench className="w-4 h-4 animate-pulse" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'text-blue-600 dark:text-blue-400'
      case 'MEDIUM':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'HIGH':
        return 'text-orange-600 dark:text-orange-400'
      case 'CRITICAL':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Maintenance Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Schedule and manage maintenance windows ({filteredMaintenances.length} total)
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule Maintenance
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-yorkhost-darkCard rounded-lg border border-gray-200 dark:border-yorkhost-darkBorder p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search maintenances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Scheduled', status: 'SCHEDULED', icon: Calendar, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'In Progress', status: 'IN_PROGRESS', icon: Wrench, color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
            { label: 'Completed', status: 'COMPLETED', icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Total', status: 'all', icon: Settings, color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-900/20' }
          ].map((stat) => (
            <div key={stat.status} className="bg-white dark:bg-yorkhost-darkCard p-4 rounded-lg border border-gray-200 dark:border-yorkhost-darkBorder">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.status === 'all'
                      ? maintenances.length
                      : maintenances.filter(m => m.status === stat.status).length
                    }
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Maintenances List */}
        <div className="bg-white dark:bg-yorkhost-darkCard rounded-lg shadow-sm border border-gray-200 dark:border-yorkhost-darkBorder">
          <div className="p-6 border-b border-gray-200 dark:border-yorkhost-darkBorder">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Maintenance Windows
            </h2>
          </div>

          {filteredMaintenances.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No maintenances found matching your filters' : 'No maintenance windows scheduled'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Schedule First Maintenance
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-yorkhost-darkBorder">
              {filteredMaintenances.map((maintenance) => (
                <div key={maintenance.id} className="p-6 hover:bg-gray-50 dark:hover:bg-yorkhost-darkBg/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {maintenance.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(maintenance.status)}`}>
                          {getStatusIcon(maintenance.status)}
                          <span className="ml-1">{maintenance.status.replace('_', ' ')}</span>
                        </span>
                        <span className={`text-xs font-medium ${getSeverityColor(maintenance.severity)}`}>
                          {maintenance.severity}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {maintenance.description}
                      </p>

                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {maintenance.scheduledFor && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Scheduled: {format(new Date(maintenance.scheduledFor), 'MMM d, yyyy HH:mm')}</span>
                          </div>
                        )}
                        {maintenance.scheduledEnd && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Until: {format(new Date(maintenance.scheduledEnd), 'MMM d, yyyy HH:mm')}</span>
                          </div>
                        )}
                        {maintenance.affectedServicesWithNames && maintenance.affectedServicesWithNames.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Server className="w-3 h-3" />
                            <span>{maintenance.affectedServicesWithNames.length} service(s) affected</span>
                          </div>
                        )}
                        {maintenance.creator && (
                          <div className="flex items-center gap-1">
                            <span>by {maintenance.creator.username}</span>
                          </div>
                        )}
                      </div>

                      {/* Affected Services */}
                      {maintenance.affectedServicesWithNames && maintenance.affectedServicesWithNames.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1">
                            {maintenance.affectedServicesWithNames.slice(0, 5).map((service) => (
                              <span key={service.id} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                                {service.name}
                              </span>
                            ))}
                            {maintenance.affectedServicesWithNames.length > 5 && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                +{maintenance.affectedServicesWithNames.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {/* Quick Status Change */}
                      {maintenance.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleQuickStatusChange(maintenance.id, 'IN_PROGRESS')}
                          className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors"
                          title="Start maintenance"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </button>
                      )}

                      {maintenance.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleQuickStatusChange(maintenance.id, 'COMPLETED')}
                          className="inline-flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                          title="Complete maintenance"
                        >
                          <Square className="w-3 h-3 mr-1" />
                          Complete
                        </button>
                      )}

                      {/* Action Buttons */}
                      <Link
                        href={`/admin/maintenances/${maintenance.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => window.open(`/maintenance/${maintenance.id}`, '_blank')}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="View public page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEdit(maintenance)}
                        className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                        title="Edit maintenance"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(maintenance.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete maintenance"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateMaintenanceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        <EditMaintenanceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          maintenance={editingMaintenance}
        />
      </div>
    </AdminLayout>
  )
}