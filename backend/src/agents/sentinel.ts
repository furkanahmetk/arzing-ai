import cron from 'node-cron'
import { CsprCloudService } from '../services/cspr-cloud'
import { ValidatorService } from '../services/validator'
import { db } from '../services/database'
import { logger } from '../index'

export class SentinelAgent {
  private cloud: CsprCloudService
  private validatorSvc: ValidatorService

  constructor() {
    this.cloud = new CsprCloudService()
    this.validatorSvc = new ValidatorService()
  }

  async start() {
    logger.info('[Sentinel] Starting background monitoring…')

    // Initial snapshot
    await this.scanValidators()
    await this.snapshotNetwork()

    // Poll validators every 2 minutes
    cron.schedule('*/2 * * * *', () => {
      this.scanValidators().catch(e => logger.warn('[Sentinel] Validator scan failed', e))
    })

    // Network snapshot every minute
    cron.schedule('* * * * *', () => {
      this.snapshotNetwork().catch(e => logger.warn('[Sentinel] Network snapshot failed', e))
    })

    // Anomaly detection every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.detectAnomalies().catch(e => logger.warn('[Sentinel] Anomaly detection failed', e))
    })

    logger.info('[Sentinel] Monitoring active — validators/2min, network/1min, anomalies/5min')
  }

  private async scanValidators() {
    const validators = await this.validatorSvc.fetchFromNetwork()
    for (const v of validators) {
      const prev = db.getValidatorSnapshot(v.publicKey)
      const flags: string[] = []

      // Flag: uptime dropped
      if (v.uptime < 98) flags.push('UPTIME_DEGRADED')

      // Flag: commission hike
      if (prev && v.commission > prev.commission + 2) {
        flags.push('HIGH_COMMISSION')
        db.saveAlert({
          id: `commission-${v.publicKey}-${Date.now()}`,
          level: 'warn',
          title: 'Commission Rate Increased',
          message: `Validator ${v.name || v.publicKey.slice(0, 12)}… raised commission ${prev.commission}% → ${v.commission}%`,
          timestamp: new Date().toISOString(),
          source: 'validator',
        })
      }

      // Flag: self-stake too low relative to total
      const selfRatio = parseFloat(v.selfStake) / parseFloat(v.totalStake)
      if (!isNaN(selfRatio) && selfRatio < 0.02) flags.push('LOW_SELF_STAKE')

      v.flags = flags
      
      // Preserve LLM evaluation cache
      if (prev && prev.evalUpdatedAt && prev.riskReasoning !== 'Pending LLM Evaluation') {
        v.riskScore = prev.riskScore
        v.riskReasoning = prev.riskReasoning
        v.evalUpdatedAt = prev.evalUpdatedAt
      } else {
        v.riskScore = this.computeRiskScore(v)
        v.riskReasoning = prev?.riskReasoning || 'Pending LLM Evaluation'
        if (prev?.evalUpdatedAt) v.evalUpdatedAt = prev.evalUpdatedAt
      }
      
      db.saveValidatorSnapshot(v)
    }
    logger.info(`[Sentinel] Scanned ${validators.length} validators`)
  }

  private computeRiskScore(v: {
    uptime: number
    eraRewardsConsistency: number
    commission: number
    flags: string[]
  }): number {
    let score = 0
    if (v.uptime < 99) score += (99 - v.uptime) * 2
    if (v.eraRewardsConsistency < 90) score += (90 - v.eraRewardsConsistency) * 0.8
    if (v.commission > 8) score += (v.commission - 8) * 2
    score += v.flags.length * 10
    return Math.min(Math.round(score), 100)
  }

  private async snapshotNetwork() {
    const stats = await this.cloud.getNetworkStats()
    db.saveNetworkSnapshot(stats)
  }

  private async detectAnomalies() {
    const snapshots = db.getRecentNetworkSnapshots(3)
    if (snapshots.length < 2) return

    const latest = snapshots[0]
    const prev = snapshots[1]

    // Detect sudden validator count drop
    if (prev.activeValidators - latest.activeValidators > 3) {
      db.saveAlert({
        id: `validator-drop-${Date.now()}`,
        level: 'danger',
        title: 'Validator Count Drop Detected',
        message: `Active validators dropped ${prev.activeValidators} → ${latest.activeValidators}`,
        timestamp: new Date().toISOString(),
        source: 'network',
      })
    }

    // Anomaly logic for deploys moved to health dashboard.

    logger.info('[Sentinel] Anomaly detection pass complete')
  }
}
