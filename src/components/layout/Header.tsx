'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Moon, Sun, MessageCircle, Bell, RefreshCw } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useStatusControls } from '@/contexts/StatusControlsContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { isRefreshing, onRefresh, onNotificationClick } = useStatusControls()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  return (
    <>
      <header className="bg-white dark:bg-[#0c0c14] border-b border-gray-200 dark:border-[#1a1a24] sticky top-0 z-50 transition-colors">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center flex-1 lg:flex-none">
              <Link href="/" className="flex items-center gap-2 sm:gap-3">
                <img 
                  src="https://yorkhost.fr/images/logo.png" 
                  alt="Yorkhost"
                  className="h-7 sm:h-8 w-auto"
                />
                <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Status</span>
              </Link>
            </div>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 flex-1">
              <Link href="/" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium group">
                Overview
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/maintenance" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium group">
                Maintenance
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/previous-incidents" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium group whitespace-nowrap">
                Previous Incidents
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center justify-end gap-2 flex-1 lg:flex-none">
              {/* Status Control Buttons - Only on homepage */}
              <div className="hidden sm:flex items-center gap-1">
                {/* Notifications Button */}
                <button
                  onClick={onNotificationClick}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a24]"
                  aria-label="Get notifications"
                  title="Get notifications"
                >
                  <Bell size={18} />
                </button>

                {/* Refresh Button */}
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a24]"
                  aria-label="Refresh status"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-[18px] h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a24]"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Discord Button - Hidden on mobile when burger menu is visible */}
              <a
                href="https://discord.gg/yorkhost"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-2 px-3 lg:px-4 py-2 bg-[#5865F2] text-white rounded-md hover:bg-[#4752C4] transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle size={18} />
                <span>Get in Touch</span>
              </a>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMenu}
                className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a24] transition-colors"
                aria-label="Toggle menu"
              >
                <div className="w-6 h-5 relative flex flex-col justify-between">
                  <span className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 transition-all duration-300 origin-left ${isMenuOpen ? 'rotate-45 translate-x-0.5' : ''}`}></span>
                  <span className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 transition-all duration-300 origin-left ${isMenuOpen ? '-rotate-45 translate-x-0.5' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenu}
      />

      {/* Mobile Menu */}
      <div 
        className={`lg:hidden fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-[#0c0c14] z-50 transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-[#1a1a24]">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Menu</span>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a24] transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <Link 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a24] rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Overview</span>
          </Link>
          <Link 
            href="/maintenance" 
            className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a24] rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">Maintenance</span>
          </Link>
          <Link 
            href="/previous-incidents" 
            className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a24] rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Previous Incidents</span>
          </Link>

          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-[#1a1a24] space-y-3">
            {/* Status Controls for Mobile */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onNotificationClick()
                  setIsMenuOpen(false)
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Bell size={18} />
                <span className="font-medium">Notifications</span>
              </button>

              <button
                onClick={() => {
                  onRefresh()
                  setIsMenuOpen(false)
                }}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-[18px] h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>

            <a
              href="https://discord.gg/yorkhost"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-all hover:scale-105 active:scale-95"
              onClick={() => setIsMenuOpen(false)}
            >
              <MessageCircle size={20} />
              <span className="font-medium">Get in Touch</span>
            </a>
          </div>
        </nav>
      </div>
    </>
  )
}