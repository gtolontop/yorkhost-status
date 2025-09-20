'use client'

import { useState, useEffect } from 'react'
import { ServiceWithStats, UptimeData } from '@/types'
import { getStatusColor, formatResponseTime, formatRelativeTime } from '@/lib/utils'
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import UptimeChart from '@/components/charts/UptimeChart'
// import styles from './ServiceCard.module.scss' // Temporarily disabled for Tailwind migration
// Temporary styles object for basic layout
const styles: Record<string, string> = {
  serviceLeft: "flex items-center gap-3 flex-1",
  statusIcon: "flex-shrink-0",
  serviceInfo: "min-w-0",
  serviceName: "font-medium text-gray-900 truncate",
  statusText: "text-sm",
  serviceRight: "flex items-center gap-4",
  uptimeStats: "text-right",
  uptimePercent: "text-lg font-semibold",
  uptimeLabel: "text-xs text-gray-500 uppercase",
  uptimeBars: "flex gap-1",
  expandIcon: "flex-shrink-0 transition-transform",
  expandedContent: "border-t border-gray-100 p-4 bg-gray-50",
  detailsGrid: "grid grid-cols-2 md:grid-cols-5 gap-4 mb-4",
  statItem: "text-center",
  statValue: "text-lg font-semibold text-gray-900",
  statLabel: "text-xs text-gray-500 uppercase",
  loadingChart: "flex justify-center items-center h-12",
  spinner: "animate-spin w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full",
  chartContainer: "mt-4",
  success: "text-success",
  warning: "text-warning", 
  danger: "text-danger"
}

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
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-warning" />
      case 'outage':
        return <XCircle className="w-5 h-5 text-danger" />
      default:
        return <CheckCircle className="w-5 h-5 text-success" />
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

  // Generate 90 uptime bars (like Flare)
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
        if (uptime >= 98) return 'bg-success'
        if (uptime >= 90) return 'bg-warning'
        return 'bg-danger'
      }
      
      bars.push(
        <div
          key={i}
          className={`h-8 w-full rounded border ${getBarColor()}`}
          title={`${date.toLocaleDateString()}: ${uptime.toFixed(1)}% uptime`}
        />
      )
    }
    
    return bars
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
      <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggle}>
        {/* LEFT: Icon + Service Name + Status */}
        <div className={styles.serviceLeft}>
          <div className={`${styles.statusIcon} ${styles[statusColor]}`}>
            {getStatusIcon()}
          </div>
          <div className={styles.serviceInfo}>
            <h3 className={styles.serviceName}>{service.name}</h3>
            <div className={`${styles.statusText} ${styles[statusColor]}`}>
              {getStatusText()}
            </div>
          </div>
        </div>

        {/* RIGHT: Uptime % + Bars */}
        <div className={styles.serviceRight}>
          <div className={styles.uptimeStats}>
            <div className={styles.uptimePercent}>
              {service.uptimePercent30d.toFixed(3)}%
            </div>
            <div className={styles.uptimeLabel}>Uptime</div>
          </div>
          <div className={styles.uptimeBars}>
            {generateUptimeBars()}
          </div>
          <div className={styles.expandIcon}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.detailsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{service.uptimePercent24h.toFixed(2)}%</span>
              <span className={styles.statLabel}>24h Uptime</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{service.uptimePercent7d.toFixed(2)}%</span>
              <span className={styles.statLabel}>7d Uptime</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{service.uptimePercent30d.toFixed(2)}%</span>
              <span className={styles.statLabel}>30d Uptime</span>
            </div>
            {service.averageResponseTime && (
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {formatResponseTime(service.averageResponseTime)}
                </span>
                <span className={styles.statLabel}>Avg Response</span>
              </div>
            )}
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {service.lastCheck ? formatRelativeTime(service.lastCheck) : 'Never'}
              </span>
              <span className={styles.statLabel}>Last Check</span>
            </div>
          </div>

          {loadingHistory ? (
            <div className={styles.loadingChart}>
              <div className={styles.spinner}></div>
              <span>Loading detailed history...</span>
            </div>
          ) : (
            <div className={styles.chartContainer}>
              <UptimeChart data={uptimeHistory} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}