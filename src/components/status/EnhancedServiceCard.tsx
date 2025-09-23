'use client'

import { useState, useEffect } from 'react'
import { ServiceWithEnhancedStatus, UptimeData } from '@/types'
import { formatResponseTime, formatRelativeTime } from '@/lib/utils'
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, HelpCircle, AlertCircle, Wrench, Info } from 'lucide-react'
import { useUptimeHistory } from '@/contexts/UptimeHistoryContext'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface EnhancedServiceCardProps {
  service: ServiceWithEnhancedStatus
  isExpanded: boolean
  onToggle: () => void
}

export default function EnhancedServiceCard({ service, isExpanded, onToggle }: EnhancedServiceCardProps) {
  const historyContext = useUptimeHistory(service.id)
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
    switch (service.enhancedStatus) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'outage-with-incident':
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      case 'maintenance':
        return <Wrench className="w-5 h-5 text-blue-600" />
      default:
        return <HelpCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (service.enhancedStatus) {
      case 'operational':
        return 'Operational'
      case 'degraded':
        return 'Degraded Performance'
      case 'outage':
        return 'Major Outage'
      case 'outage-with-incident':
        return 'Down - Incident Active'
      case 'maintenance':
        return 'Under Maintenance'
      default:
        return 'No Data'
    }
  }

  const getStatusTextColor = () => {
    switch (service.enhancedStatus) {
      case 'operational':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'outage':
        return 'text-red-600'
      case 'outage-with-incident':
        return 'text-orange-600'
      case 'maintenance':
        return 'text-blue-600'
      default:
        return 'text-gray-400'
    }
  }

  const getCardBorderClass = () => {
    switch (service.enhancedStatus) {
      case 'outage':
        return 'border-red-300 hover:border-red-400'
      case 'outage-with-incident':
        return 'border-orange-300 hover:border-orange-400'
      case 'maintenance':
        return 'border-blue-300 hover:border-blue-400'
      default:
        return 'border-gray-200 hover:border-gray-300'
    }
  }

  // Generate uptime bars based on real data (30 on mobile, 90 on desktop)
  const generateUptimeBars = () => {
    const bars = []
    const today = new Date()
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
    <div className={`transition-all`}>
      {/* Card Header */}
      <div 
        className="cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between mb-3">
          {/* Left Side: Icon + Service Name + Status */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex-shrink-0 flex items-center">
                    {getStatusIcon()}
                    {service.activeIncident && service.enhancedStatus === 'outage-with-incident' && (
                      <Info className="w-3 h-3 text-orange-600 absolute -bottom-1 -right-1" />
                    )}
                  </div>
                </TooltipTrigger>
                {service.activeIncident && service.enhancedStatus === 'outage-with-incident' && (
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-semibold">Active Incident:</p>
                      <p>{service.activeIncident.title}</p>
                      <p className="text-xs text-gray-500 mt-1">Status: {service.activeIncident.status}</p>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg leading-tight mb-0">{service.name}</h3>
          </div>

          {/* Right Side: Uptime % */}
          <div className="flex items-baseline gap-1 text-gray-500">
            <span className="text-base sm:text-2xl font-semibold sm:font-bold text-gray-900 dark:text-white">
              {service.currentStatus === 'unknown' ? '--' : `${service.uptimePercent24h.toFixed(2)}%`}
            </span>
            <span className="text-xs sm:hidden">uptime</span>
            <p className="text-xs uppercase hidden sm:block">Uptime</p>
          </div>
        </div>

        {/* Uptime Bars */}
        <div>
          <div className="flex items-center h-8 gap-0.5">
            {generateUptimeBars()}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span className="md:hidden">30 days ago</span>
            <span className="hidden md:block">90 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Removed: Incident Banner for outages without incidents - moved to admin panel */}

        {/* Active Incident Banner */}
        {service.activeIncident && service.enhancedStatus === 'outage-with-incident' && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="text-sm text-orange-800">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Active Incident:</span>
              </div>
              <p className="ml-6">{service.activeIncident.title}</p>
              <p className="ml-6 text-xs mt-1 text-orange-600">
                Started {formatRelativeTime(service.activeIncident.startTime)}
              </p>
            </div>
          </div>
        )}

        {/* Maintenance Banner */}
        {service.activeIncident && service.enhancedStatus === 'maintenance' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-4 h-4" />
                <span className="font-medium">Scheduled Maintenance:</span>
              </div>
              <p className="ml-6">{service.activeIncident.title}</p>
              {service.activeIncident.scheduledEnd && (
                <p className="ml-6 text-xs mt-1 text-blue-600">
                  Expected completion: {new Date(service.activeIncident.scheduledEnd).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {service.uptimePercent24h.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 uppercase">24h Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {service.uptimePercent7d.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 uppercase">7d Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {service.uptimePercent30d.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 uppercase">30d Uptime</p>
            </div>
            {service.averageResponseTime && (
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatResponseTime(service.averageResponseTime)}
                </p>
                <p className="text-xs text-gray-500 uppercase">Response Time</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
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