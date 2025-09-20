'use client'

import { useState, useEffect } from 'react'
import { ServiceWithStats, UptimeData } from '@/types'
import { getStatusColor, formatResponseTime, formatRelativeTime } from '@/lib/utils'
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import UptimeChart from '@/components/charts/UptimeChart'
import styles from './ServiceCard.module.scss'

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
        return <CheckCircle className={styles.statusIcon} />
      case 'degraded':
        return <AlertTriangle className={styles.statusIcon} />
      case 'outage':
        return <XCircle className={styles.statusIcon} />
      default:
        return <CheckCircle className={styles.statusIcon} />
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
        if (uptime >= 98) return styles.barUp
        if (uptime >= 90) return styles.barDegraded
        return styles.barDown
      }
      
      bars.push(
        <div
          key={i}
          className={`${styles.uptimeBar} ${getBarColor()}`}
          title={`${date.toLocaleDateString()}: ${uptime.toFixed(1)}% uptime`}
        />
      )
    }
    
    return bars
  }

  return (
    <div className={styles.serviceContainer}>
      <div className={styles.serviceRow} onClick={onToggle}>
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