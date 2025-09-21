'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Moon, Sun, Menu, X, MessageCircle } from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center flex-1">
            <Link href="/" className="flex items-center gap-3">
              <img 
                src="https://yorkhost.fr/images/logo.png" 
                alt="Yorkhost"
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-gray-900">Status</span>
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center justify-center gap-4 xl:gap-6 flex-1">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Overview
            </Link>
            <Link href="/maintenance" className="text-gray-600 hover:text-gray-900 transition-colors">
              Maintenance
            </Link>
            <Link href="/previous-incidents" className="text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
              Previous Incidents
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-2 flex-1">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Discord Button */}
            <a
              href="https://discord.gg/yorkhost"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded-md hover:bg-[#4752C4] transition-colors"
            >
              <MessageCircle size={18} />
              <span>Get in Touch</span>
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="container mx-auto px-4 py-4 space-y-3">
            <Link 
              href="/" 
              className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Overview
            </Link>
            <Link 
              href="/down-services" 
              className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Down Services
            </Link>
            <Link 
              href="/maintenance" 
              className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Maintenance
            </Link>
            <Link 
              href="/previous-incidents" 
              className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Previous Incidents
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}