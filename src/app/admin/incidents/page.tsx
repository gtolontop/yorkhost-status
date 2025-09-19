'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  ArrowLeft,
  Clock,
  User,
  Calendar,
  AlertCircle,
  XCircle
} from 'lucide-react'
import styles from '../admin.module.scss'

interface Incident {
  id: string
  title: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED' | 'SCHEDULED'
  isScheduled: boolean
  scheduledFor?: string
  eta?: string
  serviceId?: string
  machineId?: string
  tags: string[]
  startTime: string
  endTime?: string
  creator: {
    username: string
    avatar?: string
  }
  service?: {
    name: string
  }
  machine?: {
    name: string
  }
  updates: any[]
}

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [machines, setMachines] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM' as const,
    isScheduled: false,
    scheduledFor: '',
    eta: '',
    serviceId: '',
    machineId: '',
    tags: [] as string[]
  })

  useEffect(() => {
    fetchIncidents()
    fetchServices()
    fetchMachines()
  }, [])

  const fetchIncidents = async () => {
    try {
      const response = await fetch('/api/admin/incidents')
      const result = await response.json()
      
      if (result.success) {
        setIncidents(result.data || [])
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch incidents')
      }
    } catch (err) {
      setError('Network error')
      console.error('Incidents fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services')
      const result = await response.json()
      if (result.success) {
        setServices(result.data || [])
      }
    } catch (err) {
      console.error('Services fetch error:', err)
    }
  }

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/admin/machines')
      const result = await response.json()
      if (result.success) {
        setMachines(result.data || [])
      }
    } catch (err) {
      console.error('Machines fetch error:', err)
    }
  }

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          serviceId: formData.serviceId || undefined,
          machineId: formData.machineId || undefined,
          scheduledFor: formData.scheduledFor || undefined,
          eta: formData.eta || undefined
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setShowCreateForm(false)
        setFormData({
          title: '',
          description: '',
          severity: 'MEDIUM',
          isScheduled: false,
          scheduledFor: '',
          eta: '',
          serviceId: '',
          machineId: '',
          tags: []
        })
        fetchIncidents()
      } else {
        setError(result.error || 'Failed to create incident')
      }
    } catch (err) {
      setError('Network error')
      console.error('Create incident error:', err)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return '#22c55e'
      case 'MEDIUM': return '#f59e0b'
      case 'HIGH': return '#ef4444'
      case 'CRITICAL': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'INVESTIGATING': return <AlertTriangle size={16} />
      case 'IDENTIFIED': return <AlertCircle size={16} />
      case 'MONITORING': return <Clock size={16} />
      case 'RESOLVED': return <CheckCircle size={16} />
      case 'SCHEDULED': return <Calendar size={16} />
      default: return <XCircle size={16} />
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement des incidents...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className={styles.header}>
          <div>
            <button 
              onClick={() => window.location.href = '/admin'}
              className={styles.backBtn}
            >
              <ArrowLeft size={16} />
              Retour au dashboard
            </button>
            <h1>Gestion des Incidents</h1>
            <p>Créer et suivre les incidents et maintenances</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Nouvel incident
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {showCreateForm && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Créer un nouvel incident</h3>
              <form onSubmit={handleCreateIncident}>
                <div className={styles.formGroup}>
                  <label htmlFor="title">Titre de l'incident</label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="severity">Gravité</label>
                    <select
                      id="severity"
                      value={formData.severity}
                      onChange={(e) => setFormData({...formData, severity: e.target.value as any})}
                    >
                      <option value="LOW">Faible</option>
                      <option value="MEDIUM">Moyenne</option>
                      <option value="HIGH">Élevée</option>
                      <option value="CRITICAL">Critique</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.isScheduled}
                        onChange={(e) => setFormData({...formData, isScheduled: e.target.checked})}
                      />
                      Maintenance programmée
                    </label>
                  </div>
                </div>
                
                {formData.isScheduled && (
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="scheduledFor">Programmée pour</label>
                      <input
                        type="datetime-local"
                        id="scheduledFor"
                        value={formData.scheduledFor}
                        onChange={(e) => setFormData({...formData, scheduledFor: e.target.value})}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="eta">Fin estimée</label>
                      <input
                        type="datetime-local"
                        id="eta"
                        value={formData.eta}
                        onChange={(e) => setFormData({...formData, eta: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="serviceId">Service affecté (optionnel)</label>
                    <select
                      id="serviceId"
                      value={formData.serviceId}
                      onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                    >
                      <option value="">Aucun service spécifique</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="machineId">Machine affectée (optionnel)</label>
                    <select
                      id="machineId"
                      value={formData.machineId}
                      onChange={(e) => setFormData({...formData, machineId: e.target.value})}
                    >
                      <option value="">Aucune machine spécifique</option>
                      {machines.map(machine => (
                        <option key={machine.id} value={machine.id}>
                          {machine.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className={styles.formActions}>
                  <button type="button" onClick={() => setShowCreateForm(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Créer l'incident
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={styles.incidentsContainer}>
          {incidents.length === 0 ? (
            <div className={styles.emptyState}>
              <AlertTriangle size={48} />
              <h3>Aucun incident</h3>
              <p>Tous les services fonctionnent correctement</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Créer un incident
              </button>
            </div>
          ) : (
            <div className={styles.incidentsList}>
              {incidents.map(incident => (
                <div key={incident.id} className={styles.incidentCard}>
                  <div className={styles.incidentHeader}>
                    <div className={styles.incidentStatus}>
                      {getStatusIcon(incident.status)}
                      <span className={styles.statusText}>{incident.status}</span>
                    </div>
                    <div 
                      className={styles.severityBadge}
                      style={{ backgroundColor: getSeverityColor(incident.severity) }}
                    >
                      {incident.severity}
                    </div>
                  </div>
                  
                  <h3 className={styles.incidentTitle}>{incident.title}</h3>
                  <p className={styles.incidentDescription}>{incident.description}</p>
                  
                  <div className={styles.incidentMeta}>
                    <div className={styles.incidentCreator}>
                      <User size={14} />
                      <span>{incident.creator.username}</span>
                    </div>
                    
                    <div className={styles.incidentDate}>
                      <Clock size={14} />
                      <span>{new Date(incident.startTime).toLocaleDateString('fr-FR')}</span>
                    </div>
                    
                    {incident.service && (
                      <div className={styles.incidentService}>
                        Service: {incident.service.name}
                      </div>
                    )}
                    
                    {incident.machine && (
                      <div className={styles.incidentMachine}>
                        Machine: {incident.machine.name}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.incidentActions}>
                    <button className={styles.actionBtn}>
                      <Edit size={14} />
                      Modifier
                    </button>
                    <button className={styles.actionBtn}>
                      Voir détails
                    </button>
                    <button className={styles.actionBtn} style={{color: '#ef4444'}}>
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}