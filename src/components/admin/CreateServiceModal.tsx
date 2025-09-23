'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateServiceModal({ isOpen, onClose, onSuccess }: CreateServiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'HTTP',
    target: '',
    port: '',
    interval: 60,
    timeout: 10,
    expectedStatusCodes: [200]
  })

  const monitorTypes = [
    { value: 'HTTP', label: 'HTTP/HTTPS Website' },
    { value: 'TCP', label: 'TCP Port' },
    { value: 'ICMP', label: 'Ping (ICMP)' },
    { value: 'DNS', label: 'DNS Query' }
  ]

  const intervalOptions = [
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
    { value: 1800, label: '30 minutes' }
  ]

  const statusCodeOptions = [
    { value: 200, label: '200 - OK', group: 'Success' },
    { value: 201, label: '201 - Created', group: 'Success' },
    { value: 202, label: '202 - Accepted', group: 'Success' },
    { value: 204, label: '204 - No Content', group: 'Success' },
    { value: 301, label: '301 - Moved Permanently', group: 'Redirect' },
    { value: 302, label: '302 - Found', group: 'Redirect' },
    { value: 304, label: '304 - Not Modified', group: 'Redirect' },
    { value: 307, label: '307 - Temporary Redirect', group: 'Redirect' },
    { value: 308, label: '308 - Permanent Redirect', group: 'Redirect' },
    { value: 400, label: '400 - Bad Request', group: 'Client Error' },
    { value: 401, label: '401 - Unauthorized', group: 'Client Error' },
    { value: 403, label: '403 - Forbidden', group: 'Client Error' },
    { value: 404, label: '404 - Not Found', group: 'Client Error' },
    { value: 500, label: '500 - Internal Server Error', group: 'Server Error' },
    { value: 502, label: '502 - Bad Gateway', group: 'Server Error' },
    { value: 503, label: '503 - Service Unavailable', group: 'Server Error' }
  ]

  const toggleStatusCode = (code: number) => {
    setFormData(prev => ({
      ...prev,
      expectedStatusCodes: prev.expectedStatusCodes.includes(code)
        ? prev.expectedStatusCodes.filter(c => c !== code)
        : [...prev.expectedStatusCodes, code]
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'HTTP',
      target: '',
      port: '',
      interval: 60,
      timeout: 10,
      expectedStatusCodes: [200]
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          target: formData.target,
          port: (['ICMP', 'DNS'].includes(formData.type) || !formData.port) ? null : parseInt(formData.port),
          interval: formData.interval,
          timeout: formData.timeout,
          expectedStatusCodes: formData.type === 'HTTP' ? formData.expectedStatusCodes : undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
        onClose()
        resetForm()
      } else {
        setError(result.error || 'Failed to create service')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-[1000]">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-[90%] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="m-0 text-2xl font-semibold text-gray-900 dark:text-white">
            Create Service
          </h2>
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="bg-transparent border-0 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Service Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="My Website"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Monitor Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({
                ...formData,
                type: e.target.value,
                // Clear port when switching to types that don't need it
                port: ['ICMP', 'DNS'].includes(e.target.value) ? '' : formData.port,
                // Reset expected status codes when switching away from HTTP
                expectedStatusCodes: e.target.value === 'HTTP' ? formData.expectedStatusCodes : [200]
              })}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {monitorTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {formData.type === 'HTTP' ? 'URL' : formData.type === 'DNS' ? 'Domain Name' : 'Target IP/Hostname'} *
            </label>
            <input
              type="text"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              placeholder={
                formData.type === 'HTTP' ? 'https://example.com' :
                formData.type === 'TCP' ? '192.168.1.100 or hostname.com' :
                formData.type === 'ICMP' ? '8.8.8.8 or hostname.com' : 'example.com'
              }
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.type === 'HTTP' ? 'URL complète du site web à surveiller' :
               formData.type === 'TCP' ? 'Adresse IP ou nom d\'hôte du serveur' :
               formData.type === 'ICMP' ? 'Adresse IP ou nom d\'hôte à pinger' :
               'Nom de domaine à résoudre'}
            </p>
          </div>

          {formData.type === 'TCP' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Port *
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                placeholder="22 (SSH), 3306 (MySQL), 5432 (PostgreSQL)..."
                min="1"
                max="65535"
                required
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Vérifie la connectivité TCP sur le port spécifié
              </p>
            </div>
          )}

          {formData.type === 'HTTP' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Expected Status Codes
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 max-h-48 overflow-y-auto bg-white dark:bg-gray-900">
                {Object.entries(
                  statusCodeOptions.reduce((acc, option) => {
                    if (!acc[option.group]) acc[option.group] = []
                    acc[option.group].push(option)
                    return acc
                  }, {} as Record<string, typeof statusCodeOptions>)
                ).map(([group, codes]) => (
                  <div key={group} className="mb-3">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{group}</div>
                    <div className="grid grid-cols-2 gap-1">
                      {codes.map(code => (
                        <label
                          key={code.value}
                          className="flex items-center text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.expectedStatusCodes.includes(code.value)}
                            onChange={() => toggleStatusCode(code.value)}
                            className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-900"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{code.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sélectionnez les codes de statut HTTP acceptés
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Check Interval
            </label>
            <select
              value={formData.interval}
              onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {intervalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Fréquence de vérification du service
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Timeout (seconds)
            </label>
            <input
              type="number"
              value={formData.timeout}
              onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) || 10 })}
              min="1"
              max="60"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.type === 'HTTP' ? 'Délai maximum pour recevoir une réponse HTTP' :
               formData.type === 'TCP' ? 'Délai maximum pour établir la connexion TCP' :
               formData.type === 'ICMP' ? 'Délai maximum pour recevoir le ping' :
               'Délai maximum pour la résolution DNS'}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Optional description..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => { onClose(); resetForm(); }}
              className="py-3 px-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`py-3 px-6 border-0 rounded-lg text-white text-sm font-medium ${loading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-black dark:bg-white dark:text-black cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-200'} transition-colors`}
            >
              {loading ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}