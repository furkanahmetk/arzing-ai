import { AuditFinding } from '../agents/auditor'

// Known Casper/Rust vulnerability patterns
const PATTERNS: Array<{
  regex: RegExp
  finding: Omit<AuditFinding, 'description'> & { descTemplate: string }
}> = [
  {
    regex: /runtime::call_contract\s*\(.*\)\s*;[\s\S]{0,200}runtime::call_contract/,
    finding: {
      severity: 'high',
      category: 'Reentrancy',
      title: 'Potential Reentrancy via call_contract',
      descTemplate: 'Multiple call_contract invocations detected in close proximity. If state is not updated before the external call, this may allow reentrancy attacks.',
      recommendation: 'Update all internal state before making external contract calls. Use a mutex pattern or checks-effects-interactions.',
    },
  },
  {
    regex: /unwrap\(\)|expect\(".*"\)/g,
    finding: {
      severity: 'medium',
      category: 'Error Handling',
      title: 'Unsafe unwrap/expect Usage',
      descTemplate: 'Usage of .unwrap() or .expect() found. These will panic on None/Err, potentially bricking the contract.',
      recommendation: 'Use proper error propagation with ? operator or match expressions instead of unwrap/expect.',
    },
  },
  {
    regex: /as\s+u64|as\s+u32|as\s+u128/,
    finding: {
      severity: 'medium',
      category: 'Integer Casting',
      title: 'Unsafe Numeric Cast Detected',
      descTemplate: 'Numeric casts using `as` keyword found. These silently truncate values and may cause overflow/underflow.',
      recommendation: 'Use checked arithmetic: u64::try_from(), checked_add(), checked_mul(), etc.',
    },
  },
  {
    regex: /storage::write\(|storage::dictionary_put\(/,
    finding: {
      severity: 'low',
      category: 'Storage',
      title: 'Direct Storage Write',
      descTemplate: 'Direct storage write detected. Ensure caller is properly authenticated before modifying contract state.',
      recommendation: 'Always verify caller authorization via runtime::get_caller() before storage mutations.',
    },
  },
  {
    regex: /#\[no_mangle\]/,
    finding: {
      severity: 'info',
      category: 'ABI',
      title: 'Public Entry Point',
      descTemplate: '#[no_mangle] marks a public contract entry point. Ensure all public endpoints have appropriate access controls.',
      recommendation: 'Audit each public entry point for missing authorization checks.',
    },
  },
  {
    regex: /todo!\(\)|unimplemented!\(\)/,
    finding: {
      severity: 'high',
      category: 'Incomplete Code',
      title: 'Incomplete Implementation (todo!/unimplemented!)',
      descTemplate: 'Found todo!() or unimplemented!() macros. These will panic at runtime and indicate unfinished logic.',
      recommendation: 'Remove all todo!/unimplemented! before deploying to testnet or mainnet.',
    },
  },
]

export class RustAnalyzer {
  analyze(code: string): AuditFinding[] {
    const findings: AuditFinding[] = []
    const seen = new Set<string>()

    for (const { regex, finding } of PATTERNS) {
      if (regex.test(code) && !seen.has(finding.title)) {
        seen.add(finding.title)
        findings.push({
          severity: finding.severity,
          category: finding.category,
          title: finding.title,
          description: finding.descTemplate,
          recommendation: finding.recommendation,
        })
      }
    }
    return findings
  }
}
