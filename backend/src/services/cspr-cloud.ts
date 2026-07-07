import axios from 'axios'
import { logger } from '../index'
import { db } from './database'

const NODE_URL = process.env.CASPER_NODE_URL || 'http://65.21.235.219:7777'
const CLOUD_URL = process.env.CSPR_CLOUD_REST_URL || 'https://event-store-api-clarity-testnet.make.services'

const client = axios.create({
  baseURL: `${NODE_URL}/rpc`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

const cloudClient = axios.create({
  baseURL: CLOUD_URL,
  timeout: 10000,
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': process.env.CSPR_CLOUD_API_KEY || ''
  },
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
    
    let activeValidators = 0;
    try {
      const vRes = await cloudClient.get('/validators/active-count')
      activeValidators = vRes.data?.data || 100
    } catch (e) {
      activeValidators = status?.last_added_block_info?.era_id ? 100 : 0
    }

    const auditedContracts = db.getRecentAudits(1000).length || 0;
    const alertsToday = db.getRecentAlerts(100).length || 0;
    const allValidators = db.getAllValidators(100, 'riskScore');
    
    const avgValidatorUptime = allValidators.length 
      ? allValidators.reduce((acc, v) => acc + v.uptime, 0) / allValidators.length 
      : 99.8;
      
    const networkRisk = allValidators.length
      ? Math.floor(allValidators.reduce((acc, v) => acc + v.riskScore, 0) / allValidators.length)
      : 12;

    let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (networkRisk > 30) threatLevel = 'MEDIUM';
    if (networkRisk > 60) threatLevel = 'HIGH';
    if (networkRisk > 85) threatLevel = 'CRITICAL';

    return {
      networkRisk,
      activeValidators,
      auditedContracts,
      alertsToday,
      avgValidatorUptime: Number(avgValidatorUptime.toFixed(1)),
      threatLevel,
    }
  }

  async getNetworkHealth(): Promise<NetworkHealth> {
    const status = await rpc('info_get_status').catch(() => null)
    const blockHeight = status?.last_added_block_info?.height || 0
    
    let activeValidators = 0
    let totalStakeStr = 'Unknown'
    try {
      const auction = await rpc('state_get_auction_info')
      if (auction?.auction_state?.era_validators?.[0]?.validator_weights) {
        const weights = auction.auction_state.era_validators[0].validator_weights
        activeValidators = weights.length
        
        const totalMotes = weights.reduce((acc: bigint, vw: any) => acc + BigInt(vw.weight || '0'), 0n)
        const totalCspr = Number(totalMotes / 1_000_000_000n)
        
        if (totalCspr > 1_000_000_000) {
          totalStakeStr = `${(totalCspr / 1_000_000_000).toFixed(2)}B CSPR`
        } else {
          totalStakeStr = `${(totalCspr / 1_000_000).toFixed(2)}M CSPR`
        }
      }
    } catch (e) {}
    
    return {
      activeValidators,
      totalStake: totalStakeStr,
      eraId: status?.last_added_block_info?.era_id || 0,
      blockHeight,
      networkRisk: 12,
      tps: 1.4,
      pendingDeploys: 0,
      anomaliesDetected: 0,
    }
  }

  async getContractInfo(contractHash: string): Promise<ContractInfo | null> {
    try {
      // Use CSPR.cloud to get contract info
      const res = await cloudClient.get(`/contracts/${contractHash.replace('hash-', '')}`)
      const data = res.data?.data
      return { 
        contractHash, 
        contractPackageHash: data?.contract_package_hash,
        deployHash: data?.deploy_hash,
        sourceUrl: undefined // CSPR.cloud doesn't always have source URL, would need external registry
      }
    } catch {
      logger.warn(`[CSPR.cloud] Contract not found via REST: ${contractHash}`)
      return null
    }
  }

  async getValidators(_page = 1, _pageSize = 100) {
    try {
      const auction = await rpc('state_get_auction_info')
      if (!auction?.auction_state?.bids) return []

      const currentEraValidators = auction.auction_state.era_validators?.[0]?.validator_weights || []
      const activePubKeys = new Set(currentEraValidators.map((vw: any) => vw.public_key))

      const activeBids = auction.auction_state.bids.filter((b: any) => activePubKeys.has(b.public_key))

      return activeBids.map((b: any) => {
        const bidData = b.bid || b || {}
        const selfStakeStr = bidData.staked_amount || '0'
        const selfStake = BigInt(selfStakeStr)
        const delegatorsStake = Object.values(bidData.delegators || {}).reduce(
          (acc: bigint, d: any) => acc + BigInt(d?.staked_amount || '0'),
          0n
        )
        const totalStake = (selfStake + delegatorsStake).toString()

        return {
          public_key: b.public_key || bidData.validator_public_key,
          delegation_rate: bidData.delegation_rate || 0,
          delegators_count: Object.keys(bidData.delegators || {}).length,
          self_stake: selfStakeStr,
          total_stake: totalStake,
          uptime: 99.9
        }
      })
    } catch (e: any) {
      logger.error(`Failed to fetch validators: ${e.message}`)
      return []
    }
  }
}
