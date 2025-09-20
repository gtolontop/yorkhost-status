'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import '../admin.css'
import { 
  Bell, 
  Search, 
  Filter,
  Plus,
  Mail,
  MessageSquare,
  Webhook,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react'

interface NotificationChannel {
  id: string
  name: string
  type: 'email' | 'discord' | 'webhook' | 'slack'
  config: any
  isActive: boolean
  createdAt: string
  lastUsed?: string
  testStatus?: 'success' | 'failed' | 'pending'
}

interface NotificationRule {
  id: string
  name: string
  trigger: 'service_down' | 'service_up' | 'incident_created' | 'incident_resolved'
  channels: string[]
  isActive: boolean
  conditions: any
  createdAt: string
}

export default function NotificationsPage() {
  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'channels' | 'rules'>('channels')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      // For now, we'll use mock data since the API doesn't exist yet
      setChannels([
        {
          id: '1',
          name: 'Discord Alerts',
          type: 'discord',
          config: { webhookUrl: 'https://discord.com/api/webhooks/...' },
          isActive: true,
          createdAt: new Date().toISOString(),
          lastUsed: new Date(Date.now() - 86400000).toISOString(),
          testStatus: 'success'
        },
        {
          id: '2', 
          name: 'Email Notifications',
          type: 'email',
          config: { recipients: ['admin@example.com'] },
          isActive: false,
          createdAt: new Date().toISOString(),
          testStatus: 'failed'
        }
      ])
      
      setRules([
        {
          id: '1',
          name: 'Service Down Alert',
          trigger: 'service_down',
          channels: ['1'],
          isActive: true,
          conditions: { severity: 'high' },
          createdAt: new Date().toISOString()
        }
      ])
    } catch (error) {
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail size={16} />
      case 'discord':
        return <MessageSquare size={16} />
      case 'webhook':
        return <Webhook size={16} />
      case 'slack':
        return <MessageSquare size={16} />
      default:
        return <Bell size={16} />
    }
  }

  const getChannelColor = (type: string) => {
    switch (type) {
      case 'email':
        return '#3b82f6'
      case 'discord':
        return '#5865f2'
      case 'webhook':
        return '#6b7280'
      case 'slack':
        return '#4a154b'
      default:
        return '#6b7280'
    }
  }

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'service_down':
        return 'Service Down'
      case 'service_up':
        return 'Service Restored'
      case 'incident_created':
        return 'Incident Created'
      case 'incident_resolved':
        return 'Incident Resolved'
      default:
        return trigger
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page">
          <div className="page-header">
            <div>
              <h1>Notifications</h1>
              <p>Alert channels and rules</p>
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
          }}>
            <div>Loading notifications...</div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1>Notifications</h1>
            <p>Alert channels and rules</p>
          </div>
        </div>
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ 
          borderBottom: '2px solid #f3f4f6',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <button
              onClick={() => setActiveTab('channels')}
              style={{
                padding: '1rem 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'channels' ? '2px solid #000' : '2px solid transparent',
                color: activeTab === 'channels' ? '#000' : '#6b7280',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Channels ({channels.length})
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              style={{
                padding: '1rem 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'rules' ? '2px solid #000' : '2px solid transparent',
                color: activeTab === 'rules' ? '#000' : '#6b7280',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Rules ({rules.length})
            </button>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flex: 1,
            maxWidth: '400px'
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={20} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }}
              />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '12px 16px',
              backgroundColor: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'not-allowed',
              opacity: 0.5
            }}
            disabled
          >
            <Plus size={16} />
            Add {activeTab === 'channels' ? 'Channel' : 'Rule'}
          </button>
        </div>

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
              padding: '1rem 1.5rem',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>Channel</div>
              <div>Type</div>
              <div>Status</div>
              <div>Last Used</div>
              <div>Test</div>
              <div></div>
            </div>

            {channels.map((channel) => (
              <div
                key={channel.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: getChannelColor(channel.type),
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    {getChannelIcon(channel.type)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>
                      {channel.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Created {formatDate(channel.createdAt)}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f3f4f6',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  width: 'fit-content'
                }}>
                  {getChannelIcon(channel.type)}
                  {channel.type}
                </div>

                <div>
                  <span
                    style={{
                      background: channel.isActive ? '#dcfce7' : '#fef2f2',
                      color: channel.isActive ? '#166534' : '#dc2626',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    {channel.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {channel.lastUsed ? formatDate(channel.lastUsed) : 'Never'}
                </div>

                <div>
                  {channel.testStatus && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: channel.testStatus === 'success' ? '#dcfce7' : '#fef2f2',
                        color: channel.testStatus === 'success' ? '#166534' : '#dc2626',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      {channel.testStatus === 'success' ? (
                        <CheckCircle size={10} />
                      ) : (
                        <XCircle size={10} />
                      )}
                      {channel.testStatus}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    style={{
                      padding: '6px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white',
                      color: '#6b7280',
                      cursor: 'not-allowed',
                      opacity: 0.5
                    }}
                    disabled
                  >
                    <Send size={14} />
                  </button>
                  <button
                    style={{
                      padding: '6px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white',
                      color: '#6b7280',
                      cursor: 'not-allowed',
                      opacity: 0.5
                    }}
                    disabled
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
              padding: '1rem 1.5rem',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>Rule</div>
              <div>Trigger</div>
              <div>Channels</div>
              <div>Status</div>
              <div></div>
            </div>

            {rules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    {rule.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Created {formatDate(rule.createdAt)}
                  </div>
                </div>

                <div style={{
                  background: '#f3f4f6',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  width: 'fit-content'
                }}>
                  {getTriggerLabel(rule.trigger)}
                </div>

                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {rule.channels.length} channel{rule.channels.length !== 1 ? 's' : ''}
                </div>

                <div>
                  <span
                    style={{
                      background: rule.isActive ? '#dcfce7' : '#fef2f2',
                      color: rule.isActive ? '#166534' : '#dc2626',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    style={{
                      padding: '6px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white',
                      color: '#6b7280',
                      cursor: 'not-allowed',
                      opacity: 0.5
                    }}
                    disabled
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Message */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#0c4a6e'
        }}>
          <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
            Notification System Coming Soon
          </div>
          <div>
            The notification system is currently in development. You'll be able to set up email, Discord, Slack, and webhook notifications for service outages and incidents.
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}