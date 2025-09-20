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

        <div className="max-w-3xl mx-auto">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-12">
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center transition-all hover:shadow-md">
              <Mail size={32} className="text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Email Support
              </h3>
              <p className="text-gray-600 mb-4">
                For general inquiries and support requests
              </p>
              <a 
                href="mailto:support@yorkhost.fr"
                className="text-primary no-underline font-medium inline-flex items-center gap-1 hover:underline"
              >
                support@yorkhost.fr
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center transition-all hover:shadow-md">
              <MessageCircle size={32} className="text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Discord Community
              </h3>
              <p className="text-gray-600 mb-4">
                Join our Discord server for community support
              </p>
              <a 
                href="https://discord.gg/yorkhost"
                target="_blank"
                rel="noopener noreferrer"
                className="text-success no-underline font-medium inline-flex items-center gap-1 hover:underline"
              >
                Join Discord
                <ExternalLink size={14} />
              </a>
            </div>

          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Emergency Contact
            </h3>
            <p className="text-gray-600 mb-4">
              For critical issues affecting your services, please contact us immediately:
            </p>
            <div className="flex items-center gap-3 bg-danger text-white px-4 py-3 rounded-md font-medium">
              <Phone size={20} />
              <span>Emergency Hotline: +33 1 XX XX XX XX</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-100 border border-gray-100 rounded-md text-sm text-gray-600">
            📍 <strong>Location:</strong> Paris, France | 
            🕒 <strong>Support Hours:</strong> Monday-Friday, 9AM-6PM CET
          </div>
        </div>
      </div>
    </Layout>
  )
}