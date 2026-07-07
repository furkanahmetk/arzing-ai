import { Router, Request, Response } from 'express'
import { AuditorAgent } from '../agents/auditor'
import { db } from '../services/database'
import { logger } from '../index'
import axios from 'axios'

export const auditRouter = Router()
const auditor = new AuditorAgent()

// POST /api/audit — run a security audit on a contract or GitHub repo
auditRouter.post('/', async (req: Request, res: Response) => {
  const { target } = req.body as { target?: string }
  if (!target) return res.status(400).json({ error: 'target is required (contract hash or GitHub URL)' })

  // 1. Check for x402 payment
  const paymentSignature = req.headers['payment-signature'] || req.headers['x-payment']
  if (!paymentSignature && process.env.NODE_ENV !== 'development') {
    return res.status(402).json({
      error: 'Payment Required',
      paymentRequirements: {
        network: 'casper:casper-test',
        scheme: 'exact',
        asset: 'cspr',
        amount: process.env.X402_PRICE_MOTES || '500000000',
      }
    })
  }

  // 2. Validate & Settle via CSPR.cloud Facilitator
  if (paymentSignature) {
    try {
      const facilitatorUrl = process.env.X402_FACILITATOR_URL || 'https://x402-facilitator.cspr.cloud'
      logger.info(`[x402] Settling payment via ${facilitatorUrl}...`)
      
      // We expect paymentSignature to be base64-encoded JSON payload from the client
      const payloadBuffer = Buffer.from(paymentSignature as string, 'base64')
      const payload = JSON.parse(payloadBuffer.toString('utf-8'))

      await axios.post(`${facilitatorUrl}/settle`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.CSPR_CLOUD_API_KEY || ''
        }
      })
      logger.info('[x402] Payment settled successfully.')
    } catch (err: any) {
      logger.error('[x402] Payment failed', err.response?.data || err.message)
      return res.status(401).json({ error: 'Payment validation failed', details: err.response?.data || err.message })
    }
  }

  try {
    logger.info(`Audit requested for: ${target}`)
    const result = await auditor.run(target)

    // Persist to DB
    db.saveAudit(result)

    return res.json(result)
  } catch (err: unknown) {
    logger.error('Audit failed', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
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
