'use client'

import { useState, useEffect } from 'react'
import { ServiceWithStats, UptimeData } from '@/types'
import { getStatusColor, formatResponseTime, formatRelativeTime } from '@/lib/utils'
import { ChevronDown, ChevronUp, ExternalLink, Play, BarChart3 } from 'lucide-react'
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
      const response = await fetch(`/api/service/${service.id}/history?days=30`)
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

  const runManualCheck = async () => {
    try {
      const response = await fetch(`/api/check/${service.checks[0]?.id}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })
      
      if (response.ok) {
        // Show success feedback
      }
    } catch (error) {
      console.error('Failed to run manual check:', error)
    }
  }

  return (
    <div className={`${styles.card} ${styles[statusColor]}`}>
      <div className={styles.header} onClick={onToggle}>
        <div className={styles.service}>
          <div className={styles.serviceIcon}>
            {service.icon || '🔧'}
          </div>
          <div className={styles.serviceInfo}>
            <h4 className={styles.serviceName}>{service.name}</h4>
            {service.description && (
              <p className={styles.serviceDescription}>{service.description}</p>
            )}
          </div>
        </div>

        <div className={styles.status}>
          <div className={`${styles.statusIndicator} ${styles[statusColor]}`} />
          <span className={styles.statusText}>
            {service.currentStatus === 'operational' && 'Operational'}
            {service.currentStatus === 'degraded' && 'Degraded'}
            {service.currentStatus === 'outage' && 'Outage'}
          </span>
        </div>

        <div className={styles.expandButton}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      <div className={styles.metrics}>
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
      </div>

      {isExpanded && (
        <div className={styles.expanded}>
          <div className={styles.actions}>
            {service.url && (
              <a 
                href={service.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.actionButton}
              >
                <ExternalLink size={16} />
                Open Service
              </a>
            )}
            <button 
              onClick={runManualCheck}
              className={styles.actionButton}
            >
              <Play size={16} />
              Run Check
            </button>
            <button className={styles.actionButton}>
              <BarChart3 size={16} />
              View Details
            </button>
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Last Check:</span>
              <span className={styles.detailValue}>
                {service.lastCheck ? formatRelativeTime(service.lastCheck) : 'Never'}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Checks Configured:</span>
              <span className={styles.detailValue}>{service.checks?.length || 0}</span>
            </div>
          </div>

          {loadingHistory ? (
            <div className={styles.chartLoading}>
              <div className="loading"></div>
              <span>Loading uptime history...</span>
            </div>
          ) : (
            <UptimeChart data={uptimeHistory} />
          )}
        </div>
      )}
    </div>
  )
}