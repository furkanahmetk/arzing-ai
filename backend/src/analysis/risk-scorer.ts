import { AuditFinding } from '../agents/auditor'

const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 40,
  high: 20,
  medium: 8,
  low: 2,
  info: 0,
}

export class RiskScorer {
  score(findings: AuditFinding[]): number {
    const raw = findings.reduce((sum, f) => sum + (SEVERITY_WEIGHTS[f.severity] || 0), 0)
    return Math.min(Math.round(raw), 100)
  }

  gasOptimizations(code: string): string[] {
    const opts: string[] = []
    if (code.includes('Vec::new()') && code.includes('push(')) {
      opts.push('Pre-allocate Vec with Vec::with_capacity() to avoid reallocations')
    }
    if ((code.match(/storage::read/g) || []).length > 3) {
      opts.push('Batch storage reads into a single call to reduce I/O overhead')
    }
    if (code.includes('String::from(') && !code.includes('str::')) {
      opts.push('Use &str instead of String where ownership is not required to reduce heap allocations')
    }
    if (code.includes('.clone()')) {
      opts.push('Minimize .clone() usage — prefer references or Arc<T> for shared ownership')
    }
    return opts
  }
}
