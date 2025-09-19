'use client'

import Layout from '@/components/layout/Layout'
import { Calendar, Clock, Settings } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <Layout>
      <div className="container">
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <Settings size={64} style={{ color: 'var(--color-warning)', marginBottom: '24px' }} />
          
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}>
            Scheduled Maintenance
          </h1>
          
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            marginBottom: '48px',
            lineHeight: '1.6'
          }}>
            All planned maintenance windows and system updates for Yorkhost services.
          </p>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            textAlign: 'left',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Calendar size={20} style={{ color: 'var(--color-info)' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                No Scheduled Maintenance
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              There are currently no scheduled maintenance windows. We will notify users in advance of any planned maintenance.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              <Clock size={16} />
              <span>All maintenance is performed during low-traffic hours</span>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            💡 <strong>Tip:</strong> Subscribe to our status updates to receive notifications about scheduled maintenance and incidents.
          </div>
        </div>
      </div>
    </Layout>
  )
}