'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { Machine } from '@/types'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Server,
  MapPin,
  Tag
} from 'lucide-react'
import styles from '../admin.module.scss'

interface MachineWithServices extends Machine {
  services: any[]
}

export default function AdminMachinesPage() {
  const [machines, setMachines] = useState<MachineWithServices[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    tags: [] as string[]
  })

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/admin/machines')
      const result = await response.json()
      
      if (result.success) {
        setMachines(result.data || [])
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch machines')
      }
    } catch (err) {
      setError('Network error')
      console.error('Machines fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/machines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setShowCreateForm(false)
        setFormData({ name: '', description: '', category: '', location: '', tags: [] })
        fetchMachines()
      } else {
        setError(result.error || 'Failed to create machine')
      }
    } catch (err) {
      setError('Network error')
      console.error('Create machine error:', err)
    }
  }

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag.trim()]
      })
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement des machines...</p>
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
            <h1>Gestion des Machines</h1>
            <p>Gérer les serveurs et machines Yorkhost</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Nouvelle machine
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
              <h3>Créer une nouvelle machine</h3>
              <form onSubmit={handleCreateMachine}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Nom de la machine</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="category">Catégorie</label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="web">Serveur Web</option>
                    <option value="database">Base de données</option>
                    <option value="api">API Server</option>
                    <option value="storage">Stockage</option>
                    <option value="network">Réseau</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="other">Autre</option>
                  </select>
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
                  <label htmlFor="location">Localisation</label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="ex: France, Paris, OVH"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Tags</label>
                  <div className={styles.tagInput}>
                    <input
                      type="text"
                      placeholder="Ajouter un tag et appuyer sur Entrée"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <div className={styles.tags}>
                      {formData.tags.map(tag => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className={styles.formActions}>
                  <button type="button" onClick={() => setShowCreateForm(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Créer la machine
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={styles.machinesGrid}>
          {machines.length === 0 ? (
            <div className={styles.emptyState}>
              <Settings size={48} />
              <h3>Aucune machine configurée</h3>
              <p>Commencez par ajouter votre première machine</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Créer une machine
              </button>
            </div>
          ) : (
            machines.map(machine => (
              <div key={machine.id} className={styles.machineCard}>
                <div className={styles.machineHeader}>
                  <div className={styles.machineIcon}>
                    <Settings size={20} />
                  </div>
                  <div className={styles.machineInfo}>
                    <h3>{machine.name}</h3>
                    <p className={styles.category}>{machine.category}</p>
                  </div>
                  <div className={styles.machineStatus}>
                    <CheckCircle size={16} color="#22c55e" />
                  </div>
                </div>
                
                {machine.description && (
                  <p className={styles.machineDescription}>{machine.description}</p>
                )}
                
                {machine.location && (
                  <div className={styles.machineLocation}>
                    <MapPin size={14} />
                    <span>{machine.location}</span>
                  </div>
                )}
                
                {machine.tags && machine.tags.length > 0 && (
                  <div className={styles.machineTags}>
                    {machine.tags.map((tag: string) => (
                      <span key={tag} className={styles.tag}>
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className={styles.machineStats}>
                  <span>Services: {machine.services?.length || 0}</span>
                  <span>Uptime: 99.9%</span>
                </div>
                
                <div className={styles.machineActions}>
                  <button className={styles.actionBtn}>
                    <Server size={14} />
                    Services
                  </button>
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