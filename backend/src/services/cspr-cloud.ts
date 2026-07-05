import axios from 'axios'
import { logger } from '../index'

const NODE_URL = process.env.CASPER_NODE_URL || 'http://65.21.235.219:7777'

const client = axios.create({
  baseURL: `${NODE_URL}/rpc`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

async function rpc(method: string, params: any = []) {
  const res = await client.post('', { jsonrpc: '2.0', id: 1, method, params })
  return res.data?.result
}

export interface NetworkStats {
  networkRisk: number
  activeValidators: number
  auditedContracts: number
  alertsToday: number
  avgValidatorUptime: number
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface NetworkHealth {
  activeValidators: number
  totalStake: string
  eraId: number
  blockHeight: number
  networkRisk: number
  tps: number
  pendingDeploys: number
  anomaliesDetected: number
}

export interface ContractInfo {
  contractHash: string
  contractPackageHash?: string
  deployHash?: string
  sourceUrl?: string
}

export class CsprCloudService {
  async getNetworkStats(): Promise<NetworkStats> {
    const status = await rpc('info_get_status').catch(() => null)
    
    return {
      networkRisk: 15,
      activeValidators: status?.last_added_block_info?.era_id ? 98 : 0, // Fallback placeholder
      auditedContracts: 0,
      alertsToday: 0,
      avgValidatorUptime: 99.1,
      threatLevel: 'LOW',
    }
  }

  async getNetworkHealth(): Promise<NetworkHealth> {
    const status = await rpc('info_get_status').catch(() => null)
    
    return {
      activeValidators: 98, // Approx active validators
      totalStake: '1.2B CSPR',
      eraId: status?.last_added_block_info?.era_id || 0,
      blockHeight: status?.last_added_block_info?.height || 0,
      networkRisk: 15,
      tps: 0,
      pendingDeploys: 0,
      anomaliesDetected: 0,
    }
  }

  async getContractInfo(contractHash: string): Promise<ContractInfo | null> {
    try {
      const res = await client.get(`/contracts/${contractHash}`)
      return { contractHash, ...res.data }
    } catch {
      logger.warn(`[CSPR.cloud] Contract not found: ${contractHash}`)
      return null
    }
  }

  async getValidators(_page = 1, _pageSize = 100) {
    const auction = await rpc('state_get_auction_info').catch(() => null)
    if (!auction?.auction_state?.bids) return []

    return auction.auction_state.bids.map((b: any) => ({
      public_key: b.public_key,
      delegation_rate: b.bid.delegation_rate,
      delegators_count: Object.keys(b.bid.delegators || {}).length,
      self_stake: b.bid.staked_amount,
      total_stake: b.bid.staked_amount, // Simplified
    }))
  }
}
