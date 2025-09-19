'use client'

import { formatRelativeTime } from '@/lib/utils'
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'
import styles from './StatusOverview.module.scss'

interface StatusOverviewProps {
  overall: 'operational' | 'degraded' | 'outage'
  uptimeStats: {
    '24h': number
    '7d': number
    '30d': number
  }
  lastUpdated: Date
}

export default function StatusOverview({ overall, uptimeStats, lastUpdated }: StatusOverviewProps) {
  const getStatusInfo = () => {
    switch (overall) {
      case 'operational':
        return {
          icon: CheckCircle,
          title: 'All Systems Operational',
          message: 'All services are running normally.',
          className: styles.operational
        }
      case 'degraded':
        return {
          icon: AlertTriangle,
          title: 'Degraded Performance',
          message: 'Some services are experiencing issues.',
          className: styles.degraded
        }
      case 'outage':
        return {
          icon: XCircle,
          title: 'Service Outage',
          message: 'One or more services are currently unavailable.',
          className: styles.outage
        }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <div className={`${styles.overview} ${statusInfo.className}`}>
      <div className={styles.status}>
        <div className={styles.statusIcon}>
          <StatusIcon size={48} />
        </div>
        <div className={styles.statusText}>
          <h1 className={styles.statusTitle}>{statusInfo.title}</h1>
          <p className={styles.statusMessage}>{statusInfo.message}</p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{uptimeStats['24h'].toFixed(2)}%</div>
          <div className={styles.statLabel}>24h Uptime</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{uptimeStats['7d'].toFixed(2)}%</div>
          <div className={styles.statLabel}>7d Uptime</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{uptimeStats['30d'].toFixed(2)}%</div>
          <div className={styles.statLabel}>30d Uptime</div>
        </div>
      </div>

      <div className={styles.lastUpdated}>
        <RefreshCw size={16} />
        <span>Last updated {formatRelativeTime(lastUpdated)}</span>
      </div>
    </div>
  )
}