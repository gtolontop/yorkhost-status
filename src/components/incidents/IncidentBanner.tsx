'use client'

import Link from 'next/link'
import { IncidentWithDetails } from '@/types'
import { getSeverityColor, formatRelativeTime } from '@/lib/utils'
import { AlertTriangle, XCircle, Clock, ExternalLink } from 'lucide-react'
import styles from './IncidentBanner.module.scss'

interface IncidentBannerProps {
  incidents: IncidentWithDetails[]
}

export default function IncidentBanner({ incidents }: IncidentBannerProps) {
  // Ensure incidents is an array
  const safeIncidents = Array.isArray(incidents) ? incidents : []
  
  if (safeIncidents.length === 0) {
    return null
  }

  // Sort by severity and recency
  const sortedIncidents = [...safeIncidents].sort((a, b) => {
    const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
    const aSeverity = severityOrder[a.severity] || 1
    const bSeverity = severityOrder[b.severity] || 1
    
    if (aSeverity !== bSeverity) {
      return bSeverity - aSeverity
    }
    
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  })

  const primaryIncident = sortedIncidents[0]
  const additionalCount = safeIncidents.length - 1

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return XCircle
      case 'HIGH':
        return AlertTriangle
      default:
        return Clock
    }
  }

  const SeverityIcon = getSeverityIcon(primaryIncident.severity)
  const severityColor = getSeverityColor(primaryIncident.severity)

  return (
    <div className={`${styles.banner} ${styles[severityColor]}`}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <SeverityIcon size={24} />
        </div>
        
        <div className={styles.info}>
          <div className={styles.header}>
            <h3 className={styles.title}>{primaryIncident.title}</h3>
            <div className={styles.meta}>
              <span className={`${styles.severity} ${styles[severityColor]}`}>
                {primaryIncident.severity}
              </span>
              <span className={styles.time}>
                Started {formatRelativeTime(primaryIncident.startTime)}
              </span>
            </div>
          </div>
          
          <p className={styles.description}>
            {primaryIncident.description}
          </p>
          
          {primaryIncident.updates && primaryIncident.updates.length > 0 && (
            <div className={styles.latestUpdate}>
              <strong>Latest Update:</strong> {primaryIncident.updates[0].message}
            </div>
          )}
          
          {additionalCount > 0 && (
            <p className={styles.additional}>
              +{additionalCount} additional incident{additionalCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className={styles.actions}>
          <Link 
            href={`/incidents/${primaryIncident.id}`}
            className={styles.detailsLink}
          >
            <span>View Details</span>
            <ExternalLink size={16} />
          </Link>
          
          {additionalCount > 0 && (
            <Link 
              href="/incidents"
              className={styles.allIncidentsLink}
            >
              View All Incidents
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}