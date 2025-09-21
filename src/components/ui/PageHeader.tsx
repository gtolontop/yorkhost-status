'use client'

import { CheckCircle, AlertTriangle, XCircle, Wrench } from 'lucide-react'

interface PageHeaderProps {
  icon?: React.ReactNode
  title: string
  subtitle: string
  status?: 'operational' | 'degraded' | 'outage' | 'maintenance' | undefined
}

export default function PageHeader({ title, subtitle, status }: PageHeaderProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'operational':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200'
        }
      case 'degraded':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200'
        }
      case 'outage':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200'
        }
      case 'maintenance':
        return {
          icon: Wrench,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200'
        }
      default:
        return {
          icon: CheckCircle,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className="mb-8">
      <div className={`rounded-lg border p-6 ${config.bg} ${config.border}`}>
        <div className="flex items-center gap-4">
          <Icon className={`${config.color} shrink-0`} size={32} />
          <div>
            <h1 className={`text-2xl font-bold ${config.color} mb-1`}>
              {title}
            </h1>
            <p className="text-gray-600 text-sm">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}