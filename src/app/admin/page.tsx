'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { DashboardStats } from '@/types'
import { 
  Server, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users,
  Settings
} from 'lucide-react'
import styles from './admin.module.scss'

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    fetchStats()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()
      if (result.success && result.data) {
        setUser(result.data)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch dashboard stats')
      }
    } catch (err) {
      setError('Network error')
      console.error('Dashboard stats fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Layout>
        <div className="container">
          <div className={styles.authRequired}>
            <div className={styles.authCard}>
              <Users size={48} />
              <h2>Authentification requise</h2>
              <p>Vous devez être connecté avec Discord pour accéder au panel admin.</p>
              <button 
                onClick={() => window.location.href = '/api/auth/discord'}
                className="btn btn-primary"
              >
                Se connecter avec Discord
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement du dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="container">
          <div className={styles.error}>
            <AlertTriangle size={48} />
            <h2>Erreur de chargement</h2>
            <p>{error}</p>
            <button onClick={fetchStats} className="btn btn-primary">
              Réessayer
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const statCards = [
    {
      title: 'Services totaux',
      value: stats?.totalServices || 0,
      icon: Server,
      color: '#3b82f6',
      change: '+2 ce mois'
    },
    {
      title: 'Checks totaux',
      value: stats?.totalChecks || 0,
      icon: Activity,
      color: '#10b981',
      change: `${stats?.checksLast24h || 0} dernières 24h`
    },
    {
      title: 'Incidents actifs',
      value: stats?.activeIncidents || 0,
      icon: AlertTriangle,
      color: '#f59e0b',
      change: stats?.activeIncidents === 0 ? 'Aucun incident' : 'À surveiller'
    },
    {
      title: 'Uptime moyen',
      value: `${stats?.averageUptime?.toFixed(2) || 100}%`,
      icon: CheckCircle,
      color: '#22c55e',
      change: 'Dernières 24h'
    },
    {
      title: 'Temps de réponse P95',
      value: `${stats?.responseTimeP95 || 0}ms`,
      icon: Clock,
      color: '#8b5cf6',
      change: 'Dernières 24h'
    },
    {
      title: 'MTTR moyen',
      value: `${stats?.mttr || 0}min`,
      icon: TrendingUp,
      color: '#ef4444',
      change: 'Derniers 30j'
    }
  ]

  const quickActions = [
    {
      title: 'Gérer les services',
      description: 'Ajouter, modifier ou supprimer des services',
      icon: Server,
      href: '/admin/services',
      color: '#3b82f6'
    },
    {
      title: 'Gérer les machines',
      description: 'Configuration des serveurs et machines',
      icon: Settings,
      href: '/admin/machines',
      color: '#10b981'
    },
    {
      title: 'Gérer les incidents',
      description: 'Créer et suivre les incidents',
      icon: AlertTriangle,
      href: '/admin/incidents',
      color: '#f59e0b'
    },
    {
      title: 'Monitoring en temps réel',
      description: 'Voir les checks en cours',
      icon: Activity,
      href: '/admin/monitoring',
      color: '#8b5cf6'
    }
  ]

  return (
    <Layout>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1>Panel Administrateur</h1>
            <p>Gestion et monitoring des services Yorkhost</p>
          </div>
          <div className={styles.userInfo}>
            <span>Connecté en tant que <strong>{user.username}</strong></span>
          </div>
        </div>

        <div className={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: stat.color }}>
                <stat.icon size={24} color="white" />
              </div>
              <div className={styles.statContent}>
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
                <span className={styles.statChange}>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.actionsSection}>
          <h2>Actions rapides</h2>
          <div className={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <div key={index} className={styles.actionCard}>
                <div className={styles.actionIcon} style={{ backgroundColor: action.color }}>
                  <action.icon size={24} color="white" />
                </div>
                <div className={styles.actionContent}>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => {
                      // Pour l'instant, on affiche une alerte car les pages détaillées ne sont pas créées
                      alert(`Fonctionnalité "${action.title}" en cours de développement`)
                    }}
                  >
                    Accéder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.recentActivity}>
          <h2>Activité récente</h2>
          <div className={styles.activityCard}>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>
                <CheckCircle size={16} color="#22c55e" />
              </div>
              <div className={styles.activityContent}>
                <p><strong>Système de monitoring</strong> est opérationnel</p>
                <span>Il y a 2 minutes</span>
              </div>
            </div>
            
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>
                <Activity size={16} color="#3b82f6" />
              </div>
              <div className={styles.activityContent}>
                <p><strong>API Status</strong> - Check automatique effectué</p>
                <span>Il y a 5 minutes</span>
              </div>
            </div>
            
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>
                <Server size={16} color="#10b981" />
              </div>
              <div className={styles.activityContent}>
                <p><strong>Base de données</strong> - Connexion établie</p>
                <span>Il y a 1 heure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}