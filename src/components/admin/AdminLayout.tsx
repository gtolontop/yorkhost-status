'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'
import styles from './AdminLayout.module.scss'

interface AdminLayoutProps {
  children: React.ReactNode
}

// Cache l'état d'auth pour éviter le flicker
let authCache: { user: any; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(authCache?.user || null)
  const [loading, setLoading] = useState(!authCache?.user)
  const [authChecking, setAuthChecking] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Vérifier si le cache est encore valide
    const now = Date.now()
    if (authCache && (now - authCache.timestamp) < CACHE_DURATION && authCache.user) {
      setUser(authCache.user)
      setLoading(false)
      return
    }
    
    // Sinon, vérifier l'auth
    checkAuth()
  }, [])

  const checkAuth = async () => {
    setAuthChecking(true)
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()
      if (result.success && result.data) {
        const userData = result.data
        setUser(userData)
        // Mettre en cache
        authCache = {
          user: userData,
          timestamp: Date.now()
        }
      } else {
        // Effacer le cache en cas d'échec
        authCache = null
        setUser(null)
        window.location.href = '/api/auth/discord'
      }
    } catch (error) {
      console.error('Auth check error:', error)
      authCache = null
      setUser(null)
      window.location.href = '/api/auth/discord'
    } finally {
      setLoading(false)
      setAuthChecking(false)
    }
  }

  const getPageInfo = () => {
    switch (pathname) {
      case '/admin':
        return { title: 'Dashboard', subtitle: 'Overview of your services' }
      case '/admin/services':
        return { title: 'Services', subtitle: 'Manage your monitored services' }
      case '/admin/machines':
        return { title: 'Machines', subtitle: 'Server configuration' }
      case '/admin/incidents':
        return { title: 'Incidents', subtitle: 'Incident and maintenance management' }
      case '/admin/monitoring':
        return { title: 'Monitoring', subtitle: 'Real-time monitoring' }
      case '/admin/monitors':
        return { title: 'Monitors', subtitle: 'Health check configuration' }
      case '/admin/users':
        return { title: 'Users', subtitle: 'Access management' }
      case '/admin/notifications':
        return { title: 'Notifications', subtitle: 'Alert configuration' }
      case '/admin/settings':
        return { title: 'Settings', subtitle: 'System configuration' }
      default:
        return { title: 'Admin', subtitle: 'Administration panel' }
    }
  }

  // Si on est en train de charger la première fois et qu'on n'a pas d'utilisateur
  if (loading && !user) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #000000',
            borderRadius: '50%',
            margin: '0 auto 16px'
          }} className="loading-spinner"></div>
          <p style={{ color: '#666', margin: 0 }}>Loading...</p>
        </div>
        <style jsx>{`
          .loading-spinner {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Si pas d'utilisateur et qu'on a fini de charger
  if (!loading && !user && !authChecking) {
    return (
      <div className={styles.authRequired}>
        <div className={styles.authCard}>
          <h2>Access Required</h2>
          <p>You must be logged in to access the admin panel.</p>
          <button onClick={() => window.location.href = '/api/auth/discord'}>
            Login with Discord
          </button>
        </div>
      </div>
    )
  }

  // Si on a un utilisateur, afficher le contenu même si on fait une vérification en arrière-plan
  if (!user) {
    return null
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