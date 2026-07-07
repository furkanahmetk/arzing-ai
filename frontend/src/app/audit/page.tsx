'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import RiskGauge from '@/components/RiskGauge';
import styles from './page.module.css';
// @ts-ignore
import { DeployUtil, CLPublicKey } from 'casper-js-sdk';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
const FEE_WALLET = process.env.NEXT_PUBLIC_FEE_WALLET_ADDRESS || '0163d8A06Bab82776ec0fA0b38F1306e4E6a944468609AdF5c0F8F5Ad592Ef5d63';

interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  recommendation: string;
}

interface AuditResult {
  score: number;
  recommendation: string;
  findings: Finding[];
  financials?: {
    collected?: number;
    actualSpent?: number;
    refunded?: number;
    profitMargin?: number;
  };
  hashes?: {
    initialPaymentHash?: string;
    registryHash?: string;
  };
  fullReportMarkdown?: string;
}

export default function AuditPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [activeAccount, setActiveAccount] = useState<{ address: string, provider: string } | null>(null);
  const [feeEstimate, setFeeEstimate] = useState<{ amount: number, message: string } | null>(null);

  useEffect(() => {
    const syncAccount = async () => {
      const CasperWalletProvider = (window as any).CasperWalletProvider;
      if (!CasperWalletProvider) return;
      const provider = CasperWalletProvider();
      try {
        const isConnected = await provider.isConnected();
        if (isConnected) {
          const address = await provider.getActivePublicKey();
          if (address) {
            setActiveAccount({ address, provider: 'Casper Wallet' });
            return;
          }
        }
        setActiveAccount(null);
      } catch (e) {
        setActiveAccount(null);
      }
    };

    setTimeout(syncAccount, 500);
    const interval = setInterval(syncAccount, 3000);

    window.addEventListener('casper-wallet:activeKeyChanged', syncAccount);
    window.addEventListener('casper-wallet:disconnected', syncAccount);
    window.addEventListener('casper-wallet:connected', syncAccount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('casper-wallet:activeKeyChanged', syncAccount);
      window.removeEventListener('casper-wallet:disconnected', syncAccount);
      window.removeEventListener('casper-wallet:connected', syncAccount);
    };
  }, []);

  const estimateFee = async () => {
    if (!activeAccount) {
      alert("Please connect your Casper Wallet first!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/audit/estimate-fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: url }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFeeEstimate({ amount: data.estimatedFee, message: data.message });
    } catch (err: any) {
      alert(`Fee estimation failed: ${err.message}`);
    }
    setLoading(false);
  };

  const startInvestigation = async () => {
    if (!activeAccount) {
      alert("Please connect your Casper Wallet first!");
      return;
    }
    if (!feeEstimate) return;

    setLoading(true);
    setLogs([]);
    setResult(null);

    try {
      logs.push(`💸 User: Requesting signature for ${feeEstimate.amount} CSPR Audit fee...`);
      setLogs([...logs]);
      const deployParams = new DeployUtil.DeployParams(
        CLPublicKey.fromHex(activeAccount.address),
        'casper-test',
        1,
        1800000 // 30 minutes TTL
      );

      const amount = feeEstimate.amount * 1_000_000_000;
      const transferDeployItem = DeployUtil.ExecutableDeployItem.newTransfer(
        amount,
        CLPublicKey.fromHex(FEE_WALLET),
        null,
        1 // id
      );

      const payment = DeployUtil.standardPayment(100_000_000); 
      const deploy = DeployUtil.makeDeploy(deployParams, transferDeployItem, payment);
      const deployJson = DeployUtil.deployToJson(deploy);

      const sendResult = await (window as any).csprclick.send(deployJson, activeAccount.address);
      
      if (!sendResult || sendResult.cancelled || !sendResult.deployHash) {
        throw new Error("Transaction was cancelled by user.");
      }

      const deployHash = sendResult.deployHash;
      logs.push(`✅ User: Fee transaction authorized! TX: ${deployHash.substring(0, 16)}...`);
      setLogs([...logs]);

      const res = await fetch(`${BACKEND}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: url, deployHash, userAddress: activeAccount.address, estimatedFee: feeEstimate.amount }),
      });
      
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Render streaming logs
      let currentLogs = [...logs];
      for (let i = 0; i < data.logs.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        currentLogs.push(data.logs[i]);
        setLogs([...currentLogs]);
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Map backend AuditResult to frontend representation
      const backendRes = data.result;
      setResult({
        score: backendRes.riskScore,
        recommendation: backendRes.riskScore < 30 ? 'SAFE' : backendRes.riskScore < 60 ? 'REVIEW RECOMMENDED' : 'DO NOT DEPLOY',
        findings: backendRes.findings,
        financials: backendRes.financials,
        hashes: backendRes.hashes,
        fullReportMarkdown: backendRes.fullReportMarkdown
      });

    } catch (err: any) {
      logs.push(`❌ ERROR: ${err.message}`);
      setLogs([...logs]);
    }

    setLoading(false);
  };

  const getLogClass = (log: string): string => {
    if (log.includes('Agent:')) return 'action';
    if (log.includes('User:')) return 'thought';
    if (log.includes('ERROR:')) return 'observation';
    return 'system';
  };

  const downloadReport = () => {
    if (!result?.fullReportMarkdown) return;
    const blob = new Blob([result.fullReportMarkdown], { type: 'text/markdown' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `casperguard-audit-${url.substring(0, 16)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <>
      <Navbar />
      <main style={{ flex: 1, padding: '32px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '36px', fontWeight: 800, marginBottom: '8px',
            background: 'linear-gradient(135deg, var(--text-primary), var(--accent-cyan))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Smart Contract Auditor
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
            Paste a Casper contract hash or GitHub repository URL. The AI agent will scan for vulnerabilities, check standard compliance, and record the result on-chain via x402.
          </p>
        </div>

        {/* Input Panel */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'rgba(10, 14, 23, 0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ color: 'var(--accent-cyan)', fontSize: '14px', fontWeight: 600 }}>▸</span>
            <h2 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
              Target Specification
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              className="input"
              style={{ flex: 1 }}
              type="text"
              placeholder="e.g. hash-0abc123... or https://github.com/org/repo"
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setUrl(e.target.value); setFeeEstimate(null); }}
            />
          </div>

          {feeEstimate && (
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.2)', color: 'var(--text-primary)', fontSize: '13px' }}>
              <div style={{ color: 'var(--accent-cyan)' }}>ℹ️ {feeEstimate.message}</div>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!url || loading}
            onClick={feeEstimate ? startInvestigation : estimateFee}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className={styles.pulseDot}></span>
                Processing...
              </span>
            ) : feeEstimate ? (
              `⚡ PAY ${feeEstimate.amount} CSPR & START`
            ) : (
              '⚡ ESTIMATE FEE'
            )}
          </button>
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

          {/* Live Agent Log */}
          <div className="card" style={{ padding: '24px', minHeight: '350px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 14, 23, 0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--accent-cyan)', fontSize: '14px' }}>⬡</span>
              <h2 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                Live Agent Log
              </h2>
            </div>

            <div style={{
              flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px',
              background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px',
            }}>
              {logs.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Waiting for agent initialization...
                </div>
              ) : (
                logs.map((log: string, idx: number) => (
                  <div key={idx} style={{ padding: '6px', fontSize: '13px', borderLeft: log.includes('✅') ? '2px solid var(--accent-green)' : log.includes('⚠️') || log.includes('❌') ? '2px solid var(--accent-red)' : '2px solid var(--accent-cyan)', background: 'rgba(255,255,255,0.02)', margin: '2px 0' }}>
                    <span style={{ opacity: 0.4, marginRight: '8px', fontSize: '11px' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Investigation Report */}
          <div className="card" style={{ padding: '24px', minHeight: '350px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 14, 23, 0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent-cyan)', fontSize: '14px' }}>◈</span>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                    Audit Report
                  </h2>
              </div>
              {result && (
                <button 
                  onClick={downloadReport}
                  style={{ background: 'var(--accent-cyan)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                >
                  📥 DOWNLOAD REPORT (.MD)
                </button>
              )}
            </div>

            {!result ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: '13px', gap: '8px',
              }}>
                <span style={{ fontSize: '32px', opacity: 0.3 }}>◈</span>
                <span>Awaiting agent analysis...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                {/* Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid', borderColor: result.score < 30 ? 'var(--accent-green)' : result.score < 60 ? 'var(--accent-yellow)' : 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: result.score < 30 ? 'var(--accent-green)' : result.score < 60 ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
                    {result.score}
                  </div>
                  <div>
                    <span className={`badge`} style={{ background: result.score < 30 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: result.score < 30 ? 'var(--accent-green)' : 'var(--accent-red)', border: '1px solid currentColor' }}>
                      {result.recommendation}
                    </span>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
                      Security audit complete
                    </p>
                  </div>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '14px',
                    borderLeft: '3px solid var(--accent-cyan)',
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                      Financial Summary
                    </div>
                    {result.financials && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Collected Fee:</span>
                          <span style={{ color: 'var(--text-primary)' }}>{result.financials.collected} CSPR</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Agent Spent:</span>
                          <span style={{ color: 'var(--text-primary)' }}>{result.financials.actualSpent} CSPR</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '2px' }}>
                          <span>Refunded:</span>
                          <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{result.financials.refunded} CSPR</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '14px',
                    borderLeft: '3px solid var(--accent-green)',
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                      On-Chain Transparency
                    </div>
                    {result.hashes && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                        <div title={result.hashes.initialPaymentHash}>
                          <span style={{ color: 'var(--text-muted)' }}>FEE TX:</span> {result.hashes.initialPaymentHash?.substring(0, 10)}...
                        </div>
                        <div title={result.hashes.registryHash}>
                          <span style={{ color: 'var(--accent-green)' }}>LOG TX:</span> {result.hashes.registryHash?.substring(0, 10)}...
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Findings */}
                <div style={{
                  background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '14px',
                  fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
                  borderLeft: '3px solid var(--accent-yellow)', maxHeight: '150px', overflowY: 'auto'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    Key Findings ({result.findings?.length || 0})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                    {result.findings?.slice(0,3).map((f: any, i: number) => (
                      <li key={i}>{f.title}</li>
                    ))}
                    {result.findings?.length > 3 && <li>... and {result.findings.length - 3} more (Download Report to view all)</li>}
                    {result.findings?.length === 0 && <li>No critical issues found.</li>}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
