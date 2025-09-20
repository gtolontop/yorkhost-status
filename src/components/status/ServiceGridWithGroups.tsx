'use client'

import { useState } from 'react'
import { ServiceWithStats } from '@/types'
import ServiceCard from './ServiceCard'
import { Plus, GripVertical } from 'lucide-react'

interface ServiceGroup {
  id: string
  name: string
  serviceIds: string[]
}

interface ServiceGridWithGroupsProps {
  services: ServiceWithStats[]
}

export default function ServiceGridWithGroups({ services }: ServiceGridWithGroupsProps) {
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())
  const [groups, setGroups] = useState<ServiceGroup[]>([])
  const [draggedService, setDraggedService] = useState<string | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const toggleService = (serviceId: string) => {
    const newExpanded = new Set(expandedServices)
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId)
    } else {
      newExpanded.add(serviceId)
    }
    setExpandedServices(newExpanded)
  }

  // Get services that are not in any group
  const ungroupedServices = services.filter(service => 
    !groups.some(group => group.serviceIds.includes(service.id))
  )

  // Get services for a specific group
  const getGroupServices = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return []
    return services.filter(service => group.serviceIds.includes(service.id))
  }

  // Handle drag start
  const handleDragStart = (serviceId: string) => {
    setDraggedService(serviceId)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle drop on group
  const handleDropOnGroup = (groupId: string) => {
    if (!draggedService) return

    setGroups(prevGroups => {
      // Remove service from all groups first
      const updatedGroups = prevGroups.map(group => ({
        ...group,
        serviceIds: group.serviceIds.filter(id => id !== draggedService)
      }))

      // Add service to the target group
      return updatedGroups.map(group => 
        group.id === groupId 
          ? { ...group, serviceIds: [...group.serviceIds, draggedService] }
          : group
      )
    })

    setDraggedService(null)
    setDragOverGroup(null)
  }

  // Handle drop on ungrouped area
  const handleDropOnUngrouped = () => {
    if (!draggedService) return

    // Remove service from all groups
    setGroups(prevGroups => 
      prevGroups.map(group => ({
        ...group,
        serviceIds: group.serviceIds.filter(id => id !== draggedService)
      }))
    )

    setDraggedService(null)
    setDragOverGroup(null)
  }

  // Create new group
  const createGroup = () => {
    if (!newGroupName.trim()) return

    const newGroup: ServiceGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      serviceIds: []
    }

    setGroups([...groups, newGroup])
    setNewGroupName('')
    setIsCreatingGroup(false)
  }

  // Delete group
  const deleteGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Create Group Button */}
      <div className="flex justify-end">
        {isCreatingGroup ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createGroup()}
              placeholder="Group name..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <button
              onClick={createGroup}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreatingGroup(false)
                setNewGroupName('')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingGroup(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
          >
            <Plus size={20} />
            Create Group
          </button>
        )}
      </div>

      {/* Groups */}
      {groups.map(group => (
        <div
          key={group.id}
          className={`border-2 rounded-lg p-4 transition-colors ${
            dragOverGroup === group.id ? 'border-primary bg-primary/5' : 'border-gray-200'
          }`}
          onDragOver={handleDragOver}
          onDragEnter={() => setDragOverGroup(group.id)}
          onDragLeave={() => setDragOverGroup(null)}
          onDrop={() => handleDropOnGroup(group.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
            <button
              onClick={() => deleteGroup(group.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete Group
            </button>
          </div>
          
          <div className="space-y-3">
            {getGroupServices(group.id).length === 0 ? (
              <p className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                Drag services here
              </p>
            ) : (
              getGroupServices(group.id).map(service => (
                <div
                  key={service.id}
                  draggable
                  onDragStart={() => handleDragStart(service.id)}
                  className="cursor-move"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="text-gray-400" size={20} />
                    <div className="flex-1">
                      <ServiceCard
                        service={service}
                        isExpanded={expandedServices.has(service.id)}
                        onToggle={() => toggleService(service.id)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      {/* Ungrouped Services */}
      {ungroupedServices.length > 0 && (
        <div
          className={`border-2 rounded-lg p-4 transition-colors ${
            dragOverGroup === 'ungrouped' ? 'border-primary bg-primary/5' : 'border-gray-200'
          }`}
          onDragOver={handleDragOver}
          onDragEnter={() => setDragOverGroup('ungrouped')}
          onDragLeave={() => setDragOverGroup(null)}
          onDrop={handleDropOnUngrouped}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ungrouped Services
          </h3>
          <div className="space-y-3">
            {ungroupedServices.map(service => (
              <div
                key={service.id}
                draggable
                onDragStart={() => handleDragStart(service.id)}
                className="cursor-move"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="text-gray-400" size={20} />
                  <div className="flex-1">
                    <ServiceCard
                      service={service}
                      isExpanded={expandedServices.has(service.id)}
                      onToggle={() => toggleService(service.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}