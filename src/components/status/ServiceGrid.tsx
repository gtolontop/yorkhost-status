'use client'

import { useState } from 'react'
import { ServiceWithStats } from '@/types'
import ServiceCard from './ServiceCard'

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

  if (safeServices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <h2>No Services Found</h2>
        <p>No monitoring services are currently configured.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {safeServices.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          isExpanded={expandedServices.has(service.id)}
          onToggle={() => toggleService(service.id)}
        />
      ))}
    </div>
  )
}