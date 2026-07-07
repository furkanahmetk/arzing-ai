'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import RiskGauge from '@/components/RiskGauge'
import styles from './page.module.css'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

type AuditStatus = 'idle' | 'scanning' | 'done' | 'error'

interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  title: string
  description: string
  recommendation: string
}

interface AuditResult {
  contractAddress: string
  riskScore: number
  summary: string
  findings: Finding[]
  gasOptimizations: string[]
  cep18Compliant?: boolean
  cep78Compliant?: boolean
  upgradeableRisk?: string
  auditedAt: string
  onChainTxHash?: string
  fullReportMarkdown?: string
}

const SEV_META: Record<string, { label: string; cls: string; icon: string }> = {
  critical: { label: 'CRITICAL', cls: 'danger', icon: '🔴' },
  high:     { label: 'HIGH',     cls: 'danger', icon: '🟠' },
  medium:   { label: 'MEDIUM',   cls: 'warn',   icon: '🟡' },
  low:      { label: 'LOW',      cls: 'info',   icon: '🔵' },
  info:     { label: 'INFO',     cls: 'info',   icon: 'ℹ️'  },
}

const SCAN_STEPS = [
  'Fetching contract bytecode from Casper network…',
  'Decompiling WebAssembly module…',
  'Running static analysis patterns (reentrancy, overflow, access control)…',
  'Checking CEP-18 / CEP-78 standard compliance…',
  'Analyzing upgrade authority and key weights…',
  'Running cargo-audit dependency scan…',
  'Scoring risk with AI model…',
  'Writing audit record on-chain via Odra contract…',
  'Done.',
]

export default function AuditPage() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<AuditStatus>('idle')
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState('')

  const toHexString = (bytes: Uint8Array | string) => {
    if (typeof bytes === 'string') return bytes;
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const downloadReport = () => {
    if (!result?.fullReportMarkdown) return
    const blob = new Blob([result.fullReportMarkdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-report-${result.contractAddress.substring(0, 16)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function runAudit() {
    if (!input.trim()) return
    setStatus('scanning')
    setStep(0)
    setResult(null)
    setError('')

    // Animate steps
    for (let i = 0; i < SCAN_STEPS.length - 1; i++) {
      await new Promise(r => setTimeout(r, 900 + Math.random() * 600))
      setStep(i + 1)
    }

    try {
      let headers: HeadersInit = { 'Content-Type': 'application/json' }
      let res = await fetch(`${BACKEND}/api/audit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ target: input.trim() }),
      })

      if (res.status === 402) {
        // x402 Payment Required
        const { paymentRequirements } = await res.json()
        setStatus('idle') // pause visual scanner
        
        const CasperWalletProvider = (window as any).CasperWalletProvider
        if (!CasperWalletProvider) throw new Error('Casper Wallet extension is not installed.')
        
        const provider = CasperWalletProvider()

        const isConnected = await provider.isConnected()
        if (!isConnected) throw new Error('Please connect your Casper wallet to pay for the audit.')
        
        const activePublicKey = await provider.getActivePublicKey()
        if (!activePublicKey) throw new Error('Please unlock your Casper wallet to pay for the audit.')

        const payload = {
          network: paymentRequirements.network,
          scheme: paymentRequirements.scheme,
          asset: paymentRequirements.asset,
          amount: paymentRequirements.amount,
          payee: paymentRequirements.payee || '019c347ac8fb0817aa856a85131ab08efa9366ea98d59dd3578fc52ed7826fc042',
          timestamp: Date.now(),
          nonce: Math.random().toString(36).substring(7)
        }

        const msgString = JSON.stringify(payload)
        
        let sigRes: any = null
        try {
          sigRes = await provider.signMessage(msgString, activePublicKey)
        } catch (e: any) {
          throw new Error('Payment signature rejected by user.')
        }
        
        if (!sigRes || sigRes.cancelled || sigRes.isCancelled) throw new Error('Payment signature rejected by user.')

        const finalPayload = {
          payload,
          signature: toHexString(sigRes.signature || sigRes.signatureHex || ''),
          signer: activePublicKey
        }

        headers['X-Payment'] = btoa(JSON.stringify(finalPayload))
        setStatus('scanning') // resume visual scanner

        res = await fetch(`${BACKEND}/api/audit`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ target: input.trim() }),
        })
      }

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const parsed = JSON.parse(errorText)
          throw new Error(parsed.error || parsed.details || errorText)
        } catch {
          throw new Error(errorText)
        }
      }
      
      const data: AuditResult = await res.json()
      setResult(data)
      setStatus('done')
    } catch (e: any) {
      setError(e.message || 'Audit failed')
      setStatus('error')
    }
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Smart Contract Auditor</h1>
          <p className={styles.desc}>
            Paste a Casper contract hash or GitHub repository URL. The AI agent will
            scan for vulnerabilities, check standard compliance, and record the result
            on-chain.
          </p>
        </div>

        {/* Input */}
        <div className={`card ${styles.inputCard}`}>
          <label className="section-title" htmlFor="audit-input">
            Contract Hash or GitHub Repo URL
          </label>
          <div className={styles.inputRow}>
            <input
              id="audit-input"
              className="input"
              placeholder="e.g. hash-0abc123… or https://github.com/org/repo"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && status !== 'scanning' && runAudit()}
              disabled={status === 'scanning'}
            />
            <button
              className={`btn btn-primary ${styles.auditBtn}`}
              onClick={runAudit}
              disabled={status === 'scanning' || !input.trim()}
              id="start-audit-btn"
            >
              {status === 'scanning' ? '⏳ Scanning…' : '🔍 Audit'}
            </button>
          </div>

          {/* x402 notice */}
          <p className={styles.x402Note}>
            ⚡ AI agents can call this endpoint autonomously via{' '}
            <strong>x402 micropayments</strong> — 0.5 CSPR per audit
          </p>
        </div>

        {/* Scanning progress */}
        {status === 'scanning' && (
          <div className={`card ${styles.scanCard}`}>
            <p className="section-title">🤖 AI Agent Running…</p>
            <div className={styles.steps}>
              {SCAN_STEPS.map((s, i) => (
                <div key={i} className={`${styles.stepItem} ${i <= step ? styles.stepDone : styles.stepPending}`}>
                  <span className={styles.stepIcon}>{i < step ? '✓' : i === step ? '⟳' : '○'}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className={`card ${styles.errorCard}`}>
            <span>🚨 {error || 'Audit failed — check backend connection'}</span>
          </div>
        )}

        {/* Results */}
        {status === 'done' && result && (
          <div className={styles.results}>
            {/* Score + summary */}
            <div className={`card ${styles.scoreCard}`}>
              <div className={styles.scoreLeft}>
                <h2 className={styles.contractAddr}>{result.contractAddress}</h2>
                <p className={styles.summary}>{result.summary}</p>
                <div className={styles.tags}>
                  {result.cep18Compliant && <span className="badge badge-safe">✓ CEP-18</span>}
                  {result.cep78Compliant && <span className="badge badge-safe">✓ CEP-78</span>}
                  {result.upgradeableRisk && (
                    <span className="badge badge-warn">⚠ Upgradeable: {result.upgradeableRisk}</span>
                  )}
                </div>
                {result.onChainTxHash && (
                  <p className={styles.onChain}>
                    On-chain record:{' '}
                    <a
                      href={`https://testnet.cspr.live/deploy/${result.onChainTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="glow-cyan"
                    >
                      {result.onChainTxHash.slice(0, 16)}…
                    </a>
                  </p>
                )}
                <p className={styles.auditedAt}>Audited at {result.auditedAt}</p>
              </div>
              <div className={styles.gaugeWrap}>
                <p className="section-title" style={{ textAlign: 'center' }}>Risk Score</p>
                <RiskGauge score={result.riskScore} />
              </div>
            </div>

            {/* Findings */}
            <div className={`card ${styles.findingsCard}`}>
              <h2 className="section-title">Security Findings ({result.findings.length})</h2>
              {result.findings.length === 0 ? (
                <p className={styles.noFindings}>✅ No vulnerabilities found</p>
              ) : (
                <div className={styles.findings}>
                  {result.findings.map((f, i) => {
                    const m = SEV_META[f.severity]
                    return (
                      <div key={i} className={`${styles.finding} ${styles[f.severity]}`}>
                        <div className={styles.findingHeader}>
                          <span>{m.icon}</span>
                          <span className={`badge badge-${m.cls}`}>{m.label}</span>
                          <span className={styles.findingCategory}>{f.category}</span>
                          <strong>{f.title}</strong>
                        </div>
                        <p className={styles.findingDesc}>{f.description}</p>
                        <div className={styles.findingRec}>
                          💡 <em>{f.recommendation}</em>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Gas optimizations */}
            {result.gasOptimizations.length > 0 && (
              <div className={`card ${styles.gasCard}`}>
                <h2 className="section-title">Gas Optimization Suggestions</h2>
                <ul className={styles.gasList}>
                  {result.gasOptimizations.map((g, i) => (
                    <li key={i} className={styles.gasItem}>⚙️ {g}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Comprehensive MD Report */}
            {result.fullReportMarkdown && (
              <div className={`card ${styles.reportCard}`} style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Comprehensive AI Report</h2>
                  <button className="btn btn-outline" onClick={downloadReport}>
                    ⬇️ Download Report (.md)
                  </button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {result.fullReportMarkdown}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
