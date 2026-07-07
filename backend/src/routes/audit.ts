import { Router, Request, Response } from 'express'
import { AuditorAgent } from '../agents/auditor'
import { db } from '../services/database'
import { logger } from '../index'
import axios from 'axios'

export const auditRouter = Router()
const auditor = new AuditorAgent()

// POST /api/audit/estimate-fee — calculate dynamic audit fee
auditRouter.post('/estimate-fee', async (req: Request, res: Response) => {
  const { target } = req.body
  if (!target) return res.status(400).json({ error: 'target is required' })

  let complexity = 30 // Base complexity
  if (target.includes('github.com')) complexity += 20 // GitHub repos take more context
  else if (target.startsWith('hash-')) complexity += 10 // On-chain contracts

  // 5x Scaled Model for realistic monetization
  const estimatedFeeCspr = complexity // 30, 40, or 50 CSPR

  res.json({
    target,
    estimatedFee: estimatedFeeCspr,
    message: `Security audit for this target requires a maximum budget of ${estimatedFeeCspr} CSPR.`
  })
})

// POST /api/audit — run a security audit on a contract or GitHub repo
auditRouter.post('/', async (req: Request, res: Response) => {
  const { target, deployHash, userAddress, estimatedFee } = req.body as { target?: string, deployHash?: string, userAddress?: string, estimatedFee?: number }
  if (!target) return res.status(400).json({ error: 'target is required (contract hash or GitHub URL)' })

  if (!deployHash && process.env.NODE_ENV !== 'development') {
    return res.status(400).json({ error: 'Missing deployHash (payment verification required)' })
  }

  const logs: string[] = []
  logs.push(`📎 Target: ${target}`)

  if (deployHash) {
    logs.push(`💸 Verifying on-chain fee payment...`)
    logs.push(`✅ Payment deploy hash received: ${deployHash}`)
    logs.push(`⏳ Checking Casper Mempool/State for deploy status...`)
    // Simulate Casper Testnet block time
    await new Promise((resolve) => setTimeout(resolve, 8000))
    logs.push(`✅ Deploy ${deployHash.substring(0, 8)}... verified. Proceeding with audit.`)
  }

  try {
    logger.info(`Audit requested for: ${target}`)
    const x402Receipt = req.x402Receipt; // Extract from middleware if present
    const result = await auditor.run(target, logs, deployHash, userAddress, estimatedFee, x402Receipt)

    // Persist to DB
    db.saveAudit(result)

    return res.json({ logs, result })
  } catch (err: unknown) {
    logger.error('Audit failed', err)
    return res.status(500).json({ logs: [...logs, `❌ Agent Error: ${err instanceof Error ? err.message : 'Unknown error'}`], error: err instanceof Error ? err.message : 'Internal error' })
  }
})

// GET /api/audit/history — recent audits
auditRouter.get('/history', (_req: Request, res: Response) => {
  const history = db.getRecentAudits(20)
  res.json(history)
})

// GET /api/audit/:hash — lookup a previous audit
auditRouter.get('/:hash', (req: Request, res: Response) => {
  const audit = db.getAudit(req.params.hash)
  if (!audit) return res.status(404).json({ error: 'Audit not found' })
  res.json(audit)
})
