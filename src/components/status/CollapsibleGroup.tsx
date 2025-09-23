'use client'

import { useState, useRef, useEffect } from 'react'
import { ServiceWithStats, ServiceWithEnhancedStatus } from '@/types'
import EnhancedServiceCard from './EnhancedServiceCard'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapsibleGroupProps {
  group: {
    id: string
    name: string
    description?: string
    color: string
    services: ServiceWithEnhancedStatus[]
  }
  expandedServices: Set<string>
  onToggleService: (serviceId: string) => void
  isFirst?: boolean
  isLast?: boolean
  isExpandedByDefault?: boolean
}

export default function CollapsibleGroup({
  group,
  expandedServices,
  onToggleService,
  isFirst = false,
  isLast = false,
  isExpandedByDefault = true
}: CollapsibleGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(!isExpandedByDefault)
  const [height, setHeight] = useState<number | undefined>(undefined)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (contentRef.current && !isCollapsed) {
          setHeight(contentRef.current.scrollHeight)
        }
      })
      
      resizeObserver.observe(contentRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [isCollapsed])

  useEffect(() => {
    if (contentRef.current) {
      if (isCollapsed) {
        setHeight(0)
      } else {
        setHeight(contentRef.current.scrollHeight)
      }
    }
  }, [isCollapsed])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className={`${!isLast ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
      <div 
        className="px-4 sm:px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-yorkhost-dark/50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        onClick={toggleCollapse}
      >
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-0">
            {group.name}
          </h3>
        </div>
        
        {/* Group status summary */}
        <div className="flex items-center gap-2 sm:gap-4">
          {(() => {
            const hasOutage = group.services.some(s => s.enhancedStatus === 'outage' || s.enhancedStatus === 'outage-with-incident')
            const hasDegraded = group.services.some(s => s.enhancedStatus === 'degraded')
            const hasMaintenance = group.services.some(s => s.enhancedStatus === 'maintenance')
            
            if (hasOutage) {
              return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m15 9-6 6"></path>
                    <path d="m9 9 6 6"></path>
                  </svg>
                  <span className="text-xs font-medium text-red-500">Down</span>
                </div>
              )
            } else if (hasDegraded) {
              return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <path d="M12 9v4"></path>
                    <path d="M12 17h.01"></path>
                  </svg>
                  <span className="text-xs font-medium text-yellow-500">Degraded</span>
                </div>
              )
            } else if (hasMaintenance) {
              return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  <span className="text-xs font-medium text-blue-500">Maintenance</span>
                </div>
              )
            } else {
              return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <path d="m9 11 3 3L22 4"></path>
                  </svg>
                  <span className="text-xs font-medium text-green-500">Operational</span>
                </div>
              )
            }
          })()}
          <div className="text-gray-400 transition-transform duration-200 flex-shrink-0" style={{
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
          }}>
            <ChevronDown size={20} />
          </div>
        </div>
      </div>
      
      <div 
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ height: height !== undefined ? `${height}px` : 'auto' }}
      >
        <div ref={contentRef} className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-3 sm:p-4 space-y-3">
            {group.services.map((service) => (
              <EnhancedServiceCard
                key={service.id}
                service={service}
                isExpanded={expandedServices.has(service.id)}
                onToggle={() => onToggleService(service.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}