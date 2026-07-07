import { CsprCloudService } from './cspr-cloud'
import { db } from './database'
import fetch from 'node-fetch'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const EVALUATION_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 hours

export interface ValidatorData {
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
  evalUpdatedAt?: string
}

export class ValidatorService {
  private cloud: CsprCloudService
  private cronInterval: NodeJS.Timeout | null = null
  private isEvaluating = false

  constructor() { 
    this.cloud = new CsprCloudService() 
    this.startCron()
  }

  private startCron() {
    // Run immediately, then every 6 hours
    setTimeout(() => this.runEvaluationCycle(), 5000)
    this.cronInterval = setInterval(() => this.runEvaluationCycle(), EVALUATION_INTERVAL_MS)
  }

  private async runEvaluationCycle() {
    if (this.isEvaluating) return
    this.isEvaluating = true
    try {
      console.log('[ValidatorService] Starting LLM Evaluation Cycle for validators...')
      const validators = await this.fetchFromNetwork()
      
      const now = Date.now()
      const toEvaluate: ValidatorData[] = []

      // 1. Check cache and filter
      for (const v of validators) {
        const cached = db.getValidatorSnapshot(v.publicKey)
        if (cached && cached.evalUpdatedAt) {
          const updatedMs = new Date(cached.evalUpdatedAt).getTime()
          if (now - updatedMs < EVALUATION_INTERVAL_MS) {
            // Strict 6 hour cache: skip evaluation
            v.riskScore = cached.riskScore
            v.riskReasoning = cached.riskReasoning
            v.evalUpdatedAt = cached.evalUpdatedAt
            db.saveValidatorSnapshot(v)
            continue
          }
        }
        toEvaluate.push(v)
      }

      console.log(`[ValidatorService] ${validators.length - toEvaluate.length} cached, ${toEvaluate.length} need evaluation.`)

      // 2. Evaluate in batches
      const BATCH_SIZE = 20
      for (let i = 0; i < toEvaluate.length; i += BATCH_SIZE) {
        const batch = toEvaluate.slice(i, i + BATCH_SIZE)
        try {
          const results = await this.evaluateBatchWithLLM(batch)
          for (const v of batch) {
            const res = results[v.publicKey]
            if (res) {
              v.riskScore = res.score
              v.riskReasoning = res.reasoning
            } else {
              v.riskReasoning = 'Evaluation skipped or missing in batch response.'
            }
            v.evalUpdatedAt = new Date().toISOString()
            db.saveValidatorSnapshot(v)
          }
        } catch (e: any) {
          console.error(`[ValidatorService] Failed batch ${i}:`, e.message)
          // Save with mock data to prevent infinite retries
          for (const v of batch) {
            v.riskReasoning = 'LLM batch evaluation failed temporarily.'
            v.evalUpdatedAt = new Date().toISOString()
            db.saveValidatorSnapshot(v)
          }
        }
        // Delay to respect rate limits
        await new Promise(r => setTimeout(r, 2000))
      }

      console.log('[ValidatorService] Completed LLM Evaluation Cycle.')
    } catch (e: any) {
      console.error('[ValidatorService] Cron cycle error:', e.message)
    } finally {
      this.isEvaluating = false
    }
  }

  private async evaluateBatchWithLLM(batch: ValidatorData[]): Promise<Record<string, { score: number, reasoning: string }>> {
    const defaultRes: Record<string, { score: number, reasoning: string }> = {}
    
    if (!OPENROUTER_API_KEY) {
      for (const v of batch) {
        defaultRes[v.publicKey] = { score: Math.floor(Math.random() * 40) + 10, reasoning: 'OpenRouter API key missing. Mock reasoning provided.' }
      }
      return defaultRes
    }

    const payload = batch.map(v => ({
      publicKey: v.publicKey,
      uptime: v.uptime,
      commission: v.commission,
      delegators: v.delegators,
      totalStake: v.totalStake,
      eraRewardsConsistency: v.eraRewardsConsistency
    }))

    const prompt = `
You are a blockchain security analyst evaluating an array of Casper Network validators.
Analyze the following JSON array of validators and assign each a Risk Score from 0 to 100 (0 = extremely safe, 100 = critical risk).
Metrics context: Uptime below 95% is risky. Commission 0-20% is normal, >50% is suspicious. Few delegators = higher centralization risk.

Validators:
${JSON.stringify(payload, null, 2)}

Respond strictly in JSON format containing an object where each key is the "publicKey" and the value is an object with exactly two fields: "score" (number) and "reasoning" (string, max 2 sentences).
Example Output:
{
  "01aa11...": { "score": 15, "reasoning": "High uptime and normal commission indicate strong reliability." },
  "01bb22...": { "score": 85, "reasoning": "Low uptime and extreme commission pose a high risk." }
}
`
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    })

    if (!res.ok) throw new Error(`LLM Error: ${res.statusText}`)
    const data = await res.json()
    const content = data.choices[0].message.content
    try {
      const parsed = JSON.parse(content)
      return parsed
    } catch (e) {
      console.error('Failed to parse LLM batch JSON', content)
      throw new Error('Failed to parse LLM response.')
    }
  }

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
    return raw.map((v: any) => {
      const selfCspr = Number(BigInt(v.self_stake || '0') / 1_000_000_000n)
      const totalCspr = Number(BigInt(v.total_stake || '0') / 1_000_000_000n)
      const formatStake = (val: number) => val > 1_000_000 ? `${(val / 1_000_000).toFixed(2)}M CSPR` : `${val.toLocaleString()} CSPR`
      
      return {
        publicKey: v.public_key as string || '',
        name: v.name as string | undefined,
        riskScore: 0,
        riskReasoning: 'Pending LLM Evaluation',
        uptime: v.uptime as number || 99.9,
        commission: parseFloat(String(v.delegation_rate)) || 0,
        delegators: v.delegators_count as number || 0,
        selfStake: formatStake(selfCspr),
        totalStake: formatStake(totalCspr),
        eraRewardsConsistency: 95,
        lastSeen: new Date().toISOString(),
        flags: [],
      }
    })
  }
}
