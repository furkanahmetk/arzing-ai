'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import RiskGauge from '@/components/RiskGauge'
import StatCard from '@/components/StatCard'
import AlertFeed from '@/components/AlertFeed'
import ValidatorMiniList from '@/components/ValidatorMiniList'
import styles from './page.module.css'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

interface NetworkStats {
  networkRisk: number        // 0-100
  activeValidators: number
  auditedContracts: number
  alertsToday: number
  avgValidatorUptime: number
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}



const THREAT_META: Record<string, { label: string; color: string; cls: string }> = {
  LOW:      { label: 'LOW',      color: 'var(--accent-green)',  cls: 'safe' },
  MEDIUM:   { label: 'MEDIUM',   color: 'var(--accent-yellow)', cls: 'warn' },
  HIGH:     { label: 'HIGH',     color: 'var(--accent-red)',    cls: 'danger' },
  CRITICAL: { label: 'CRITICAL', color: '#ff0066',              cls: 'danger' },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BACKEND}/api/network/stats`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const threat = stats ? THREAT_META[stats.threatLevel] : THREAT_META.LOW

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={`badge badge-info ${styles.heroBadge}`}>
              ⚡ Powered by Casper AI Toolkit · x402 · MCP
            </div>
            <h1 className={styles.heroTitle}>
              Autonomous Security<br />
              <span className="glow-cyan">Guardian</span> for Casper
            </h1>
            <p className={styles.heroDesc}>
              CasperGuard AI continuously audits smart contracts, monitors validator
              health, and detects network anomalies — entirely on-chain, without
              human intervention.
            </p>
            <div className={styles.heroCta}>
              <a href="/audit" className="btn btn-primary">
                🔍 Audit a Contract
              </a>
              <a href="/validators" className="btn btn-outline">
                ⚡ View Validators
              </a>
            </div>
          </div>

          {/* Live threat gauge */}
          <div className={`card ${styles.gaugeCard}`}>
            <p className="section-title">Network Threat Level</p>
            <RiskGauge score={stats?.networkRisk || 0} loading={loading} />
            {!loading && stats && (
              <div className={styles.threatBadge}>
                <span
                  className={`badge badge-${threat.cls}`}
                  style={{ fontSize: '0.9rem', padding: '8px 20px' }}
                >
                  <span style={{ animation: 'blink 1.5s infinite' }}>●</span>
                  &nbsp;{threat.label}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Stats row */}
        <section className={styles.statsRow}>
          <StatCard
            icon="🛡️"
            label="Contracts Audited"
            value={stats?.auditedContracts || 0}
            sub="on Casper Testnet"
            color="cyan"
            loading={loading}
          />
          <StatCard
            icon="⚡"
            label="Active Validators"
            value={stats?.activeValidators || 0}
            sub="monitored in real-time"
            color="green"
            loading={loading}
          />
          <StatCard
            icon="📊"
            label="Avg. Uptime"
            value={`${stats?.avgValidatorUptime || 0}%`}
            sub="last 7 eras"
            color="cyan"
            loading={loading}
          />
          <StatCard
            icon="🚨"
            label="Alerts Today"
            value={stats?.alertsToday || 0}
            sub="anomalies detected"
            color={(stats?.alertsToday || 0) > 5 ? 'red' : 'yellow'}
            loading={loading}
          />
        </section>

        {/* Bottom panels */}
        <section className={styles.bottomGrid}>
          <div className={`card ${styles.panel}`}>
            <h2 className="section-title">Live Alert Feed</h2>
            <AlertFeed limit={8} />
          </div>
          <div className={`card ${styles.panel}`}>
            <h2 className="section-title">Top Validator Risk Scores</h2>
            <ValidatorMiniList limit={7} />
          </div>
        </section>

        {/* x402 API banner */}
        <section className={`card ${styles.apiBanner}`}>
          <div className={styles.apiBannerLeft}>
            <span style={{ fontSize: '2rem' }}>⚡</span>
            <div>
              <h3 className={styles.apiBannerTitle}>x402 Pay-Per-Request Audit API</h3>
              <p className={styles.apiBannerDesc}>
                Other AI agents can autonomously purchase security audits via HTTP 402
                micropayments. No accounts, no subscriptions — agents pay per call.
              </p>
            </div>
          </div>
          <div className={styles.apiBannerCode}>
            <code className="mono">
              GET /api/audit?contract=0x…<br />
              ← 402 · 0.5 CSPR per audit<br />
              → Verification + Full Report
            </code>
          </div>
        </section>
      </main>
    </>
  )
}
