// Monitoring thresholds configuration

export interface MonitoringThreshold {
  degraded: {
    responseTime?: number  // in ms
    rtt?: number          // in ms
    latency?: number      // in ms
    packetLoss?: number   // in percentage
    jitter?: number       // in ms
    retransmissions?: number  // in percentage
    duration?: number     // duration in minutes to sustain the degraded state
  }
  down: {
    responseTime?: number
    rtt?: number
    latency?: number
    packetLoss?: number
    errorRate?: number    // in percentage (e.g., 5xx errors)
    synTimeout?: number   // in percentage
    duration?: number     // duration in minutes
  }
}

export const MONITORING_THRESHOLDS = {
  // Frontend web (HTTP/HTTPS)
  HTTP: {
    degraded: {
      responseTime: 300,    // > 300ms
      duration: 3           // sustained for 3 minutes
    },
    down: {
      responseTime: 1500,   // > 1500ms
      errorRate: 50,        // > 50% 5xx errors
      duration: 2           // over 2 minutes
    }
  },

  // Ping/ICMP (network monitoring)
  PING: {
    degraded: {
      rtt: 100              // RTT > 100ms
    },
    down: {
      rtt: 500,             // RTT > 500ms
      packetLoss: 50        // or packet loss > 50%
    }
  },

  // TCP monitoring
  TCP: {
    degraded: {
      rtt: 150,             // RTT > 150-200ms p95
      retransmissions: 2,   // retransmissions > 2%
      duration: 3           // over 3 minutes for RTT, 1 minute for retransmissions
    },
    down: {
      rtt: 600,             // RTT > 600ms p95
      synTimeout: 20,       // SYN timeout > 20%
      duration: 2           // over 2 minutes for RTT, 1 minute for SYN
    }
  },

  // UDP monitoring
  UDP: {
    degraded: {
      latency: 120,         // latency > 120-150ms p95
      jitter: 30,           // jitter > 30ms p95
      packetLoss: 3,        // packet loss > 3-5%
      duration: 3           // over 3 minutes
    },
    down: {
      latency: 500,         // latency > 500ms p95
      packetLoss: 20,       // packet loss > 20%
      duration: 2           // over 2 minutes for latency, 1 minute for packet loss
    }
  }
} as const

// Helper function to determine service status based on metrics
export function determineServiceStatus(
  protocol: keyof typeof MONITORING_THRESHOLDS,
  metrics: {
    responseTime?: number
    rtt?: number
    latency?: number
    packetLoss?: number
    errorRate?: number
    jitter?: number
    retransmissions?: number
    synTimeout?: number
  },
  sustainedMinutes?: number
): 'operational' | 'degraded' | 'down' {
  const thresholds = MONITORING_THRESHOLDS[protocol]

  if (!thresholds) {
    return 'operational'
  }

  // Check for DOWN status first
  const downThreshold = thresholds.down
  if (downThreshold) {
    // Check response time
    if (downThreshold.responseTime && metrics.responseTime !== undefined) {
      if (metrics.responseTime > downThreshold.responseTime) {
        if (!downThreshold.duration || (sustainedMinutes && sustainedMinutes >= downThreshold.duration)) {
          return 'down'
        }
      }
    }

    // Check RTT
    if (downThreshold.rtt && metrics.rtt !== undefined) {
      if (metrics.rtt > downThreshold.rtt) {
        if (!downThreshold.duration || (sustainedMinutes && sustainedMinutes >= downThreshold.duration)) {
          return 'down'
        }
      }
    }

    // Check latency
    if (downThreshold.latency && metrics.latency !== undefined) {
      if (metrics.latency > downThreshold.latency) {
        if (!downThreshold.duration || (sustainedMinutes && sustainedMinutes >= downThreshold.duration)) {
          return 'down'
        }
      }
    }

    // Check packet loss
    if (downThreshold.packetLoss && metrics.packetLoss !== undefined) {
      if (metrics.packetLoss > downThreshold.packetLoss) {
        return 'down'
      }
    }

    // Check error rate (5xx errors)
    if (downThreshold.errorRate && metrics.errorRate !== undefined) {
      if (metrics.errorRate > downThreshold.errorRate) {
        if (!downThreshold.duration || (sustainedMinutes && sustainedMinutes >= downThreshold.duration)) {
          return 'down'
        }
      }
    }

    // Check SYN timeout
    if (downThreshold.synTimeout && metrics.synTimeout !== undefined) {
      if (metrics.synTimeout > downThreshold.synTimeout) {
        return 'down'
      }
    }
  }

  // Check for DEGRADED status
  const degradedThreshold = thresholds.degraded
  if (degradedThreshold) {
    // Check response time
    if (degradedThreshold.responseTime && metrics.responseTime !== undefined) {
      if (metrics.responseTime > degradedThreshold.responseTime) {
        if (!degradedThreshold.duration || (sustainedMinutes && sustainedMinutes >= degradedThreshold.duration)) {
          return 'degraded'
        }
      }
    }

    // Check RTT
    if (degradedThreshold.rtt && metrics.rtt !== undefined) {
      if (metrics.rtt > degradedThreshold.rtt) {
        return 'degraded'
      }
    }

    // Check latency
    if (degradedThreshold.latency && metrics.latency !== undefined) {
      if (metrics.latency > degradedThreshold.latency) {
        if (!degradedThreshold.duration || (sustainedMinutes && sustainedMinutes >= degradedThreshold.duration)) {
          return 'degraded'
        }
      }
    }

    // Check jitter
    if (degradedThreshold.jitter && metrics.jitter !== undefined) {
      if (metrics.jitter > degradedThreshold.jitter) {
        return 'degraded'
      }
    }

    // Check packet loss
    if (degradedThreshold.packetLoss && metrics.packetLoss !== undefined) {
      if (metrics.packetLoss > degradedThreshold.packetLoss) {
        return 'degraded'
      }
    }

    // Check retransmissions
    if (degradedThreshold.retransmissions && metrics.retransmissions !== undefined) {
      if (metrics.retransmissions > degradedThreshold.retransmissions) {
        return 'degraded'
      }
    }
  }

  return 'operational'
}

// Helper function to check if a status affects uptime
export function statusAffectsUptime(status: 'operational' | 'degraded' | 'down'): boolean {
  // IMPORTANT: Degraded status does NOT affect uptime
  // Only 'down' status affects uptime
  return status === 'down'
}