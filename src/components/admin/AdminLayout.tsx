'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'
import styles from './AdminLayout.module.scss'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()
      if (result.success && result.data) {
        setUser(result.data)
      } else {
        window.location.href = '/admin'
      }
    } catch (error) {
      console.error('Auth check error:', error)
      window.location.href = '/admin'
    } finally {
      setLoading(false)
    }
  }

  const getPageInfo = () => {
    switch (pathname) {
      case '/admin':
        return { title: 'Dashboard', subtitle: 'Vue d\'ensemble de vos services' }
      case '/admin/services':
        return { title: 'Services', subtitle: 'Gérer vos services surveillés' }
      case '/admin/machines':
        return { title: 'Machines', subtitle: 'Configuration des serveurs' }
      case '/admin/incidents':
        return { title: 'Incidents', subtitle: 'Gestion des incidents et maintenances' }
      case '/admin/monitoring':
        return { title: 'Monitoring', subtitle: 'Surveillance en temps réel' }
      case '/admin/users':
        return { title: 'Utilisateurs', subtitle: 'Gestion des accès' }
      case '/admin/notifications':
        return { title: 'Notifications', subtitle: 'Configuration des alertes' }
      case '/admin/settings':
        return { title: 'Paramètres', subtitle: 'Configuration du système' }
      default:
        return { title: 'Admin', subtitle: 'Panel d\'administration' }
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Chargement du panel admin...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.authRequired}>
        <div className={styles.authCard}>
          <h2>Accès non autorisé</h2>
          <p>Vous devez être connecté pour accéder au panel admin.</p>
          <button onClick={() => window.location.href = '/admin'}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  const pageInfo = getPageInfo()

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar user={user} />
      
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <AdminNavbar 
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <main className={styles.contentArea}>
          <div className={styles.contentWrapper}>
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}