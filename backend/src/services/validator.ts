import { CsprCloudService } from './cspr-cloud'
import { db } from './database'

export interface ValidatorData {
  publicKey: string
  name?: string
  riskScore: number
  uptime: number
  commission: number
  delegators: number
  selfStake: string
  totalStake: string
  eraRewardsConsistency: number
  lastSeen: string
  flags: string[]
}

export class ValidatorService {
  private cloud: CsprCloudService

  constructor() { this.cloud = new CsprCloudService() }

  async getAll(limit: number, sort: string): Promise<ValidatorData[]> {
    // Try DB cache first (refreshed by Sentinel every 2 min)
    const cached = db.getAllValidators(limit, sort)
    if (cached.length > 0) return cached

    // Fallback: fetch from network
    return this.fetchFromNetwork()
  }

  async getOne(publicKey: string): Promise<ValidatorData | null> {
    return db.getValidatorSnapshot(publicKey)
  }

  async fetchFromNetwork(): Promise<ValidatorData[]> {
    const raw = await this.cloud.getValidators(1, 100)
    return raw.map((v: Record<string, unknown>) => ({
      publicKey: v.public_key as string || '',
      name: v.name as string | undefined,
      riskScore: 0,
      uptime: parseFloat((v.active_era_count as number / Math.max(v.era_count as number, 1) * 100).toFixed(1)) || 99,
      commission: parseFloat(String(v.delegation_rate)) || 0,
      delegators: v.delegators_count as number || 0,
      selfStake: `${Math.round((v.self_stake as number || 0) / 1e9)}M CSPR`,
      totalStake: `${Math.round((v.total_stake as number || 0) / 1e9)}M CSPR`,
      eraRewardsConsistency: 95,
      lastSeen: new Date().toISOString(),
      flags: [],
    }))
  }
}
