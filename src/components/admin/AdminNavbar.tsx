'use client'

import { useState } from 'react'
import { 
  Search, 
  Bell, 
  MessageSquare, 
  Settings, 
  Menu,
  Sun,
  Moon,
  RefreshCw,
  ChevronDown,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import styles from './AdminNavbar.module.scss'

interface AdminNavbarProps {
  title: string
  subtitle?: string
  onMenuToggle?: () => void
}

export default function AdminNavbar({ title, subtitle, onMenuToggle }: AdminNavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const notifications = [
    {
      id: 1,
      type: 'error',
      title: 'Service Down',
      message: 'API Gateway est hors ligne depuis 5 minutes',
      time: '2 min',
      unread: true
    },
    {
      id: 2,
      type: 'warning',
      title: 'High Response Time',
      message: 'Database cluster répond lentement',
      time: '5 min',
      unread: true
    },
    {
      id: 3,
      type: 'success',
      title: 'Incident Résolu',
      message: 'Web Server est maintenant opérationnel',
      time: '10 min',
      unread: false
    }
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle size={16} />
      case 'warning': return <AlertTriangle size={16} />
      case 'success': return <CheckCircle size={16} />
      default: return <Activity size={16} />
    }
  }

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <div className={styles.navbar}>
      <div className={styles.navbarLeft}>
        <button 
          className={styles.menuBtn}
          onClick={onMenuToggle}
        >
          <Menu size={20} />
        </button>
        
        <div className={styles.titleSection}>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className={styles.navbarRight}>
        <div className={styles.statusIndicator}>
          <div className={styles.statusDot}></div>
          <span>Tous les systèmes opérationnels</span>
        </div>

        <button 
          className={styles.refreshBtn}
          onClick={() => window.location.reload()}
          title="Actualiser"
        >
          <RefreshCw size={18} />
        </button>

        <button 
          className={styles.themeToggle}
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className={styles.notificationContainer}>
          <button 
            className={styles.notificationBtn}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={styles.notificationBadge}>{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>
                <h3>Notifications</h3>
                <button className={styles.markAllRead}>
                  Tout marquer comme lu
                </button>
              </div>
              
              <div className={styles.notificationList}>
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`${styles.notificationItem} ${notification.unread ? styles.unread : ''}`}
                  >
                    <div className={`${styles.notificationIcon} ${styles[notification.type]}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className={styles.notificationContent}>
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className={styles.notificationTime}>{notification.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.notificationFooter}>
                <button>Voir toutes les notifications</button>
              </div>
            </div>
          )}
        </div>

        <button className={styles.messageBtn} title="Messages">
          <MessageSquare size={18} />
        </button>

        <button className={styles.settingsBtn} title="Paramètres rapides">
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}