'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './ValidatorMiniList.module.css'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

interface ValidatorRow {
  publicKey: string
  name?: string
  riskScore: number
  uptime: number
  commission: number
}

const DEMO: ValidatorRow[] = [
  { publicKey: '01aa…f1', name: 'CasperLabs', riskScore: 8, uptime: 99.9, commission: 2 },
  { publicKey: '01bb…c3', name: 'Everstake', riskScore: 12, uptime: 99.7, commission: 3 },
  { publicKey: '01cc…d4', riskScore: 34, uptime: 97.1, commission: 5 },
  { publicKey: '01dd…e5', name: 'Figment', riskScore: 9, uptime: 99.8, commission: 2 },
  { publicKey: '01ee…f6', riskScore: 61, uptime: 94.2, commission: 10 },
  { publicKey: '01ff…a7', riskScore: 18, uptime: 99.1, commission: 4 },
  { publicKey: '01gg…b8', riskScore: 77, uptime: 91.0, commission: 15 },
]

function riskClass(s: number) { return s < 30 ? 'safe' : s < 60 ? 'warn' : 'danger' }

export default function ValidatorMiniList({ limit = 7 }: { limit?: number }) {
  const [validators, setValidators] = useState<ValidatorRow[]>(DEMO)

  useEffect(() => {
    fetch(`${BACKEND}/api/validators?limit=${limit}&sort=riskScore`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && d.length && setValidators(d))
      .catch(() => {})
  }, [limit])

  return (
    <div className={styles.list}>
      {validators.slice(0, limit).map(v => (
        <div key={v.publicKey} className={styles.row}>
          <div className={styles.key}>
            <span className="mono">{v.name || v.publicKey}</span>
            {v.name && <span className="tag">{v.publicKey}</span>}
          </div>
          <div className={styles.meta}>
            <span className={styles.uptime}>{v.uptime}%</span>
            <span className={`badge badge-${riskClass(v.riskScore)}`}>Risk {v.riskScore}</span>
          </div>
        </div>
      ))}
      <Link href="/validators" className={styles.seeAll}>View all validators →</Link>
    </div>
  )
}
