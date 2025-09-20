'use client'

import { useState, useEffect } from 'react'
import { ServiceWithStats, UptimeData } from '@/types'
import { getStatusColor, formatResponseTime, formatRelativeTime } from '@/lib/utils'
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
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
        return <AlertCircle className={styles.statusIcon} />
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
        return 'Degraded'
      case 'outage':
        return 'Outage'
      default:
        return 'Unknown'
    }
  }

  // Generate mini uptime bars for last 90 days
  const generateUptimeBars = () => {
    const bars = []
    const today = new Date()
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Simulate uptime data (you can replace with real data)
      const uptime = Math.random() > 0.05 ? 100 : Math.random() * 100
      const isUp = uptime > 95
      
      bars.push(
        <div
          key={i}
          className={`${styles.uptimeBar} ${isUp ? styles.uptimeBarUp : styles.uptimeBarDown}`}
          title={`${date.toDateString()}: ${uptime.toFixed(1)}% uptime`}
        />
      )
    }
    
    return bars
  }

  return (
    <div className={`${styles.serviceRow} ${styles[statusColor]}`}>
      <div className={styles.serviceMain} onClick={onToggle}>
        {/* Left side: Status + Service info */}
        <div className={styles.serviceLeft}>
          <div className={`${styles.statusIndicator} ${styles[statusColor]}`}>
            {getStatusIcon()}
          </div>
          <div className={styles.serviceInfo}>
            <h3 className={styles.serviceName}>{service.name}</h3>
            <span className={`${styles.statusText} ${styles[statusColor]}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Right side: Uptime chart + percentage */}
        <div className={styles.serviceRight}>
          <div className={styles.uptimeSection}>
            <div className={styles.uptimeChart}>
              {generateUptimeBars()}
            </div>
            <div className={styles.uptimePercentage}>
              <span className={styles.uptimeValue}>
                {service.uptimePercent30d.toFixed(3)}%
              </span>
              <span className={styles.uptimeLabel}>Uptime</span>
            </div>
          </div>
          
          <div className={styles.expandButton}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{service.uptimePercent24h.toFixed(2)}%</span>
              <span className={styles.metricLabel}>24h Uptime</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{service.uptimePercent7d.toFixed(2)}%</span>
              <span className={styles.metricLabel}>7d Uptime</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{service.uptimePercent30d.toFixed(2)}%</span>
              <span className={styles.metricLabel}>30d Uptime</span>
            </div>
            {service.averageResponseTime && (
              <div className={styles.metric}>
                <span className={styles.metricValue}>
                  {formatResponseTime(service.averageResponseTime)}
                </span>
                <span className={styles.metricLabel}>Avg Response</span>
              </div>
            )}
            <div className={styles.metric}>
              <span className={styles.metricValue}>
                {service.lastCheck ? formatRelativeTime(service.lastCheck) : 'Never'}
              </span>
              <span className={styles.metricLabel}>Last Check</span>
            </div>
          </div>

          {loadingHistory ? (
            <div className={styles.chartLoading}>
              <div className={styles.spinner}></div>
              <span>Loading detailed uptime history...</span>
            </div>
          ) : (
            <div className={styles.detailedChart}>
              <UptimeChart data={uptimeHistory} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}