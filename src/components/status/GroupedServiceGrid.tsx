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
        <CollapsibleGroup
          key={group.id}
          group={group}
          expandedServices={expandedServices}
          onToggleService={toggleService}
        />
      ))}
    </div>
  )
}