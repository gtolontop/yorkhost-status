'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import '../admin.css'
import { 
  Search, 
  MoreVertical, 
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  User,
  Mail,
  Calendar,
  ExternalLink
} from 'lucide-react'

interface User {
  id: string
  username: string
  email?: string
  avatarUrl?: string
  discordId: string
  roles: string[]
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const result = await response.json()
      
      if (result.success) {
        setUsers(result.data)
      } else {
        setError(result.error || 'Failed to fetch users')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'owner':
        return '#ef4444'
      case 'moderator':
        return '#f59e0b'
      case 'member':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page">
          <div className="page-header">
            <div>
              <h1>Users</h1>
              <p>Access management</p>
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
          }}>
            <div>Loading users...</div>
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
            <h1>Users</h1>
            <p>Access management</p>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
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
                placeholder="Search users..."
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

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Total: {users.length} users
          </div>
        </div>

        {/* Users Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '3fr 2fr 2fr 1fr 1fr auto',
            padding: '1rem 1.5rem',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '12px',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div>User</div>
            <div>Roles</div>
            <div>Joined</div>
            <div>Last Login</div>
            <div>Status</div>
            <div></div>
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <User size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '0.5rem' }}>
                No users found
              </div>
              <div style={{ fontSize: '14px' }}>
                {searchTerm ? 'Try adjusting your search terms' : 'No users are currently registered'}
              </div>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 2fr 2fr 1fr 1fr auto',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                  alignItems: 'center'
                }}
              >
                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <User size={20} color="#6b7280" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>
                      {user.username}
                    </div>
                    {user.email && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Mail size={12} />
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Roles */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {user.roles.map((role, index) => (
                    <span
                      key={index}
                      style={{
                        background: getRoleBadgeColor(role),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {role === 'admin' || role === 'owner' ? (
                        <ShieldCheck size={10} />
                      ) : (
                        <Shield size={10} />
                      )}
                      {role}
                    </span>
                  ))}
                </div>

                {/* Joined Date */}
                <div style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Calendar size={14} />
                  {formatDate(user.createdAt)}
                </div>

                {/* Last Login */}
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                </div>

                {/* Status */}
                <div>
                  <span
                    style={{
                      background: user.isActive ? '#dcfce7' : '#fef2f2',
                      color: user.isActive ? '#166534' : '#dc2626',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <a
                    href={`https://discord.com/users/${user.discordId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      color: '#6b7280',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="View Discord Profile"
                  >
                    <ExternalLink size={14} />
                  </a>
                  
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
                    title="User management coming soon"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

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
            User Management Information
          </div>
          <div>
            Users are automatically created when they log in via Discord OAuth. 
            Role management and user permissions will be available in a future update.
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}