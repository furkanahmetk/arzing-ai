import { Request, Response, NextFunction } from 'express'
import { logger } from '../index'

/**
 * x402 Payment Middleware
 *
 * When OPENAI_API_KEY is set AND a non-free endpoint is hit,
 * check for payment proof. If none, respond with 402.
 *
 * The x402 Facilitator URL is configured via X402_FACILITATOR_URL.
 * This is compatible with https://docs.cspr.cloud/x402-facilitator-api/reference
 */

const PRICE_MOTES = process.env.X402_PRICE_MOTES || '500000000' // 0.5 CSPR
const PAYMENT_ADDRESS = process.env.AGENT_PUBLIC_KEY || ''
const FACILITATOR = process.env.X402_FACILITATOR_URL || 'https://x402.cspr.cloud'

export function x402Middleware(req: Request, res: Response, next: NextFunction) {
  // Skip if no payment address configured (dev mode)
  if (!PAYMENT_ADDRESS || process.env.NODE_ENV === 'development') {
    return next()
  }

  const paymentHeader = req.headers['x-payment'] as string | undefined

  // No payment header → return 402
  if (!paymentHeader) {
    return res.status(402).json({
      error: 'Payment Required',
      accepts: [
        {
          scheme: 'x402',
          network: 'casper-test',
          amount: PRICE_MOTES,
          to: PAYMENT_ADDRESS,
          facilitator: FACILITATOR,
          description: 'CasperGuard AI — Smart Contract Audit (0.5 CSPR)',
        },
      ],
    })
  }

  // Payment header present — log and allow (facilitator verification TBD)
  logger.info(`[x402] Payment received: ${paymentHeader.slice(0, 40)}…`)
  next()
}
