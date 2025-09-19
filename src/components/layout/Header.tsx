'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Moon, Sun, Menu, X, LogIn, User, LogOut } from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'
import styles from './Header.module.scss'

interface User {
  id: string
  username: string
  avatar?: string
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    checkAuth()
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
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    window.location.href = '/api/auth/discord'
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🚀</span>
            <span className={styles.logoText}>Yorkhost Status</span>
          </Link>
        </div>

        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
          <Link href="/" className={styles.navLink}>
            Status
          </Link>
          <Link href="/incidents" className={styles.navLink}>
            Incidents
          </Link>
          <Link href="/admin" className={styles.navLink}>
            Admin
          </Link>
        </nav>

        <div className={styles.actions}>
          {!loading && (
            <div className={styles.auth}>
              {user ? (
                <div className={styles.userMenu}>
                  <div className={styles.userInfo}>
                    {user.avatar ? (
                      <img 
                        src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                        alt={user.username}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarFallback}>
                        <User size={16} />
                      </div>
                    )}
                    <span className={styles.username}>{user.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className={styles.logoutBtn}
                    aria-label="Déconnexion"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className={styles.loginBtn}
                  aria-label="Connexion Discord"
                >
                  <LogIn size={16} />
                  <span>Discord</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={toggleMenu}
            className={styles.menuToggle}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  )
}