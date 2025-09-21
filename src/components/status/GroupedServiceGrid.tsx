'use client'

import { useState } from 'react'
import { ServiceWithStats } from '@/types'
import CollapsibleGroup from './CollapsibleGroup'

interface ServiceGroup {
  id: string
  name: string
  description?: string
  color: string
  services: ServiceWithStats[]
}

interface GroupedServiceGridProps {
  services: ServiceWithStats[]
  groups: any[]
}

export default function GroupedServiceGrid({ services, groups }: GroupedServiceGridProps) {
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleService = (serviceId: string) => {
    const newExpanded = new Set(expandedServices)
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId)
    } else {
      newExpanded.add(serviceId)
    }
    setExpandedServices(newExpanded)
  }

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId)
    } else {
      newCollapsed.add(groupId)
    }
    setCollapsedGroups(newCollapsed)
  }

  // Group services by machineId
  const servicesByGroup = new Map<string, ServiceWithStats[]>()
  
  services.forEach(service => {
    const groupId = service.machineId || 'ungrouped'
    if (!servicesByGroup.has(groupId)) {
      servicesByGroup.set(groupId, [])
    }
    servicesByGroup.get(groupId)!.push(service)
  })

  // Create group objects
  const groupedData: ServiceGroup[] = groups.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description,
    color: group.color,
    services: servicesByGroup.get(group.id) || []
  }))

  // Add ungrouped services if any
  const ungroupedServices = servicesByGroup.get('ungrouped') || []
  if (ungroupedServices.length > 0) {
    groupedData.push({
      id: 'ungrouped',
      name: 'Other Services',
      color: '#6b7280',
      services: ungroupedServices
    })
  }

  // Filter out empty groups
  const nonEmptyGroups = groupedData.filter(group => group.services.length > 0)

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <h2>No Services Found</h2>
        <p>No monitoring services are currently configured.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {nonEmptyGroups.map((group) => (
        <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div 
            className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
            onClick={() => toggleGroup(group.id)}
            style={{ borderLeft: `4px solid ${group.color}` }}
          >
            <div className="flex items-center gap-3">
              <div className="text-gray-400">
                {collapsedGroups.has(group.id) ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {group.name}
                  <span className="text-sm font-normal text-gray-500">
                    ({group.services.length} service{group.services.length > 1 ? 's' : ''})
                  </span>
                </h3>
                {group.description && (
                  <p className="text-sm text-gray-500">{group.description}</p>
                )}
              </div>
            </div>
            
            {/* Group status summary */}
            <div className="flex items-center gap-4 text-sm">
              {group.services.filter(s => s.currentStatus === 'operational').length > 0 && (
                <span className="text-green-600 font-medium">
                  {group.services.filter(s => s.currentStatus === 'operational').length} operational
                </span>
              )}
              {group.services.filter(s => s.currentStatus === 'degraded').length > 0 && (
                <span className="text-yellow-600 font-medium">
                  {group.services.filter(s => s.currentStatus === 'degraded').length} degraded
                </span>
              )}
              {group.services.filter(s => s.currentStatus === 'outage').length > 0 && (
                <span className="text-red-600 font-medium">
                  {group.services.filter(s => s.currentStatus === 'outage').length} down
                </span>
              )}
            </div>
          </div>
          
          {!collapsedGroups.has(group.id) && (
            <div className="border-t border-gray-200">
              <div className="p-4 space-y-3">
                {group.services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isExpanded={expandedServices.has(service.id)}
                    onToggle={() => toggleService(service.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}