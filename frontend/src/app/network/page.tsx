'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AlertFeed from '@/components/AlertFeed'
import styles from './page.module.css'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

interface NetworkHealth {
  activeValidators: number
  totalStake: string
  eraId: number
  blockHeight: number
  networkRisk: number
  tps: number
  pendingDeploys: number
  anomaliesDetected: number
}

const DEMO: NetworkHealth = {
  activeValidators: 98, totalStake: '12.4B CSPR', eraId: 17842,
  blockHeight: 4218950, networkRisk: 24, tps: 47, pendingDeploys: 12, anomaliesDetected: 2,
}

export default function NetworkPage() {
  const [health, setHealth] = useState<NetworkHealth | null>(null)

  useEffect(() => {
    const load = () =>
      fetch(`${BACKEND}/api/network/health`).then(r => r.json()).then(setHealth).catch(() => {})
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [])

  const metrics = [
    { label: 'Current Era', value: `#${health.eraId}`, icon: '🔄', color: 'cyan' },
    { label: 'Block Height', value: health.blockHeight.toLocaleString(), icon: '📦', color: 'cyan' },
    { label: 'Active Validators', value: health.activeValidators, icon: '⚡', color: 'green' },
    { label: 'Total Stake', value: health.totalStake, icon: '🏦', color: 'green' },
    { label: 'Transactions/sec', value: health.tps, icon: '📊', color: 'cyan' },
    { label: 'Pending Deploys', value: health.pendingDeploys, icon: '⏳', color: 'yellow' },
    { label: 'Anomalies Detected', value: health.anomaliesDetected, icon: '🚨', color: health.anomaliesDetected > 0 ? 'red' : 'green' },
    { label: 'Network Risk Score', value: health.networkRisk, icon: '🛡️', color: health.networkRisk < 30 ? 'green' : health.networkRisk < 60 ? 'yellow' : 'red' },
  ]

  if (!health) return <div style={{color:'white', padding:'50px', textAlign:'center'}}>Loading network intelligence...</div>

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Network Intelligence</h1>
          <p className={styles.desc}>
            Real-time Casper Network health monitoring via CSPR.cloud Streaming API.
            Anomalies are detected by the AI Sentinel Agent and surfaced instantly.
          </p>
          <div className={styles.liveTag}>
            <span className={styles.liveDot} /> LIVE — updates every 15s
          </div>
        </div>

        {/* Metric grid */}
        <div className={styles.metricGrid}>
          {metrics.map(m => (
            <div key={m.label} className={`card ${styles.metricCard}`}>
              <span className={styles.metricIcon}>{m.icon}</span>
              <span className={`${styles.metricValue} ${styles[m.color]}`}>{m.value}</span>
              <span className={styles.metricLabel}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Agent status + alerts */}
        <div className={styles.bottomGrid}>
          <div className={`card ${styles.agentCard}`}>
            <h2 className="section-title">Sentinel Agent Status</h2>
            <div className={styles.agentRows}>
              {[
                { name: 'Validator Monitor', status: 'running', detail: 'Polling 98 validators every 60s' },
                { name: 'Anomaly Detector', status: 'running', detail: 'SSE stream active · 0 drops' },
                { name: 'Contract Auditor', status: 'idle', detail: 'Waiting for next submission' },
                { name: 'x402 Server', status: 'running', detail: 'Accepting micropayments on :4001' },
                { name: 'On-chain Reporter', status: 'running', detail: 'Last write: 14 min ago' },
              ].map(a => (
                <div key={a.name} className={styles.agentRow}>
                  <span className={`${styles.agentDot} ${a.status === 'running' ? styles.dotGreen : styles.dotGray}`} />
                  <div>
                    <div className={styles.agentName}>{a.name}</div>
                    <div className={styles.agentDetail}>{a.detail}</div>
                  </div>
                  <span className={`badge ${a.status === 'running' ? 'badge-safe' : 'badge-info'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`card ${styles.alertPanel}`}>
            <h2 className="section-title">Network Alert Feed</h2>
            <AlertFeed limit={10} />
          </div>
        </div>
      </main>
    </>
  )
}
