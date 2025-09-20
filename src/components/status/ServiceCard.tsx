'use client'

import { useState, useEffect } from 'react'
import { ServiceWithStats, UptimeData } from '@/types'
import { getStatusColor, formatResponseTime, formatRelativeTime } from '@/lib/utils'
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import UptimeChart from '@/components/charts/UptimeChart'

interface ServiceCardProps {
  service: ServiceWithStats
  isExpanded: boolean
  onToggle: () => void
}

export default function ServiceCard({ service, isExpanded, onToggle }: ServiceCardProps) {
  const [uptimeHistory, setUptimeHistory] = useState<UptimeData[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const statusColor = getStatusColor(service.uptimePercent24h)

  useEffect(() => {
    if (isExpanded && uptimeHistory.length === 0) {
      fetchUptimeHistory()
    }
  }, [isExpanded])

  const fetchUptimeHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/service/${service.id}/history?days=90`)
      const result = await response.json()
      
      if (result.success) {
        setUptimeHistory(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch uptime history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const getStatusIcon = () => {
    switch (service.currentStatus) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />
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
      default:
        return 'Unknown'
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
      default:
        return 'text-gray-600'
    }
  }

  // Generate 90 uptime bars
  const generateUptimeBars = () => {
    const bars = []
    const today = new Date()
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Simulate uptime data based on service status
      let uptime = 100
      if (service.currentStatus === 'degraded') {
        uptime = Math.random() > 0.1 ? 100 : 85 + Math.random() * 10
      } else if (service.currentStatus === 'outage') {
        uptime = Math.random() > 0.05 ? 100 : Math.random() * 50
      } else {
        uptime = Math.random() > 0.02 ? 100 : 90 + Math.random() * 10
      }
      
      const getBarColor = () => {
        if (uptime >= 98) return 'bg-green-600'
        if (uptime >= 90) return 'bg-yellow-600'
        return 'bg-red-600'
      }
      
      bars.push(
        <div
          key={i}
          className={`h-6 w-0.5 rounded-full ${getBarColor()}`}
          title={`${date.toLocaleDateString()}: ${uptime.toFixed(1)}% uptime`}
        />
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
              {service.uptimePercent24h.toFixed(2)}%
            </div>
            <p className="text-xs text-gray-500 uppercase">Uptime</p>
          </div>
        </div>

        {/* Uptime Bars */}
        <div className="mt-4">
          <div className="flex gap-0.5 items-center justify-between">
            {generateUptimeBars()}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>90 days ago</span>
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
            {service.responseTime && (
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatResponseTime(service.responseTime)}
                </p>
                <p className="text-xs text-gray-500 uppercase">Response Time</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {service.lastCheckedAt ? formatRelativeTime(service.lastCheckedAt) : 'Never'}
              </p>
              <p className="text-xs text-gray-500 uppercase">Last Check</p>
            </div>
          </div>

          {/* Uptime Chart */}
          {loadingHistory ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full"></div>
            </div>
          ) : (
            uptimeHistory.length > 0 && (
              <div>
                <UptimeChart data={uptimeHistory} />
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}