'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { UptimeData } from '@/types'
import { formatDate } from '@/lib/utils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface UptimeChartProps {
  data: UptimeData[]
}

export default function UptimeChart({ data }: UptimeChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null)

  const getBarColor = (uptime: number | null, hasMaintenance: boolean) => {
    if (hasMaintenance) return '#3b82f6' // Blue for maintenance (priority)

    // Handle null or undefined uptime
    if (uptime === null || uptime === undefined) return '#6b7280' // Gray for no data

    if (uptime >= 99.5) return '#22c55e' // Green - Success
    if (uptime >= 95) return '#f59e0b'   // Orange - Warning
    if (uptime >= 90) return '#f97316'   // Orange-red - Poor
    return '#ef4444'                     // Red - Critical
  }

  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.date)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }),
    datasets: [
      {
        label: 'Uptime %',
        data: data.map(d => d.uptime),
        backgroundColor: data.map(d => getBarColor(d.uptime, d.maintenances && d.maintenances.length > 0)),
        borderColor: data.map(d => getBarColor(d.uptime, d.maintenances && d.maintenances.length > 0)),
        borderWidth: 1,
        borderRadius: 2,
        borderSkipped: false,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '30-Day Uptime History',
        color: 'var(--text-primary)',
        font: {
          size: 14,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'var(--bg-primary)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex
            const date = new Date(data[index].date)
            return formatDate(date, 'EEEE, MMMM d, yyyy')
          },
          label: (context: any) => {
            const index = context.dataIndex
            const dayData = data[index]
            const lines = [
              `Uptime: ${dayData.uptime ? dayData.uptime.toFixed(2) : 'N/A'}%`
            ]

            if (dayData.maintenances && dayData.maintenances.length > 0) {
              lines.push(`Maintenances: ${dayData.maintenances.length}`)
              dayData.maintenances.forEach(maintenance => {
                lines.push(`• ${maintenance.title}`)
              })
            }

            if (dayData.incidents && dayData.incidents.length > 0) {
              lines.push(`Incidents: ${dayData.incidents.length}`)
              dayData.incidents.forEach(incident => {
                lines.push(`• ${incident.title}`)
              })
            }

            return lines
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: 'var(--text-tertiary)',
          font: {
            size: 11,
          },
          maxRotation: 45,
        }
      },
      y: {
        display: true,
        min: 90,
        max: 100,
        grid: {
          color: 'var(--border-light)',
          drawBorder: false,
        },
        ticks: {
          color: 'var(--text-tertiary)',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return value + '%'
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    onHover: (event: any, elements: any[]) => {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
    }
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-50 bg-gray-50 border border-gray-100 rounded-lg mt-4 text-gray-500">
        <p>No uptime data available</p>
      </div>
    )
  }

  return (
    <div className="h-[250px] p-4 bg-gray-50 border border-gray-100 rounded-lg mt-4">
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  )
}