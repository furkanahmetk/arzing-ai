import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createLogger, format, transports } from 'winston'
import { auditRouter } from './routes/audit'
import { networkRouter } from './routes/network'
import { validatorsRouter } from './routes/validators'
import { alertsRouter } from './routes/alerts'
import { x402Middleware } from './x402/middleware'
import { SentinelAgent } from './agents/sentinel'
import { db } from './services/database'

export const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.colorize(), format.simple()),
  transports: [new transports.Console()],
})

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.use(cors({ origin: '*' }))
app.use(express.json())

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/audit', x402Middleware, auditRouter)
app.use('/api/network', networkRouter)
app.use('/api/validators', validatorsRouter)
app.use('/api/alerts', alertsRouter)

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }))

// ── Start ────────────────────────────────────────────────────────────────────
async function main() {
  // Init database
  db.init()
  logger.info('Database initialized')

  // Start the background Sentinel Agent (non-blocking — gracefully degrades without API key)
  const sentinel = new SentinelAgent()
  sentinel.start().catch(e => logger.warn('Sentinel Agent degraded — running in demo mode', e))
  logger.info('Sentinel Agent started')

  app.listen(PORT, () => {
    logger.info(`Arzing AI backend running on http://localhost:${PORT}`)
  })
}

main().catch(err => {
  logger.error('Fatal startup error', err)
  process.exit(1)
})
