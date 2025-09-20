'use client'

import Layout from '@/components/layout/Layout'
import PageHeader from '@/components/ui/PageHeader'
import { Calendar, Clock, Settings } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <Layout>
      <div className="container">
        <PageHeader
          icon={<Settings size={96} />}
          title="Scheduled Maintenance"
          subtitle="All planned maintenance windows and system updates for Yorkhost services"
        />

        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-left mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar size={20} className="text-info" />
              <h3 className="text-lg font-semibold text-gray-900">
                No Scheduled Maintenance
              </h3>
            </div>
            <p className="text-gray-600 mb-3">
              There are currently no scheduled maintenance windows. We will notify users in advance of any planned maintenance.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              <span>All maintenance is performed during low-traffic hours</span>
            </div>
          </div>

          <div className="bg-gray-100 border border-gray-100 rounded-md p-4 text-sm text-gray-600">
            💡 <strong>Tip:</strong> Subscribe to our status updates to receive notifications about scheduled maintenance and incidents.
          </div>
        </div>
      </div>
    </Layout>
  )
}