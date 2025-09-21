'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        onSuccess()
        onClose()
        setFormData({ name: '', description: '', color: '#3b82f6' })
      } else {
        alert(result.error || 'Erreur lors de la création du groupe')
      }
    } catch (error) {
      console.error('Failed to create group:', error)
      alert('Erreur lors de la création du groupe')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const colorOptions = [
    { value: '#3b82f6', name: 'Bleu' },
    { value: '#10b981', name: 'Vert' },
    { value: '#f59e0b', name: 'Orange' },
    { value: '#8b5cf6', name: 'Violet' },
    { value: '#06b6d4', name: 'Cyan' },
    { value: '#ef4444', name: 'Rouge' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-[1000]">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-[90%] max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="m-0 text-2xl font-semibold text-gray-900 dark:text-white">Créer un nouveau groupe</h2>
          <button 
            onClick={onClose}
            className="bg-transparent border-0 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              Nom du groupe *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="ex: Services Frontend"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[80px] resize-y"
              placeholder="Description du groupe..."
            />
          </div>

          <div className="mb-8">
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              Couleur
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center transition-all ${
                    formData.color === color.value 
                      ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-800' 
                      : 'ring-1 ring-gray-300 dark:ring-gray-600'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {formData.color === color.value && (
                    <span className="text-white text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer le groupe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}