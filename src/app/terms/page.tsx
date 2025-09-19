'use client'

import Layout from '@/components/layout/Layout'
import { FileText, Scale, Shield, AlertTriangle } from 'lucide-react'

export default function TermsPage() {
  return (
    <Layout>
      <div className="container">
        <div style={{ 
          maxWidth: '800px',
          margin: '0 auto',
          padding: '60px 20px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <FileText size={64} style={{ color: 'var(--color-primary)', marginBottom: '24px' }} />
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}>
              Terms of Service
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}>
              Terms and conditions for using Yorkhost services
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
                <Scale size={24} style={{ color: 'var(--color-info)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Acceptance of Terms
                </h2>
              </div>
              <p style={{ marginBottom: '16px' }}>
                By accessing and using Yorkhost services, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Shield size={24} style={{ color: 'var(--color-success)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Service Description
                </h2>
              </div>
              <p style={{ marginBottom: '16px' }}>
                Yorkhost provides web hosting, server monitoring, and status page services. Our services include:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li>Real-time service monitoring and uptime tracking</li>
                <li>Status page hosting and incident management</li>
                <li>Administrative dashboard for service management</li>
                <li>Automated notifications and alerts</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <AlertTriangle size={24} style={{ color: 'var(--color-warning)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  User Responsibilities
                </h2>
              </div>
              <p style={{ marginBottom: '16px' }}>
                You are responsible for:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring your use complies with applicable laws and regulations</li>
                <li>Not attempting to disrupt or interfere with our services</li>
                <li>Not using our services for illegal or harmful activities</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Service Availability
              </h2>
              <p style={{ marginBottom: '16px' }}>
                While we strive to maintain high availability, we do not guarantee uninterrupted service. 
                We may occasionally need to perform maintenance or updates that may temporarily affect service availability.
              </p>
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                marginBottom: '16px'
              }}>
                <strong>Service Level:</strong> We aim for 99.9% uptime but do not provide SLA guarantees for free services.
              </div>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Limitation of Liability
              </h2>
              <p style={{ marginBottom: '16px' }}>
                Yorkhost shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
                resulting from your use of the service.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Account Termination
              </h2>
              <p style={{ marginBottom: '16px' }}>
                We reserve the right to terminate or suspend your account immediately, without prior notice or liability, 
                for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
              <p style={{ marginBottom: '16px' }}>
                You may terminate your account at any time by contacting us or ceasing to use our services.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Changes to Terms
              </h2>
              <p style={{ marginBottom: '16px' }}>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Governing Law
              </h2>
              <p style={{ marginBottom: '16px' }}>
                These Terms shall be interpreted and governed by the laws of France, without regard to its conflict of law provisions.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Contact Information
              </h2>
              <p style={{ marginBottom: '16px' }}>
                If you have any questions about these Terms, please contact us:
              </p>
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <strong>Email:</strong> legal@yorkhost.com<br/>
                <strong>Address:</strong> Paris, France
              </div>
            </section>

          </div>
        </div>
      </div>
    </Layout>
  )
}