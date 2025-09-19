'use client'

import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import { Toaster } from 'react-hot-toast'
import styles from './Layout.module.scss'

interface LayoutProps {
  children: React.ReactNode
  className?: string
}

export default function Layout({ children, className }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <Header />
      
      <main className={`${styles.main} ${className || ''}`}>
        {children}
      </main>
      
      <Footer />
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)'
          },
          success: {
            style: {
              borderLeft: '4px solid var(--color-success)'
            }
          },
          error: {
            style: {
              borderLeft: '4px solid var(--color-danger)'
            }
          }
        }}
      />
    </div>
  )
}