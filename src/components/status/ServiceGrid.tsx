'use client'

import { useState } from 'react'
import { ServiceWithStats } from '@/types'
import { groupBy } from '@/lib/utils'
import ServiceCard from './ServiceCard'
// import styles from './ServiceGrid.module.scss' // Temporarily disabled for Tailwind migration

interface ServiceGridProps {
  services: ServiceWithStats[]
}

export default function ServiceGrid({ services }: ServiceGridProps) {
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

  // Ensure services is an array
  const safeServices = Array.isArray(services) ? services : []

  // Group services by machine category
  const servicesByCategory = groupBy(safeServices, (service) => service.machine?.category || 'uncategorized')
  const categories = Object.keys(servicesByCategory)

  if (safeServices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <h2>No Services Found</h2>
        <p>No monitoring services are currently configured.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Status</h2>
        <p className="text-gray-600">
          Real-time monitoring of all Yorkhost services
        </p>
      </div>

      {categories.map((category) => {
        const categoryServices = servicesByCategory[category]
        const machine = categoryServices[0]?.machine

        return (
          <div key={category} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {machine?.name || 'Unknown Machine'}
              </h3>
              {machine?.description && (
                <p className="text-gray-600 text-sm mb-3">
                  {machine.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  📍 {machine?.location || 'Unknown'}
                </span>
                <span>
                  {categoryServices.length} service{categoryServices.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {categoryServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isExpanded={expandedServices.has(service.id)}
                  onToggle={() => toggleService(service.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}