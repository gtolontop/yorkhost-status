'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateMonitorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateMonitorModal({ isOpen, onClose, onSuccess }: CreateMonitorModalProps) {
  const [loading, setLoading] = useState(false)
  const [checkType, setCheckType] = useState('HTTP')
  const [formData, setFormData] = useState({
    name: '',
    type: 'HTTP',
    target: '',
    port: '',
    timeout: '10',
    interval: '60',
    retryAttempts: '3',
    retryInterval: '5',
    expectedStatus: '',
    expectedBody: '',
    acceptedStatusCodes: '200,201,202,203,204,301,302,303,304,307,308',
    followRedirects: true,
    sslCheck: true,
    group: 'default'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        target: formData.target,
        port: formData.port ? parseInt(formData.port) : undefined,
        timeout: parseInt(formData.timeout) * 1000, // Convert to ms
        interval: parseInt(formData.interval),
        retryAttempts: parseInt(formData.retryAttempts),
        retryInterval: parseInt(formData.retryInterval),
        expectedStatus: formData.expectedStatus ? parseInt(formData.expectedStatus) : undefined,
        expectedBody: formData.expectedBody || undefined,
        acceptedStatusCodes: formData.acceptedStatusCodes.split(',').map(code => parseInt(code.trim())).filter(code => !isNaN(code)),
        followRedirects: formData.followRedirects,
        sslCheck: formData.sslCheck,
        group: formData.group
      }

      const response = await fetch('/api/admin/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        onSuccess()
        onClose()
        setFormData({
          name: '',
          type: 'HTTP',
          target: '',
          port: '',
          timeout: '10',
          interval: '60',
          retryAttempts: '3',
          retryInterval: '5',
          expectedStatus: '',
          expectedBody: '',
          followRedirects: true,
          sslCheck: true,
          group: 'default'
        })
      } else {
        const result = await response.json()
        alert(`Erreur: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to create monitor:', error)
      alert('Erreur lors de la création du monitoring')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (type: string) => {
    setCheckType(type)
    setFormData({ ...formData, type })
    
    // Auto-fill default ports
    if (type === 'HTTP' && !formData.port) {
      setFormData({ ...formData, type, port: '80' })
    } else if (type === 'HTTPS' && !formData.port) {
      setFormData({ ...formData, type, port: '443' })
    } else if (type === 'TCP' && !formData.port) {
      setFormData({ ...formData, type, port: '' })
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Créer un monitoring</h2>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Nom *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
              placeholder="ex: Site Web Principal"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Type de check *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            >
              <option value="HTTP">HTTP</option>
              <option value="HTTPS">HTTPS</option>
              <option value="TCP">TCP</option>
              <option value="ICMP">PING (ICMP)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              {checkType === 'HTTP' || checkType === 'HTTPS' ? 'URL ou IP *' : 'IP Address *'}
            </label>
            <input
              type="text"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
              placeholder={
                checkType === 'HTTP' || checkType === 'HTTPS' 
                  ? "https://example.com ou 83.150.218.2" 
                  : "83.150.218.2"
              }
            />
          </div>

          {(checkType === 'TCP' || checkType === 'HTTP' || checkType === 'HTTPS') && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Port *
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
                placeholder="8080"
                min="1"
                max="65535"
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Timeout (sec)
              </label>
              <input
                type="number"
                value={formData.timeout}
                onChange={(e) => setFormData({ ...formData, timeout: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
                min="1"
                max="60"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Intervalle (sec)
              </label>
              <input
                type="number"
                value={formData.interval}
                onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
                min="30"
                max="3600"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Tentatives de retry
              </label>
              <input
                type="number"
                value={formData.retryAttempts}
                onChange={(e) => setFormData({ ...formData, retryAttempts: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
                min="0"
                max="10"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Intervalle de retry (sec)
              </label>
              <input
                type="number"
                value={formData.retryInterval}
                onChange={(e) => setFormData({ ...formData, retryInterval: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
                min="1"
                max="60"
              />
            </div>
          </div>

          {(checkType === 'HTTP' || checkType === 'HTTPS') && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Codes de r\u00e9ponse HTTP accept\u00e9s
                </label>
                <input
                  type="text"
                  value={formData.acceptedStatusCodes}
                  onChange={(e) => setFormData({ ...formData, acceptedStatusCodes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                  placeholder="200,201,301,302,307,308"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  S\u00e9parez les codes par des virgules. Par d\u00e9faut: 200,201,202,203,204,301,302,303,304,307,308
                </small>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Status HTTP attendu sp\u00e9cifique (optionnel)
                </label>
                <input
                  type="number"
                  value={formData.expectedStatus}
                  onChange={(e) => setFormData({ ...formData, expectedStatus: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                  placeholder="200, 301, etc."
                  min="100"
                  max="599"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Si sp\u00e9cifi\u00e9, SEUL ce code sera accept\u00e9 (remplace les codes accept\u00e9s)
                </small>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Contenu attendu dans la r\u00e9ponse (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.expectedBody}
                  onChange={(e) => setFormData({ ...formData, expectedBody: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Texte \u00e0 rechercher dans la r\u00e9ponse"
                />
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.followRedirects}
                    onChange={(e) => setFormData({ ...formData, followRedirects: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.875rem' }}>Suivre les redirections</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.sslCheck}
                    onChange={(e) => setFormData({ ...formData, sslCheck: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.875rem' }}>V\u00e9rifier le certificat SSL</span>
                </label>
              </div>
            </>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Groupe
            </label>
            <input
              type="text"
              value={formData.group}
              onChange={(e) => setFormData({ ...formData, group: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
              placeholder="default"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
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
              {loading ? 'Création...' : 'Créer le monitoring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}