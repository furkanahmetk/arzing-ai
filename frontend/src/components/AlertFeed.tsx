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

const DEMO_ALERTS: Alert[] = [
  { id: '1', level: 'warn', title: 'Validator Downtime Detected', message: 'Validator 01abc… missed 3 consecutive blocks', timestamp: '2 min ago', source: 'validator' },
  { id: '2', level: 'danger', title: 'Reentrancy Pattern Found', message: 'Contract hash-xyz exhibits recursive call risk', timestamp: '14 min ago', source: 'contract' },
  { id: '3', level: 'info', title: 'Audit Complete', message: 'Contract hash-def scored 91/100 — Safe', timestamp: '31 min ago', source: 'contract' },
  { id: '4', level: 'warn', title: 'High Commission Change', message: 'Validator 01def raised commission 2% → 8%', timestamp: '1 hr ago', source: 'validator' },
  { id: '5', level: 'info', title: 'Network Healthy', message: 'All 98 validators reporting normal activity', timestamp: '2 hr ago', source: 'network' },
]

const LEVEL_ICON: Record<string, string> = { info: 'ℹ️', warn: '⚠️', danger: '🚨' }
const SOURCE_ICON: Record<string, string> = { contract: '📋', validator: '⚡', network: '🌐' }

export default function AlertFeed({ limit = 10 }: { limit?: number }) {
  const [alerts, setAlerts] = useState<Alert[]>(DEMO_ALERTS)

  useEffect(() => {
    fetch(`${BACKEND}/api/alerts?limit=${limit}`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && d.length && setAlerts(d))
      .catch(() => {})
  }, [limit])

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
