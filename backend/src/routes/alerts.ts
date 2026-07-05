import { Router, Request, Response } from 'express'
import { db } from '../services/database'

export const alertsRouter = Router()

// GET /api/alerts
alertsRouter.get('/', (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 20
  const alerts = db.getRecentAlerts(limit)
  res.json(alerts)
})
