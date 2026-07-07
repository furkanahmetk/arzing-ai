import Database from 'better-sqlite3'
import path from 'path'
import { AuditResult } from '../agents/auditor'
import { ValidatorData } from './validator'
import { NetworkStats } from './cspr-cloud'

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'casperguard.db')

export interface AlertRecord {
  id: string
  level: 'info' | 'warn' | 'danger'
  title: string
  message: string
  timestamp: string
  source: 'contract' | 'validator' | 'network'
}

class DatabaseService {
  private _db: Database.Database | null = null

  private get instance(): Database.Database {
    if (!this._db) throw new Error('Database not initialized — call db.init() first')
    return this._db
  }

  init() {
    this._db = new Database(DB_PATH)
    this._db.pragma('journal_mode = WAL')

    this._db.exec(`
      CREATE TABLE IF NOT EXISTS audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_address TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        summary TEXT,
        findings TEXT NOT NULL,
        on_chain_tx TEXT,
        audited_at TEXT NOT NULL,
        full_report_markdown TEXT
      );

      CREATE TABLE IF NOT EXISTS validators (
        public_key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        risk_score INTEGER,
        risk_reasoning TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS network_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        captured_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        level TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        source TEXT NOT NULL
      );
    `)
  }

  // ── Audits ─────────────────────────────────────────────────────────────────
  saveAudit(result: AuditResult) {
    this.instance.prepare(`
      INSERT INTO audits (contract_address, risk_score, summary, findings, on_chain_tx, audited_at, full_report_markdown)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(result.contractAddress, result.riskScore, result.summary, JSON.stringify(result.findings), result.onChainTxHash || null, result.auditedAt, result.fullReportMarkdown || null)
  }

  getAudit(contractAddress: string): AuditResult | null {
    const row = this.instance.prepare('SELECT * FROM audits WHERE contract_address = ? ORDER BY id DESC LIMIT 1').get(contractAddress) as Record<string, unknown> | undefined
    if (!row) return null
    return { 
      ...(row as unknown as AuditResult), 
      findings: JSON.parse(row.findings as string),
      fullReportMarkdown: row.full_report_markdown as string | undefined
    }
  }

  getRecentAudits(limit: number) {
    return this.instance.prepare('SELECT * FROM audits ORDER BY id DESC LIMIT ?').all(limit)
  }

  // ── Validators ──────────────────────────────────────────────────────────────
  saveValidatorSnapshot(v: ValidatorData) {
    this.instance.prepare(`
      INSERT OR REPLACE INTO validators (public_key, data, updated_at)
      VALUES (?, ?, ?)
    `).run(v.publicKey, JSON.stringify(v), v.evalUpdatedAt || new Date().toISOString())
  }

  getValidatorSnapshot(publicKey: string): ValidatorData | null {
    const row = this.instance.prepare('SELECT data, updated_at FROM validators WHERE public_key = ?').get(publicKey) as { data: string, updated_at: string } | undefined
    if (!row) return null
    const parsed = JSON.parse(row.data)
    return parsed
  }

  getAllValidators(limit: number, sort: string): ValidatorData[] {
    const rows = this.instance.prepare('SELECT data FROM validators ORDER BY updated_at DESC LIMIT ?').all(limit) as { data: string }[]
    const parsed = rows.map(r => JSON.parse(r.data) as ValidatorData)
    if (sort === 'uptime') return parsed.sort((a, b) => b.uptime - a.uptime)
    if (sort === 'commission') return parsed.sort((a, b) => a.commission - b.commission)
    return parsed.sort((a, b) => a.riskScore - b.riskScore)
  }

  // ── Network Snapshots ──────────────────────────────────────────────────────
  saveNetworkSnapshot(stats: NetworkStats) {
    this.instance.prepare('INSERT INTO network_snapshots (data, captured_at) VALUES (?, ?)').run(JSON.stringify(stats), new Date().toISOString())
    // Keep only last 100 snapshots
    this.instance.prepare('DELETE FROM network_snapshots WHERE id NOT IN (SELECT id FROM network_snapshots ORDER BY id DESC LIMIT 100)').run()
  }

  getLastNetworkSnapshot(): NetworkStats | null {
    const row = this.instance.prepare('SELECT data FROM network_snapshots ORDER BY id DESC LIMIT 1').get() as { data: string } | undefined
    return row ? JSON.parse(row.data) : null
  }

  getRecentNetworkSnapshots(limit: number): NetworkStats[] {
    const rows = this.instance.prepare('SELECT data FROM network_snapshots ORDER BY id DESC LIMIT ?').all(limit) as { data: string }[]
    return rows.map(r => JSON.parse(r.data))
  }

  // ── Alerts ──────────────────────────────────────────────────────────────────
  saveAlert(alert: AlertRecord) {
    this.instance.prepare(`
      INSERT OR IGNORE INTO alerts (id, level, title, message, timestamp, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(alert.id, alert.level, alert.title, alert.message, alert.timestamp, alert.source)
  }

  getRecentAlerts(limit: number): AlertRecord[] {
    return this.instance.prepare('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?').all(limit) as AlertRecord[]
  }
}

export const db = new DatabaseService()
