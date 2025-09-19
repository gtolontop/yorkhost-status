'use client'

import { useState } from 'react'
import { ServiceWithStats } from '@/types'
import { groupBy } from '@/lib/utils'
import ServiceCard from './ServiceCard'
import styles from './ServiceGrid.module.scss'

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

  // Group services by machine category
  const servicesByCategory = groupBy(services, (service) => service.machine?.category || 'uncategorized')
  const categories = Object.keys(servicesByCategory)

  if (services.length === 0) {
    return (
      <div className={styles.empty}>
        <h2>No Services Found</h2>
        <p>No monitoring services are currently configured.</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      <div className={styles.header}>
        <h2 className={styles.title}>Service Status</h2>
        <p className={styles.subtitle}>
          Real-time monitoring of all Yorkhost services
        </p>
      </div>

      {categories.map((category) => {
        const categoryServices = servicesByCategory[category]
        const machine = categoryServices[0]?.machine

        return (
          <div key={category} className={styles.category}>
            <div className={styles.categoryHeader}>
              <h3 className={styles.categoryTitle}>
                {machine?.name || 'Unknown Machine'}
              </h3>
              {machine?.description && (
                <p className={styles.categoryDescription}>
                  {machine.description}
                </p>
              )}
              <div className={styles.categoryMeta}>
                <span className={styles.categoryLocation}>
                  📍 {machine?.location || 'Unknown'}
                </span>
                <span className={styles.categoryServices}>
                  {categoryServices.length} service{categoryServices.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className={styles.services}>
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