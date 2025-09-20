'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import '../admin.css'
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Database,
  Key,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface Settings {
  general: {
    siteName: string
    siteDescription: string
    timezone: string
    language: string
  }
  monitoring: {
    defaultCheckInterval: number
    retryAttempts: number
    timeout: number
  }
  notifications: {
    emailEnabled: boolean
    discordEnabled: boolean
    slackEnabled: boolean
    webhookEnabled: boolean
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    ipWhitelist: string[]
  }
}

export default function SettingsPage() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'general' | 'monitoring' | 'notifications' | 'security'>('general')
  const [settings, setSettings] = useState<Settings>({
    general: {
      siteName: 'Yorkhost Status',
      siteDescription: 'Real-time status monitoring for Yorkhost services',
      timezone: 'Europe/Paris',
      language: 'en'
    },
    monitoring: {
      defaultCheckInterval: 300,
      retryAttempts: 3,
      timeout: 30
    },
    notifications: {
      emailEnabled: false,
      discordEnabled: true,
      slackEnabled: false,
      webhookEnabled: false
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 3600,
      ipWhitelist: []
    }
  })
  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  const apiKey = 'sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

  const handleSave = async () => {
    setLoading(true)
    setSaveMessage(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaveMessage({ type: 'success', message: 'Settings saved successfully!' })
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'Failed to save settings' })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'monitoring', label: 'Monitoring', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1>Settings</h1>
            <p>Configure your status page and monitoring preferences</p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '12px 24px',
              backgroundColor: loading ? '#9ca3af' : '#000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: saveMessage.type === 'success' ? '#dcfce7' : '#fef2f2',
            color: saveMessage.type === 'success' ? '#166534' : '#dc2626',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            {saveMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            {saveMessage.message}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '2px solid #f3f4f6',
          marginBottom: '2rem'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #000' : '2px solid transparent',
                  color: activeTab === tab.id ? '#000' : '#6b7280',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div style={{
          backgroundColor: theme === 'dark' ? '#1f2937' : 'white',
          borderRadius: '12px',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          padding: '2rem'
        }}>
          {/* General Tab */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  color: theme === 'dark' ? '#d1d5db' : '#374151'
                }}>
                  Site Name
                </label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, siteName: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: theme === 'dark' ? '#111827' : 'white',
                    color: theme === 'dark' ? '#f3f4f6' : '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  color: theme === 'dark' ? '#d1d5db' : '#374151'
                }}>
                  Site Description
                </label>
                <textarea
                  value={settings.general.siteDescription}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, siteDescription: e.target.value }
                  })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: theme === 'dark' ? '#111827' : 'white',
                    color: theme === 'dark' ? '#f3f4f6' : '#111827',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '0.5rem',
                    color: theme === 'dark' ? '#d1d5db' : '#374151'
                  }}>
                    Timezone
                  </label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, timezone: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: theme === 'dark' ? '#111827' : 'white',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                  >
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="America/New_York">America/New York</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '0.5rem',
                    color: theme === 'dark' ? '#d1d5db' : '#374151'
                  }}>
                    Language
                  </label>
                  <select
                    value={settings.general.language}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, language: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: theme === 'dark' ? '#111827' : 'white',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>

              {/* API Key Section */}
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Key size={20} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>API Key</h3>
                </div>
                <p style={{ 
                  fontSize: '14px', 
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280', 
                  marginBottom: '1rem' 
                }}>
                  Use this key to authenticate API requests
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      backgroundColor: theme === 'dark' ? '#1f2937' : 'white',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{
                      padding: '0.75rem',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                      borderRadius: '8px',
                      backgroundColor: theme === 'dark' ? '#1f2937' : 'white',
                      color: theme === 'dark' ? '#f3f4f6' : '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Monitoring Tab */}
          {activeTab === 'monitoring' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  color: theme === 'dark' ? '#d1d5db' : '#374151'
                }}>
                  Default Check Interval (seconds)
                </label>
                <input
                  type="number"
                  value={settings.monitoring.defaultCheckInterval}
                  onChange={(e) => setSettings({
                    ...settings,
                    monitoring: { ...settings.monitoring, defaultCheckInterval: parseInt(e.target.value) }
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: theme === 'dark' ? '#111827' : 'white',
                    color: theme === 'dark' ? '#f3f4f6' : '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  color: theme === 'dark' ? '#d1d5db' : '#374151'
                }}>
                  Retry Attempts
                </label>
                <input
                  type="number"
                  value={settings.monitoring.retryAttempts}
                  onChange={(e) => setSettings({
                    ...settings,
                    monitoring: { ...settings.monitoring, retryAttempts: parseInt(e.target.value) }
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: theme === 'dark' ? '#111827' : 'white',
                    color: theme === 'dark' ? '#f3f4f6' : '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  color: theme === 'dark' ? '#d1d5db' : '#374151'
                }}>
                  Request Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={settings.monitoring.timeout}
                  onChange={(e) => setSettings({
                    ...settings,
                    monitoring: { ...settings.monitoring, timeout: parseInt(e.target.value) }
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: theme === 'dark' ? '#111827' : 'white',
                    color: theme === 'dark' ? '#f3f4f6' : '#111827'
                  }}
                />
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                borderRadius: '8px'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '16px', fontWeight: 500 }}>Email Notifications</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    Send alerts via email
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailEnabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailEnabled: e.target.checked }
                    })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: settings.notifications.emailEnabled ? '#10b981' : '#d1d5db',
                    transition: '0.4s',
                    borderRadius: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '',
                      height: '16px',
                      width: '16px',
                      left: settings.notifications.emailEnabled ? '28px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '0.4s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                borderRadius: '8px'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '16px', fontWeight: 500 }}>Discord Notifications</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    Send alerts to Discord channels
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.discordEnabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, discordEnabled: e.target.checked }
                    })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: settings.notifications.discordEnabled ? '#10b981' : '#d1d5db',
                    transition: '0.4s',
                    borderRadius: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '',
                      height: '16px',
                      width: '16px',
                      left: settings.notifications.discordEnabled ? '28px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '0.4s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                borderRadius: '8px'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '16px', fontWeight: 500 }}>Two-Factor Authentication</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    Add an extra layer of security
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactorEnabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, twoFactorEnabled: e.target.checked }
                    })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: settings.security.twoFactorEnabled ? '#10b981' : '#d1d5db',
                    transition: '0.4s',
                    borderRadius: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '',
                      height: '16px',
                      width: '16px',
                      left: settings.security.twoFactorEnabled ? '28px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '0.4s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  color: theme === 'dark' ? '#d1d5db' : '#374151'
                }}>
                  Session Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: theme === 'dark' ? '#111827' : 'white',
                    color: theme === 'dark' ? '#f3f4f6' : '#111827'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}