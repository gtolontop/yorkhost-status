'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Server, 
  AlertTriangle, 
  Activity, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Database,
  Shield,
  Bell
} from 'lucide-react'
import styles from './AdminSidebar.module.scss'

interface AdminSidebarProps {
  user: {
    id: string
    username: string
    avatar?: string
    email?: string
  }
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/admin',
      active: pathname === '/admin'
    },
    {
      icon: Server,
      label: 'Services',
      href: '/admin/services',
      active: pathname.startsWith('/admin/services'),
      badge: '12'
    },
    {
      icon: Monitor,
      label: 'Machines',
      href: '/admin/machines',
      active: pathname.startsWith('/admin/machines'),
      badge: '5'
    },
    {
      icon: AlertTriangle,
      label: 'Incidents',
      href: '/admin/incidents',
      active: pathname.startsWith('/admin/incidents'),
      badge: '2',
      badgeColor: 'danger'
    },
    {
      icon: Activity,
      label: 'Monitoring',
      href: '/admin/monitoring',
      active: pathname.startsWith('/admin/monitoring')
    },
    {
      icon: Users,
      label: 'Utilisateurs',
      href: '/admin/users',
      active: pathname.startsWith('/admin/users')
    },
    {
      icon: Bell,
      label: 'Notifications',
      href: '/admin/notifications',
      active: pathname.startsWith('/admin/notifications')
    }
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navigate = (href: string) => {
    router.push(href)
  }

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Header avec logo et toggle */}
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>
          {!isCollapsed && (
            <>
              <Shield size={24} />
              <span>Admin Panel</span>
            </>
          )}
          {isCollapsed && <Shield size={24} />}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={styles.toggleBtn}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Profil utilisateur */}
      <div className={styles.userProfile}>
        <div className={styles.userAvatar}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={styles.statusDot}></div>
        </div>
        {!isCollapsed && (
          <div className={styles.userInfo}>
            <h4>{user.username}</h4>
            <p>Administrateur</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.navigation}>
        <div className={styles.navSection}>
          {!isCollapsed && <span className={styles.sectionTitle}>Principal</span>}
          {menuItems.slice(0, 4).map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`${styles.navItem} ${item.active ? styles.active : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!isCollapsed && (
                <>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`${styles.badge} ${item.badgeColor ? styles[item.badgeColor] : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        <div className={styles.navSection}>
          {!isCollapsed && <span className={styles.sectionTitle}>Gestion</span>}
          {menuItems.slice(4).map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`${styles.navItem} ${item.active ? styles.active : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!isCollapsed && (
                <>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`${styles.badge} ${item.badgeColor ? styles[item.badgeColor] : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer avec paramètres et déconnexion */}
      <div className={styles.sidebarFooter}>
        <button
          onClick={() => navigate('/admin/settings')}
          className={styles.footerBtn}
          title={isCollapsed ? 'Paramètres' : undefined}
        >
          <Settings size={20} />
          {!isCollapsed && <span>Paramètres</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`${styles.footerBtn} ${styles.logoutBtn}`}
          title={isCollapsed ? 'Déconnexion' : undefined}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  )
}