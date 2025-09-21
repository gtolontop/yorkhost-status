import { getDownServices } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, AlertCircle, Clock, Activity, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DownServicesPage() {
  const downData = await getDownServices()
  const hasDownServices = downData.totalDown > 0

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Services Currently Down</h1>
        <p className="text-muted-foreground">
          Real-time overview of all services experiencing outages
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Down</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downData.totalDown}</div>
            <p className="text-xs text-muted-foreground">
              Services currently experiencing issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Without Incidents</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {downData.withoutIncident.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Major outages requiring incident reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Incidents</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {downData.withIncident.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Acknowledged with active incidents
            </p>
          </CardContent>
        </Card>
      </div>

      {!hasDownServices && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">All Systems Operational</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Great news! All services are currently operating normally.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Services without incidents (major outages) */}
      {downData.withoutIncident.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Major Outages (No Incident Linked)
          </h2>
          <div className="grid gap-4">
            {downData.withoutIncident.map((service) => (
              <Card key={service.id} className="border-destructive/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 bg-destructive rounded-full animate-pulse" />
                      <CardTitle className="text-lg">
                        {service.name}
                        {service.machine && (
                          <span className="text-sm text-muted-foreground ml-2">
                            on {service.machine.name}
                          </span>
                        )}
                      </CardTitle>
                    </div>
                    <Badge variant="destructive">DOWN</Badge>
                  </div>
                  {service.description && (
                    <CardDescription>{service.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium">Requires Incident Report</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Check:</span>
                      <span className="font-medium">
                        {service.lastCheck ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(service.lastCheck), { addSuffix: true })}
                          </span>
                        ) : (
                          'Never'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">24h Uptime:</span>
                      <span className="font-medium">
                        {service.uptimePercent24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Response Time:</span>
                      <span className="font-medium">
                        {service.averageResponseTime > 0 
                          ? `${Math.round(service.averageResponseTime)}ms` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link 
                      href={`/admin/incidents/new?serviceId=${service.id}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Create Incident Report
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Services with incidents (acknowledged outages) */}
      {downData.withIncident.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Acknowledged Outages (With Active Incidents)
          </h2>
          <div className="grid gap-4">
            {downData.withIncident.map((service) => (
              <Card key={service.id} className="border-orange-600/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 bg-orange-600 rounded-full animate-pulse" />
                      <CardTitle className="text-lg">
                        {service.name}
                        {service.machine && (
                          <span className="text-sm text-muted-foreground ml-2">
                            on {service.machine.name}
                          </span>
                        )}
                      </CardTitle>
                    </div>
                    <Badge className="bg-orange-600 text-white">DOWN - ACKNOWLEDGED</Badge>
                  </div>
                  {service.description && (
                    <CardDescription>{service.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Active Incident:</span>
                      <span className="font-medium">{service.activeIncident?.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Incident Status:</span>
                      <Badge variant="outline" className="text-xs">
                        {service.activeIncident?.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Started:</span>
                      <span className="font-medium">
                        {service.activeIncident?.startTime ? (
                          formatDistanceToNow(new Date(service.activeIncident.startTime), { addSuffix: true })
                        ) : (
                          'Unknown'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">24h Uptime:</span>
                      <span className="font-medium">
                        {service.uptimePercent24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {service.activeIncident && (
                    <div className="mt-4 pt-4 border-t">
                      <Link 
                        href={`/incident/${service.activeIncident.slug || service.activeIncident.id}`}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View Incident Details
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-muted-foreground">
        Last updated: {formatDistanceToNow(new Date(downData.lastUpdated), { addSuffix: true })}
      </div>
    </div>
  )
}