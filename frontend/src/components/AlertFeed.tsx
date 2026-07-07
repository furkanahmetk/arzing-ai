'use client'
import { useEffect, useState } from 'react'
import styles from './AlertFeed.module.css'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

interface Alert {
  id: string
  level: 'info' | 'warn' | 'danger'
  title: string
  message: string
  timestamp: string
  source: 'contract' | 'validator' | 'network'
}

const LEVEL_ICON: Record<string, string> = { info: 'ℹ️', warn: '⚠️', danger: '🚨' }
const SOURCE_ICON: Record<string, string> = { contract: '📋', validator: '⚡', network: '🌐' }

export default function AlertFeed({ limit = 10 }: { limit?: number }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BACKEND}/api/alerts?limit=${limit}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setAlerts(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [limit])

  if (loading) return <div style={{ opacity: 0.5 }}>Loading network intelligence feed...</div>
  if (alerts.length === 0) return <div style={{ opacity: 0.5 }}>No anomalies detected recently.</div>

  return (
    <div className={styles.feed}>
      {alerts.slice(0, limit).map(a => (
        <div key={a.id} className={`${styles.item} ${styles[a.level]}`}>
          <span className={styles.levelIcon}>{LEVEL_ICON[a.level]}</span>
          <div className={styles.body}>
            <div className={styles.title}>
              {SOURCE_ICON[a.source]} {a.title}
            </div>
            <div className={styles.message}>{a.message}</div>
          </div>
          <span className={styles.time}>{a.timestamp}</span>
        </div>
      ))}
    </div>
  )
}
