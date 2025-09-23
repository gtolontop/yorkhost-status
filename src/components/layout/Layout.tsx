'use client'

import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import { Toaster } from 'react-hot-toast'
// import styles from './Layout.module.scss' // Converted to Tailwind

interface LayoutProps {
  children: React.ReactNode
  className?: string
}

export default function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-yorkhost-dark transition-colors">
      <Header />
      
      <main className={`flex-1 py-6 md:py-8 lg:py-12 ${className || ''}`}>
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