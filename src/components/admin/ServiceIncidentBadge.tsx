import { AlertTriangle, Clock } from 'lucide-react'

interface ServiceIncidentBadgeProps {
  serviceId: string
  incidents?: any[]
}

export default function ServiceIncidentBadge({ serviceId, incidents = [] }: ServiceIncidentBadgeProps) {
  // Find active incident for this service
  const activeIncident = incidents.find(i => i.serviceId === serviceId && i.isActive)
  
  if (!activeIncident) return null
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      background: '#fee2e2',
      color: '#dc2626',
      padding: '0.25rem 0.75rem',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 500
    }}>
      <AlertTriangle size={12} />
      <span>Down for {activeIncident.durationText}</span>
    </div>
  )
}