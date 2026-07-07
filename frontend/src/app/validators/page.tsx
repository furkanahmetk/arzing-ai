'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import RiskGauge from '@/components/RiskGauge'
import styles from './page.module.css'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

interface Validator {
  publicKey: string
  name?: string
  riskScore: number
  riskReasoning?: string
  uptime: number
  commission: number
  delegators: number
  selfStake: string
  totalStake: string
  eraRewardsConsistency: number
  lastSeen: string
  flags: string[]
}



type SortKey = 'riskScore' | 'uptime' | 'commission' | 'delegators'

function riskCls(s: number) { return s < 30 ? 'safe' : s < 60 ? 'warn' : 'danger' }

export default function ValidatorsPage() {
  const [validators, setValidators] = useState<Validator[]>([])
  const [sort, setSort] = useState<SortKey>('riskScore')
  const [selected, setSelected] = useState<Validator | null>(null)

  useEffect(() => {
    fetch(`${BACKEND}/api/validators?limit=50`).then(r => r.json()).then(d => Array.isArray(d) && d.length && setValidators(d)).catch(() => {})
  }, [])

  const sorted = [...validators].sort((a, b) =>
    sort === 'uptime' || sort === 'delegators' ? b[sort] - a[sort] : a[sort] - b[sort]
  )

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Validator Risk Intelligence</h1>
          <p className={styles.desc}>
            Every active validator is scored by the AI Sentinel Agent using uptime history,
            reward consistency, commission changes, and self-stake ratio.
          </p>
        </div>

        <div className={styles.layout}>
          {/* Table */}
          <div className={`card ${styles.tableCard}`}>
            {/* Sort controls */}
            <div className={styles.controls}>
              <p className="section-title" style={{ margin: 0 }}>
                {sorted.length === 0 ? 'Fetching live validator data...' : `${sorted.length} Validators Monitored`}
              </p>
              <div className={styles.sortBtns}>
                {(['riskScore', 'uptime', 'commission', 'delegators'] as SortKey[]).map(k => (
                  <button
                    key={k}
                    className={`btn btn-ghost ${sort === k ? styles.sortActive : ''}`}
                    onClick={() => setSort(k)}
                    style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                  >
                    {k === 'riskScore' ? '⚠ Risk' : k === 'uptime' ? '📊 Uptime' : k === 'commission' ? '% Fee' : '👥 Delegators'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Validator</th>
                    <th>Risk Score</th>
                    <th>Uptime</th>
                    <th>Commission</th>
                    <th>Delegators</th>
                    <th>Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(v => (
                    <tr
                      key={v.publicKey}
                      className={`${styles.row} ${selected?.publicKey === v.publicKey ? styles.rowSelected : ''}`}
                      onClick={() => setSelected(selected?.publicKey === v.publicKey ? null : v)}
                    >
                      <td>
                        <div className={styles.validatorName}>{v.name || '—'}</div>
                        <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {v.publicKey.slice(0, 20)}…
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${riskCls(v.riskScore)}`}>{v.riskScore}</span>
                      </td>
                      <td className="mono" style={{ color: v.uptime > 99 ? 'var(--accent-green)' : v.uptime > 96 ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
                        {v.uptime}%
                      </td>
                      <td className="mono">{v.commission}%</td>
                      <td className="mono">{v.delegators.toLocaleString()}</td>
                      <td>
                        <div className={styles.flags}>
                          {v.flags.map(f => (
                            <span key={f} className="tag" style={{ color: 'var(--accent-yellow)' }}>⚠ {f.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className={`card ${styles.detailCard}`}>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailName}>{selected.name || 'Unknown Validator'}</h2>
                <button className="btn btn-ghost" onClick={() => setSelected(null)} style={{ padding: '4px 8px' }}>✕</button>
              </div>
              <p className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: 16 }}>
                {selected.publicKey}
              </p>
              <RiskGauge score={selected.riskScore} size="sm" />
              
              {selected.riskReasoning && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `3px solid var(--accent-${riskCls(selected.riskScore)})` }}>
                  <p className="section-title" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>🤖 LLM Risk Reasoning</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {selected.riskReasoning}
                  </p>
                </div>
              )}

              <div className={styles.divider} />
              <div className={styles.detailRows}>
                {[
                  ['Uptime (7 eras)', `${selected.uptime}%`],
                  ['Commission', `${selected.commission}%`],
                  ['Delegators', selected.delegators.toLocaleString()],
                  ['Self Stake', selected.selfStake],
                  ['Total Stake', selected.totalStake],
                  ['Reward Consistency', `${selected.eraRewardsConsistency}%`],
                  ['Last Seen', selected.lastSeen],
                ].map(([k, v]) => (
                  <div key={k as string} className={styles.detailRow}>
                    <span className={styles.detailKey}>{k as string}</span>
                    <span className={styles.detailVal}>{v as string}</span>
                  </div>
                ))}
              </div>
              {selected.flags.length > 0 && (
                <div className={styles.flagsDetail}>
                  <p className="section-title">Risk Flags</p>
                  {selected.flags.map(f => (
                    <div key={f} className={styles.flagRow}>
                      <span>⚠️</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--accent-yellow)' }}>{f.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
              <a
                href={`https://testnet.cspr.live/validator/${selected.publicKey}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
              >
                View on CSPR.live ↗
              </a>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
