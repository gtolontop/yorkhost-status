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
  Bell,
  Wrench
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
      icon: AlertTriangle,
      label: 'Down Services',
      href: '/admin/down-services',
      active: pathname.startsWith('/admin/down-services'),
      badgeColor: 'danger'
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
      icon: Wrench,
      label: 'Maintenances',
      href: '/admin/maintenances',
      active: pathname.startsWith('/admin/maintenances')
    },
    {
      icon: Activity,
      label: 'Monitoring Live',
      href: '/admin/monitoring',
      active: pathname === '/admin/monitoring'
    },
    {
      icon: Users,
      label: 'Users',
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
              <img 
                src="https://yorkhost.fr/images/logo.png" 
                alt="Yorkhost"
                className="h-6 w-auto"
                style={{ height: '24px', width: 'auto' }}
              />
              <span>Admin Panel</span>
            </>
          )}
          {isCollapsed && (
            <img 
              src="https://yorkhost.fr/images/logo.png" 
              alt="Yorkhost"
              className="h-6 w-auto"
              style={{ height: '24px', width: 'auto' }}
            />
          )}
        </div>
      </div>

      {/* Profil utilisateur */}
      <div className={styles.userProfile}>
        <div className={styles.userAvatar}>
          {user.avatar ? (
            <img 
              src={user.avatar.startsWith('http') ? user.avatar : `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} 
              alt={user.username} 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`${styles.avatarPlaceholder} ${user.avatar ? 'hidden' : ''}`}>
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className={styles.statusDot}></div>
        </div>
        {!isCollapsed && (
          <div className={styles.userInfo}>
            <h4>{user.username}</h4>
            <p>Administrator</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.navigation}>
        <div className={styles.navSection}>
          {!isCollapsed && <span className={styles.sectionTitle}>Main</span>}
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
          {!isCollapsed && <span className={styles.sectionTitle}>Management</span>}
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
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings size={20} />
          {!isCollapsed && <span>Settings</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`${styles.footerBtn} ${styles.logoutBtn}`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}