import { Router, Request, Response } from 'express'
import { AuditorAgent } from '../agents/auditor'
import { db } from '../services/database'
import { logger } from '../index'

export const auditRouter = Router()
const auditor = new AuditorAgent()

// POST /api/audit — run a security audit on a contract or GitHub repo
auditRouter.post('/', async (req: Request, res: Response) => {
  const { target } = req.body as { target?: string }
  if (!target) return res.status(400).json({ error: 'target is required (contract hash or GitHub URL)' })

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
