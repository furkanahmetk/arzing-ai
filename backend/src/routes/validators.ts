import { Router, Request, Response } from 'express'
import { ValidatorService } from '../services/validator'

export const validatorsRouter = Router()
const validatorSvc = new ValidatorService()

// GET /api/validators
validatorsRouter.get('/', async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 50
  const sort = (req.query.sort as string) || 'riskScore'
  try {
    const validators = await validatorSvc.getAll(limit, sort)
    res.json(validators)
  } catch {
    res.status(503).json({ error: 'Validator data unavailable' })
  }
})

// GET /api/validators/:publicKey
validatorsRouter.get('/:publicKey', async (req: Request, res: Response) => {
  try {
    const v = await validatorSvc.getOne(req.params.publicKey)
    if (!v) return res.status(404).json({ error: 'Validator not found' })
    res.json(v)
  } catch {
    res.status(500).json({ error: 'Internal error' })
  }
})
