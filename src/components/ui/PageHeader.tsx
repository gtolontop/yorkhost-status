'use client'

import { ReactNode } from 'react'

interface PageHeaderProps {
  icon: ReactNode
  title: string
  subtitle: string
  status?: 'operational' | 'degraded' | 'outage'
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
      default:
        return 'var(--color-primary)'
    }
  }

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '80px 20px 60px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ color: getStatusColor() }}>
          {icon}
        </div>
      </div>
      
      <h1 style={{
        fontSize: '3rem',
        fontWeight: '700',
        color: status ? getStatusColor() : 'var(--text-primary)',
        marginBottom: '16px',
        lineHeight: '1.2'
      }}>
        {title}
      </h1>
      
      <p style={{
        fontSize: '1.25rem',
        color: 'var(--text-secondary)',
        marginBottom: '48px',
        lineHeight: '1.6'
      }}>
        {subtitle}
      </p>
    </div>
  )
}