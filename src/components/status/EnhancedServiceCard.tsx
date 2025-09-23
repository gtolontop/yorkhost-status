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
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null)
  
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
      const maintenances = dayData?.maintenances || []
      
      const getBarColor = () => {
        if (!dayData || uptime === -1) return 'bg-gray-300 dark:bg-gray-600' // No data = gray
        if (maintenances.length > 0) return 'bg-blue-500' // Blue for maintenance (priority)
        if (uptime >= 99.9) return 'bg-green-500'
        if (uptime >= 90) return 'bg-yellow-500'
        return 'bg-red-500'
      }

      const getStatus = () => {
        if (maintenances.length > 0) {
          return `${maintenances.length} maintenance${maintenances.length > 1 ? 's' : ''}`
        }
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
          onMouseEnter={() => setActiveTooltip(i)}
          onMouseLeave={() => {
            // Small delay to allow moving to tooltip
            setTimeout(() => setActiveTooltip(null), 150)
          }}
        >
          {/* Enhanced Tooltip with better positioning and interactions */}
          <div
            className={`absolute bottom-full transition-all duration-200 z-50 mb-3 ${
              activeTooltip === i ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            } ${
              // Smart positioning based on bar position
              i < 5 ? 'left-0' : i > daysToShow - 6 ? 'right-0' : 'left-1/2 transform -translate-x-1/2'
            }`}
            onMouseEnter={() => setActiveTooltip(i)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-4 min-w-[220px] max-w-[320px] backdrop-blur-sm">
              {/* Date Header */}
              <div className="font-semibold text-gray-900 dark:text-white text-sm border-b border-gray-200 dark:border-gray-600 pb-2 mb-2">
                {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>

              {/* Uptime Status */}
              <div className="mb-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Uptime</div>
                <div className={`text-sm font-medium ${
                  uptime === -1 ? 'text-gray-500' :
                  uptime >= 99.9 ? 'text-green-600 dark:text-green-400' :
                  uptime >= 90 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {uptime === -1 ? 'No data available' : `${uptime.toFixed(1)}% - ${getStatus()}`}
                </div>
              </div>

              {/* Maintenances */}
              {maintenances.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide font-medium">
                    {maintenances.length} Maintenance{maintenances.length > 1 ? 's' : ''}
                  </div>
                  <div className="space-y-1 mt-1">
                    {maintenances.slice(0, 3).map((mnt: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors p-1 -m-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Navigate to maintenance detail page
                          window.open(`/maintenance/${mnt.id}`, '_blank')
                        }}
                      >
                        • {mnt.title}
                      </div>
                    ))}
                    {maintenances.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{maintenances.length - 3} more maintenance{maintenances.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Incidents */}
              {incidents.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide font-medium">
                    {incidents.length} Incident{incidents.length > 1 ? 's' : ''}
                  </div>
                  <div className="space-y-1 mt-1">
                    {incidents.slice(0, 3).map((inc: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors p-1 -m-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Navigate to incident detail page
                          window.open(`/incident/${inc.id}`, '_blank')
                        }}
                      >
                        • {inc.title}
                      </div>
                    ))}
                    {incidents.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{incidents.length - 3} more incident{incidents.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Show message when no events */}
              {maintenances.length === 0 && incidents.length === 0 && uptime !== -1 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  No incidents or maintenances
                </div>
              )}
            </div>

            {/* Tooltip Arrow with smart positioning */}
            <div className={`absolute top-full ${
              i < 5 ? 'left-4' : i > daysToShow - 6 ? 'right-4' : 'left-1/2 transform -translate-x-1/2'
            }`}>
              <div className="border-6 border-transparent border-t-white dark:border-t-gray-800"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-px">
                <div className="border-6 border-transparent border-t-gray-200 dark:border-t-gray-600"></div>
              </div>
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
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
            <div className="text-sm text-orange-800 dark:text-orange-300">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Active Incident:</span>
              </div>
              <p className="ml-6">{service.activeIncident.title}</p>
              <p className="ml-6 text-xs mt-1 text-orange-600 dark:text-orange-400">
                Started {formatRelativeTime(service.activeIncident.startTime)}
              </p>
            </div>
          </div>
        )}

        {/* Maintenance Banner */}
        {service.activeIncident && service.enhancedStatus === 'maintenance' && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-4 h-4" />
                <span className="font-medium">Scheduled Maintenance:</span>
              </div>
              <p className="ml-6">{service.activeIncident.title}</p>
              {service.activeIncident.scheduledEnd && (
                <p className="ml-6 text-xs mt-1 text-blue-600 dark:text-blue-400">
                  Expected completion: {new Date(service.activeIncident.scheduledEnd).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
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