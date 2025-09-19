'use client'

import Layout from '@/components/layout/Layout'
import { Shield, Eye, Database, Users } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="container">
        <div style={{ 
          maxWidth: '800px',
          margin: '0 auto',
          padding: '60px 20px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Shield size={64} style={{ color: 'var(--color-primary)', marginBottom: '24px' }} />
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}>
              Privacy Policy
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}>
              How we collect, use, and protect your information
            </p>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-tertiary)',
              marginTop: '16px'
            }}>
              Last updated: December 19, 2024
            </div>
          </div>

          <div style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
            
            <section style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Eye size={24} style={{ color: 'var(--color-info)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Information We Collect
                </h2>
              </div>
              <p style={{ marginBottom: '16px' }}>
                We collect information you provide directly to us, such as when you create an account, 
                contact us for support, or use our services.
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li>Discord account information (username, avatar, user ID)</li>
                <li>Email address (if provided)</li>
                <li>Service usage data and monitoring information</li>
                <li>System performance and uptime metrics</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Database size={24} style={{ color: 'var(--color-success)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  How We Use Your Information
                </h2>
              </div>
              <p style={{ marginBottom: '16px' }}>
                We use the information we collect to provide, maintain, and improve our services:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li>Authenticate users and manage access to admin features</li>
                <li>Monitor service availability and performance</li>
                <li>Send notifications about incidents and maintenance</li>
                <li>Analyze usage patterns to improve our services</li>
                <li>Respond to user inquiries and provide customer support</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Shield size={24} style={{ color: 'var(--color-warning)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Data Protection
                </h2>
              </div>
              <p style={{ marginBottom: '16px' }}>
                We implement appropriate security measures to protect your personal information:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li>Data encryption in transit and at rest</li>
                <li>Secure authentication using Discord OAuth</li>
                <li>Regular security audits and monitoring</li>
                <li>Limited access to personal data on a need-to-know basis</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Users size={24} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Your Rights
                </h2>
              </div>
              <p style={{ marginBottom: '16px' }}>
                You have the right to:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of non-essential communications</li>
                <li>Request data portability</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Third-Party Services
              </h2>
              <p style={{ marginBottom: '16px' }}>
                We use certain third-party services to operate our platform:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li><strong>Discord:</strong> For user authentication and identification</li>
                <li><strong>Vercel:</strong> For hosting and deployment infrastructure</li>
                <li><strong>PostgreSQL:</strong> For secure data storage</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Contact Us
              </h2>
              <p style={{ marginBottom: '16px' }}>
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us at:
              </p>
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <strong>Email:</strong> privacy@yorkhost.com<br/>
                <strong>Discord:</strong> Join our community server
              </div>
            </section>

          </div>
        </div>
      </div>
    </Layout>
  )
}