import { Router, Request, Response } from 'express'
import { CsprCloudService } from '../services/cspr-cloud'
import { db } from '../services/database'

export const networkRouter = Router()
const cloud = new CsprCloudService()

// GET /api/network/stats — summary for dashboard
networkRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await cloud.getNetworkStats()
    res.json(stats)
  } catch {
    res.json(db.getLastNetworkSnapshot())
  }
})

// GET /api/network/health — detailed health metrics
networkRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await cloud.getNetworkHealth()
    res.json(health)
  } catch {
    res.status(503).json({ error: 'CSPR.cloud unavailable' })
  }
})
