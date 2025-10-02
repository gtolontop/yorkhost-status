'use client'

import { useState } from 'react'
import { ServiceWithStats, ServiceWithEnhancedStatus } from '@/types'
import CollapsibleGroup from './CollapsibleGroup'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
  const [groupStates, setGroupStates] = useState<Map<string, boolean>>(new Map())
  const [allExpanded, setAllExpanded] = useState<boolean | null>(null)

  const toggleService = (serviceId: string) => {
    const newExpanded = new Set(expandedServices)
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId)
    } else {
      newExpanded.add(serviceId)
    }
    setExpandedServices(newExpanded)
  }

  const handleGroupToggle = (groupId: string, isExpanded: boolean) => {
    setGroupStates(prev => {
      const newStates = new Map(prev)
      newStates.set(groupId, isExpanded)
      return newStates
    })
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

  // Create group objects with sorted services
  const groupedData: ServiceGroup[] = groups.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description,
    color: group.color,
    services: (servicesByGroup.get(group.id) || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
    isExpandedByDefault: group.isExpandedByDefault
  }))

  // Add ungrouped services if any (sorted by order)
  const ungroupedServices = (servicesByGroup.get('ungrouped') || []).sort((a, b) => (a.order || 0) - (b.order || 0))
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

  const expandAll = () => {
    const newStates = new Map<string, boolean>()
    nonEmptyGroups.forEach(group => {
      newStates.set(group.id, true)
    })
    setGroupStates(newStates)
    setAllExpanded(true)
  }

  const collapseAll = () => {
    const newStates = new Map<string, boolean>()
    nonEmptyGroups.forEach(group => {
      newStates.set(group.id, false)
    })
    setGroupStates(newStates)
    setAllExpanded(false)
  }

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
      {/* Expand/Collapse All Controls */}
      {nonEmptyGroups.length > 1 && (
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={expandAll}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-yorkhost-darkCard border border-gray-300 dark:border-yorkhost-darkBorder rounded-lg hover:bg-gray-50 dark:hover:bg-yorkhost-dark/50 transition-colors"
            title="Expand all groups"
          >
            <ChevronDown size={16} />
            <span>Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-yorkhost-darkCard border border-gray-300 dark:border-yorkhost-darkBorder rounded-lg hover:bg-gray-50 dark:hover:bg-yorkhost-dark/50 transition-colors"
            title="Collapse all groups"
          >
            <ChevronUp size={16} />
            <span>Collapse All</span>
          </button>
        </div>
      )}

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
            forceExpanded={groupStates.get(group.id)}
            onToggle={(isExpanded) => handleGroupToggle(group.id, isExpanded)}
          />
        ))}
      </div>
    </div>
  )
}