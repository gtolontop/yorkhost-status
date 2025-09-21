'use client'

import { useState, useEffect } from 'react'
import { ServiceWithStats, UptimeData } from '@/types'
import { getStatusColor, formatResponseTime, formatRelativeTime } from '@/lib/utils'
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'
import UptimeChart from '@/components/charts/UptimeChart'
import { useUptimeHistory } from '@/contexts/UptimeHistoryContext'

interface ServiceCardProps {
  service: ServiceWithStats
  isExpanded: boolean
  onToggle: () => void
}

export default function ServiceCard({ service, isExpanded, onToggle }: ServiceCardProps) {
  const historyContext = useUptimeHistory(service.id)
  const statusColor = getStatusColor(service.uptimePercent24h)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Use context data instead of local state
  const uptimeHistory = 'serviceHistory' in historyContext ? historyContext.serviceHistory : []
  const loadingHistory = historyContext.loading

  const getStatusIcon = () => {
    switch (service.currentStatus) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'unknown':
        return <HelpCircle className="w-5 h-5 text-gray-400" />
      default:
        return <HelpCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (service.currentStatus) {
      case 'operational':
        return 'Operational'
      case 'degraded':
        return 'Degraded Performance'
      case 'outage':
        return 'Major Outage'
      case 'unknown':
        return 'No Data'
      default:
        return 'No Data'
    }
  }

  const getStatusTextColor = () => {
    switch (service.currentStatus) {
      case 'operational':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'outage':
        return 'text-red-600'
      case 'unknown':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  // Generate uptime bars based on real data (30 on mobile, 90 on desktop)
  const generateUptimeBars = () => {
    const bars = []
    const today = new Date()
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const daysToShow = isMobile ? 30 : 90
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Find actual uptime data for this date if available
      const dayData = uptimeHistory.find((d: any) => {
        const dataDate = new Date(d.date)
        return dataDate.toDateString() === date.toDateString()
      })
      
      // Use real data if available
      const uptime = dayData ? (dayData.uptime !== null ? dayData.uptime : -1) : -1 // -1 indicates no data
      const incidents = dayData?.incidents || []
      
      const getBarColor = () => {
        if (!dayData || uptime === -1) return 'bg-gray-300' // No data = gray
        if (uptime >= 99.9) return 'bg-green-500'
        if (uptime >= 90) return 'bg-yellow-500'
        return 'bg-red-500'
      }

      const getStatus = () => {
        if (incidents.length > 0) {
          return `${incidents.length} incident${incidents.length > 1 ? 's' : ''}`
        }
        if (uptime >= 99.9) return 'Fully operational'
        if (uptime >= 90) return 'Minor issues'
        return 'Major outage'
      }
      
      bars.push(
        <div
          key={i}
          className={`h-8 flex-1 ${getBarColor()} hover:opacity-80 transition-opacity cursor-pointer relative group rounded-sm`}
          title={`${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${uptime === -1 ? 'No data' : `${uptime.toFixed(1)}% uptime - ${getStatus()}`}`}
        >
          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            <div className="font-medium">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div>{uptime === -1 ? 'No data' : `${uptime.toFixed(1)}% - ${getStatus()}`}</div>
            {incidents.length > 0 && (
              <div className="text-xs text-gray-300 mt-0.5">
                {incidents.map((inc: any) => inc.title).join(', ')}
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )
    }
    
    return bars
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div 
        className="p-6 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          {/* Left Side: Icon + Service Name + Status */}
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{service.name}</h3>
              <p className={`text-sm ${getStatusTextColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>

          {/* Right Side: Uptime % */}
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {service.currentStatus === 'unknown' ? '--' : `${service.uptimePercent24h.toFixed(2)}%`}
            </div>
            <p className="text-xs text-gray-500 uppercase">Uptime</p>
          </div>
        </div>

        {/* Uptime Bars */}
        <div className="mt-6">
          <div className="flex items-center h-8 gap-0.5">
            {generateUptimeBars()}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span className="md:hidden">30 days ago</span>
            <span className="hidden md:block">90 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-6 bg-gray-50">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {service.uptimePercent24h.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 uppercase">24h Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {service.uptimePercent7d.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 uppercase">7d Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {service.uptimePercent30d.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 uppercase">30d Uptime</p>
            </div>
            {service.averageResponseTime && (
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatResponseTime(service.averageResponseTime)}
                </p>
                <p className="text-xs text-gray-500 uppercase">Response Time</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {service.lastCheck ? formatRelativeTime(service.lastCheck) : 'Never'}
              </p>
              <p className="text-xs text-gray-500 uppercase">Last Check</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}