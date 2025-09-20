'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'
// import styles from './Header.module.scss' // Converted to Tailwind
const styles = {
  header: "bg-white border-b border-gray-200 sticky top-0 z-50",
  container: "flex items-center justify-between h-16",
  brand: "flex items-center gap-3",
  logo: "text-xl font-bold text-primary",
  nav: "hidden md:flex items-center gap-6",
  navLink: "text-gray-600 hover:text-gray-900 transition-colors",
  mobileMenuButton: "md:hidden p-2",
  mobileMenu: "md:hidden bg-white border-t border-gray-200 absolute top-full left-0 right-0",
  mobileNav: "flex flex-col gap-4 p-4",
  themeToggle: "p-2 text-gray-600 hover:text-gray-900 transition-colors"
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>Yorkhost</span>
          </Link>
        </div>

        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
          <Link href="/" className={styles.navLink}>
            Status
          </Link>
          <Link href="/maintenance" className={styles.navLink}>
            Maintenance
          </Link>
          <Link href="/incidents" className={styles.navLink}>
            Previous Incidents
          </Link>
        </nav>

        <div className={styles.actions}>
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link href="/contact" className={styles.contactBtn}>
            Get in Touch
          </Link>

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