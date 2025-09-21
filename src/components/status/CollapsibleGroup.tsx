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
}

export default function CollapsibleGroup({ 
  group, 
  expandedServices, 
  onToggleService 
}: CollapsibleGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div 
        className="px-4 sm:px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        onClick={toggleCollapse}
        style={{ borderLeft: `4px solid ${group.color}` }}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="text-gray-400 transition-transform duration-200 mt-1 sm:mt-0 flex-shrink-0" style={{
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
          }}>
            <ChevronDown size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex flex-wrap items-center gap-2">
              <span className="break-words">{group.name}</span>
              <span className="text-sm font-normal text-gray-500 whitespace-nowrap">
                ({group.services.length} service{group.services.length > 1 ? 's' : ''})
              </span>
            </h3>
            {group.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{group.description}</p>
            )}
          </div>
        </div>
        
        {/* Group status summary */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm ml-8 sm:ml-0">
          {group.services.filter(s => s.enhancedStatus === 'operational').length > 0 && (
            <span className="text-green-600 font-medium">
              {group.services.filter(s => s.enhancedStatus === 'operational').length} operational
            </span>
          )}
          {group.services.filter(s => s.enhancedStatus === 'degraded').length > 0 && (
            <span className="text-yellow-600 font-medium">
              {group.services.filter(s => s.enhancedStatus === 'degraded').length} degraded
            </span>
          )}
          {group.services.filter(s => s.enhancedStatus === 'outage').length > 0 && (
            <span className="text-red-600 font-medium">
              {group.services.filter(s => s.enhancedStatus === 'outage').length} down
            </span>
          )}
          {group.services.filter(s => s.enhancedStatus === 'outage-with-incident').length > 0 && (
            <span className="text-orange-600 font-medium">
              {group.services.filter(s => s.enhancedStatus === 'outage-with-incident').length} with incident
            </span>
          )}
          {group.services.filter(s => s.enhancedStatus === 'maintenance').length > 0 && (
            <span className="text-blue-600 font-medium">
              {group.services.filter(s => s.enhancedStatus === 'maintenance').length} maintenance
            </span>
          )}
        </div>
      </div>
      
      <div 
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ height: height !== undefined ? `${height}px` : 'auto' }}
      >
        <div ref={contentRef} className="border-t border-gray-200">
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