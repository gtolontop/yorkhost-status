'use client'

import { useState } from 'react'
import { ServiceWithStats, ServiceWithEnhancedStatus } from '@/types'
import CollapsibleGroup from './CollapsibleGroup'

interface ServiceGroup {
  id: string
  name: string
  description?: string
  color: string
  services: ServiceWithEnhancedStatus[]
  isExpandedByDefault?: boolean
}

interface GroupedServiceGridProps {
  services: ServiceWithStats[] | ServiceWithEnhancedStatus[]
  groups: any[]
}

export default function GroupedServiceGrid({ services, groups }: GroupedServiceGridProps) {
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())

  const toggleService = (serviceId: string) => {
    const newExpanded = new Set(expandedServices)
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId)
    } else {
      newExpanded.add(serviceId)
    }
    setExpandedServices(newExpanded)
  }

  // Group services by machineId
  const servicesByGroup = new Map<string, ServiceWithEnhancedStatus[]>()
  
  services.forEach(service => {
    const groupId = service.machineId || 'ungrouped'
    if (!servicesByGroup.has(groupId)) {
      servicesByGroup.set(groupId, [])
    }
    servicesByGroup.get(groupId)!.push(service as ServiceWithEnhancedStatus)
  })

  // Create group objects
  const groupedData: ServiceGroup[] = groups.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description,
    color: group.color,
    services: servicesByGroup.get(group.id) || [],
    isExpandedByDefault: group.isExpandedByDefault
  }))

  // Add ungrouped services if any
  const ungroupedServices = servicesByGroup.get('ungrouped') || []
  if (ungroupedServices.length > 0) {
    groupedData.push({
      id: 'ungrouped',
      name: 'Other Services',
      color: '#6b7280',
      services: ungroupedServices,
      isExpandedByDefault: true
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
    <div className="max-w-6xl mx-auto">
      <div className="dark:bg-yorkhost-darkCard rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-yorkhost-darkBorder">
        {nonEmptyGroups.map((group, index) => (
          <CollapsibleGroup
            key={group.id}
            group={group}
            expandedServices={expandedServices}
            onToggleService={toggleService}
            isFirst={index === 0}
            isLast={index === nonEmptyGroups.length - 1}
            isExpandedByDefault={group.isExpandedByDefault}
          />
        ))}
      </div>
    </div>
  )
}