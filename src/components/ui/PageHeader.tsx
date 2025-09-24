'use client'

import { ReactNode } from 'react'

interface PageHeaderProps {
  icon: ReactNode
  title: string
  subtitle: string
  status?: 'operational' | 'degraded' | 'outage' | 'maintenance' | undefined
  lastUpdate?: Date
}

export default function PageHeader({ icon, title, subtitle, status, lastUpdate }: PageHeaderProps) {
  const getStatusColor = () => {
    if (!status) return 'var(--color-primary)'
    
    switch (status) {
      case 'operational':
        return 'var(--color-success)'
      case 'degraded':
        return 'var(--color-warning)'
      case 'outage':
        return 'var(--color-danger)'
      case 'maintenance':
        return 'var(--color-primary)'
      default:
        return 'var(--color-primary)'
    }
  }

  return (
    <div className="text-center px-5 py-8 sm:py-12 md:py-16 max-w-3xl mx-auto">
      <div className="mb-3 sm:mb-6 flex justify-center">
        <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24" style={{ color: getStatusColor() }}>
          {icon}
        </div>
      </div>
      
      <h1
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white break-words"
        style={{
          lineHeight: '1.2'
        }}
      >
        {title}
      </h1>

      <p
        className="text-sm sm:text-base md:text-lg break-words"
        style={{
          color: 'var(--text-secondary)',
          lineHeight: '1.6'
        }}
      >
        {lastUpdate ? `Last updated: ${new Date(lastUpdate).toLocaleString()}` : subtitle}
      </p>
    </div>
  )
}