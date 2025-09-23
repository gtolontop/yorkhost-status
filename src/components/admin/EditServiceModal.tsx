'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string | null
  url?: string | null
  isActive: boolean
  type?: string
  target?: string
  port?: number | null
  interval?: number
  timeout?: number
  expectedStatusCode?: number
  acceptedStatusCodes?: number[]
  checksBeforeDown?: number
  checksBeforeUp?: number
}


interface EditServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  service: Service
}

export default function EditServiceModal({ isOpen, onClose, onSuccess, service }: EditServiceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    isActive: true,
    type: 'HTTP',
    target: '',
    port: '',
    interval: 60,
    timeout: 10,
    expectedStatusCodes: [200],
    expectedIP: '',
    packetCount: 4,
    checksBeforeDown: 2,
    checksBeforeUp: 2
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => {
    if (isOpen && service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        url: service.url || '',
        isActive: service.isActive,
        type: service.type || 'HTTP',
        target: service.target || service.url || '',
        port: service.port?.toString() || '',
        interval: service.interval || 60,
        timeout: service.timeout ? Math.floor(service.timeout / 1000) : 10, // Convert ms to seconds
        expectedStatusCodes: service.acceptedStatusCodes || [200],
        expectedIP: '',
        packetCount: 4,
        checksBeforeDown: service.checksBeforeDown ?? 2,
        checksBeforeUp: service.checksBeforeUp ?? 2
      })
    }
  }, [isOpen, service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          url: service?.type === 'HTTP' ? formData.url : formData.url || formData.target,
          target: formData.target || formData.url,
          isActive: formData.isActive,
          port: formData.port ? parseInt(formData.port) : null,
          expectedStatusCodes: formData.type === 'HTTP' ? formData.expectedStatusCodes : undefined,
          timeout: formData.timeout,
          interval: formData.interval,
          checksBeforeDown: formData.checksBeforeDown,
          checksBeforeUp: formData.checksBeforeUp
        })
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Failed to update service')
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
            Edit Service
          </h2>
          <button
            onClick={onClose}
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
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
            />
          </div>

          {service?.type && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Monitor Type
              </label>
              <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                {service.type} Monitor
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {service?.type === 'HTTP' ? 'URL' :
               service?.type === 'DNS' ? 'Domain Name' :
               service?.type ? 'Target IP/Hostname' : 'URL'}
            </label>
            <input
              type="text"
              value={service?.type === 'HTTP' ? formData.url : formData.target}
              onChange={(e) => service?.type === 'HTTP' ?
                setFormData({ ...formData, url: e.target.value }) :
                setFormData({ ...formData, target: e.target.value })}
              placeholder={
                service?.type === 'HTTP' ? 'https://example.com' :
                service?.type === 'TCP' ? '192.168.1.100 or hostname.com' :
                service?.type === 'ICMP' ? '8.8.8.8 or hostname.com' :
                service?.type === 'DNS' ? 'example.com' :
                'https://example.com'
              }
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            {service?.type && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {service.type === 'HTTP' ? 'URL complète du site web à surveiller' :
                 service.type === 'TCP' ? 'Adresse IP ou nom d\'hôte du serveur' :
                 service.type === 'ICMP' ? 'Adresse IP ou nom d\'hôte à pinger' :
                 'Nom de domaine à résoudre'}
              </p>
            )}
          </div>

          {service?.type === 'TCP' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Port
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                placeholder="22, 3306, 5432..."
                min="1"
                max="65535"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Vérifie la connectivité TCP sur le port spécifié
              </p>
            </div>
          )}

          {(service?.type === 'HTTP' || formData.type === 'HTTP') && (
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

          {service?.type === 'DNS' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Expected IP (optional) <span className="text-xs text-orange-500">(Feature non disponible)</span>
              </label>
              <input
                type="text"
                value={formData.expectedIP || ''}
                disabled
                placeholder="192.168.1.1"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 placeholder-gray-400 dark:placeholder-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Cette fonctionnalité sera disponible prochainement
              </p>
            </div>
          )}

          {service?.type === 'ICMP' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Packet Count <span className="text-xs text-orange-500">(Feature non disponible)</span>
              </label>
              <input
                type="number"
                value={formData.packetCount || 4}
                disabled
                min="1"
                max="10"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 placeholder-gray-400 dark:placeholder-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Le nombre de paquets est actuellement fixé à 4
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Check Interval (seconds)
            </label>
            <input
              type="number"
              value={formData.interval}
              onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 60 })}
              min="30"
              max="3600"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Fréquence de vérification (30s minimum)
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
              {service?.type === 'HTTP' ? 'Délai maximum pour recevoir une réponse HTTP' :
               service?.type === 'TCP' ? 'Délai maximum pour établir la connexion TCP' :
               service?.type === 'ICMP' ? 'Délai maximum pour recevoir le ping' :
               service?.type === 'DNS' ? 'Délai maximum pour la résolution DNS' :
               'Délai maximum pour la réponse'}
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-900"
              />
              Active service
            </label>
          </div>

          {/* Monitoring Settings */}
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Monitoring Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Checks before DOWN
                </label>
                <input
                  type="number"
                  value={formData.checksBeforeDown}
                  onChange={(e) => setFormData({ ...formData, checksBeforeDown: parseInt(e.target.value) || 2 })}
                  min="1"
                  max="10"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Number of consecutive failed checks before declaring service DOWN
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Checks before UP
                </label>
                <input
                  type="number"
                  value={formData.checksBeforeUp}
                  onChange={(e) => setFormData({ ...formData, checksBeforeUp: parseInt(e.target.value) || 2 })}
                  min="1"
                  max="10"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Number of consecutive successful checks before declaring service UP
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`py-3 px-6 border-0 rounded-lg text-white text-sm font-medium ${loading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-black dark:bg-white dark:text-black cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-200'} transition-colors`}
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}