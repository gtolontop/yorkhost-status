'use client'

import { ReactNode } from 'react'

interface PageHeaderProps {
  icon: ReactNode
  title: string
  subtitle: string
  status?: 'operational' | 'degraded' | 'outage' | 'maintenance' | undefined
}

export default function PageHeader({ icon, title, subtitle, status }: PageHeaderProps) {
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
    <div className="text-center px-5 py-12 sm:py-16 md:py-20 max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-8 flex justify-center">
        <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24" style={{ color: getStatusColor() }}>
          {icon}
        </div>
      </div>
      
      <h1 
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 whitespace-nowrap text-white"
        style={{
          lineHeight: '1.2'
        }}
      >
        {title}
      </h1>
      
      <p 
        className="text-base sm:text-lg md:text-xl mb-2"
        style={{
          color: 'var(--text-secondary)',
          lineHeight: '1.6'
        }}
      >
        {subtitle}
      </p>
    </div>
  )
}