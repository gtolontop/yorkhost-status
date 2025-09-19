'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { Service, Machine } from '@/types'
import { 
  Server, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'
import styles from '../admin.module.scss'

interface ServiceWithMachine extends Service {
  machine: Machine
  checks: any[]
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceWithMachine[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    machineId: '',
    name: '',
    description: '',
    url: '',
    icon: ''
  })

  useEffect(() => {
    fetchServices()
    fetchMachines()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services')
      const result = await response.json()
      
      if (result.success) {
        setServices(result.data || [])
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch services')
      }
    } catch (err) {
      setError('Network error')
      console.error('Services fetch error:', err)
    } finally {
      setLoading(false)
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

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setShowCreateForm(false)
        setFormData({ machineId: '', name: '', description: '', url: '', icon: '' })
        fetchServices()
      } else {
        setError(result.error || 'Failed to create service')
      }
    } catch (err) {
      setError('Network error')
      console.error('Create service error:', err)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement des services...</p>
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
            <h1>Gestion des Services</h1>
            <p>Gérer les services surveillés sur les machines Yorkhost</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Nouveau service
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
              <h3>Créer un nouveau service</h3>
              <form onSubmit={handleCreateService}>
                <div className={styles.formGroup}>
                  <label htmlFor="machineId">Machine</label>
                  <select
                    id="machineId"
                    value={formData.machineId}
                    onChange={(e) => setFormData({...formData, machineId: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner une machine</option>
                    {machines.map(machine => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name} ({machine.category})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="name">Nom du service</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="url">URL (optionnel)</label>
                  <input
                    type="url"
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="icon">Icône (optionnel)</label>
                  <input
                    type="text"
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                    placeholder="ex: server, database, web"
                  />
                </div>
                
                <div className={styles.formActions}>
                  <button type="button" onClick={() => setShowCreateForm(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Créer le service
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={styles.servicesGrid}>
          {services.length === 0 ? (
            <div className={styles.emptyState}>
              <Server size={48} />
              <h3>Aucun service configuré</h3>
              <p>Commencez par créer votre premier service à surveiller</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Créer un service
              </button>
            </div>
          ) : (
            services.map(service => (
              <div key={service.id} className={styles.serviceCard}>
                <div className={styles.serviceHeader}>
                  <div className={styles.serviceIcon}>
                    <Server size={20} />
                  </div>
                  <div className={styles.serviceInfo}>
                    <h3>{service.name}</h3>
                    <p>{service.machine.name} • {service.machine.category}</p>
                  </div>
                  <div className={styles.serviceStatus}>
                    <CheckCircle size={16} color="#22c55e" />
                  </div>
                </div>
                
                {service.description && (
                  <p className={styles.serviceDescription}>{service.description}</p>
                )}
                
                {service.url && (
                  <a 
                    href={service.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.serviceUrl}
                  >
                    <ExternalLink size={14} />
                    Accéder au service
                  </a>
                )}
                
                <div className={styles.serviceStats}>
                  <span>Checks: {service.checks?.length || 0}</span>
                  <span>Uptime: 99.9%</span>
                </div>
                
                <div className={styles.serviceActions}>
                  <button className={styles.actionBtn}>
                    <Edit size={14} />
                    Modifier
                  </button>
                  <button className={styles.actionBtn} style={{color: '#ef4444'}}>
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}