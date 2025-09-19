'use client'

import Layout from '@/components/layout/Layout'
import PageHeader from '@/components/ui/PageHeader'
import { Mail, MessageCircle, Phone, ExternalLink } from 'lucide-react'

export default function ContactPage() {
  return (
    <Layout>
      <div className="container">
        <PageHeader
          icon={<MessageCircle size={96} />}
          title="Get in Touch"
          subtitle="Need help or have questions about our services? We're here to help."
        />

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gap: '24px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            marginBottom: '48px'
          }}>
            
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              textAlign: 'center',
              transition: 'var(--transition-all)'
            }}>
              <Mail size={32} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Email Support
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                For general inquiries and support requests
              </p>
              <a 
                href="mailto:support@yorkhost.com"
                style={{
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                support@yorkhost.com
                <ExternalLink size={14} />
              </a>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              textAlign: 'center',
              transition: 'var(--transition-all)'
            }}>
              <MessageCircle size={32} style={{ color: 'var(--color-success)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Discord Community
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Join our Discord server for community support
              </p>
              <a 
                href="https://discord.gg/yorkhost"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--color-success)',
                  textDecoration: 'none',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Join Discord
                <ExternalLink size={14} />
              </a>
            </div>

          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Emergency Contact
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              For critical issues affecting your services, please contact us immediately:
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              background: 'var(--color-danger)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontWeight: '500'
            }}>
              <Phone size={20} />
              <span>Emergency Hotline: +33 1 XX XX XX XX</span>
            </div>
          </div>

          <div style={{
            marginTop: '32px',
            padding: '16px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            📍 <strong>Location:</strong> Paris, France | 
            🕒 <strong>Support Hours:</strong> Monday-Friday, 9AM-6PM CET
          </div>
        </div>
      </div>
    </Layout>
  )
}