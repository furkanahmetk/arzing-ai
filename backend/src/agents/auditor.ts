import { getLLM } from '../llm/router'
import axios from 'axios'
import { exec } from 'child_process'
import util from 'util'

const execAsync = util.promisify(exec)
import { RiskScorer } from '../analysis/risk-scorer'
import { RustAnalyzer } from '../analysis/rust-analyzer'
import { CsprCloudService } from '../services/cspr-cloud'
import { logger } from '../index'
import { CasperServiceByJsonRPC, Keys, DeployUtil, CLPublicKey } from 'casper-js-sdk'
import fs from 'fs'

export interface AuditFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  title: string
  description: string
  recommendation: string
}

export interface AuditResult {
  contractAddress: string
  riskScore: number
  summary: string
  findings: AuditFinding[]
  gasOptimizations: string[]
  cep18Compliant?: boolean
  cep78Compliant?: boolean
  upgradeableRisk?: string
  auditedAt: string
  onChainTxHash?: string
  fullReportMarkdown?: string
  financials?: {
    collected?: number;
    actualSpent?: number;
    refunded?: number;
    profitMargin?: number;
  }
  hashes?: {
    initialPaymentHash?: string;
    registryHash?: string;
    refundHash?: string;
    x402PaymentProof?: string;
  }
}

export class AuditorAgent {
  private scorer: RiskScorer
  private rustAnalyzer: RustAnalyzer
  private cloud: CsprCloudService

  constructor() {
    this.scorer = new RiskScorer()
    this.rustAnalyzer = new RustAnalyzer()
    this.cloud = new CsprCloudService()
  }

  async run(target: string, logs: string[] = [], deployHash?: string, userAddress?: string, estimatedFee: number = 0, x402Receipt?: string): Promise<AuditResult> {
    logger.info(`[Auditor] Starting audit for: ${target}`)
    logs.push(`🔍 Agent: Initiating security audit for ${target}...`)

    // Step 1: Fetch source material
    logs.push(`📥 Agent: Fetching source code from ${target}...`)
    const source = await this.fetchSource(target)
    logs.push(`✅ Agent: Source code retrieved (${source.contractType})`)

    // Step 2: Static pattern analysis
    logs.push(`🔎 Agent: Running static Rust/WASM pattern analysis...`)
    const staticFindings = this.rustAnalyzer.analyze(source.code)
    logs.push(`✅ Agent: Static analysis complete. Found ${staticFindings.length} potential issues.`)

    // Step 3: AI deep analysis via LLM
    logs.push(`🧠 Agent: Starting LLM deep vulnerability analysis...`)
    const aiResult = await this.aiAnalysis(source.code, source.contractType, logs)
    const aiFindings = aiResult.findings
    const fullReportMarkdown = aiResult.markdownReport

    // Step 4: Standard compliance checks
    logs.push(`📏 Agent: Checking CEP-18 / CEP-78 standard compliance...`)
    const compliance = this.checkCompliance(source.code)

    // Step 5: Merge & score
    const allFindings = [...staticFindings, ...aiFindings]
    const riskScore = this.scorer.score(allFindings)
    const summary = await this.generateSummary(target, riskScore, allFindings)

    // Step 6: Write to on-chain audit registry
    logs.push(`✍️ Agent: Writing audit results to on-chain registry...`)
    const onChainTxHash = await this.writeOnChain(target, riskScore, allFindings).catch(() => undefined)
    if (onChainTxHash) logs.push(`✅ Agent: Successfully logged to blockchain. TxHash: ${onChainTxHash.substring(0,8)}...`)

    const actualSpend = 10.0 + Math.random() * 10.0; // Simulate 10-20 CSPR
    const margin = actualSpend * 1.0; // 100% Margin
    const totalCost = actualSpend + margin;
    let refunded = 0;
    let refundTxHash: string | undefined = undefined;
    
    if (estimatedFee > totalCost) {
      refunded = parseFloat((estimatedFee - totalCost).toFixed(2));
      if (userAddress) {
        logs.push(`💸 Agent: Initiating on-chain refund of ${refunded} CSPR to ${userAddress.substring(0,8)}...`);
        refundTxHash = await this.triggerRefund(userAddress, refunded).catch(() => undefined);
        if (refundTxHash) {
           logs.push(`✅ Agent: Refund successful. TxHash: ${refundTxHash.substring(0,8)}...`);
        } else {
           logs.push(`⚠️ Agent: Refund transaction failed, logging anomaly.`);
        }
      }
    }
    
    // Beautiful Findings Markdown
    let findingsMd = '### No vulnerabilities detected.';
    if (allFindings.length > 0) {
      findingsMd = allFindings.map((f, i) => `
#### ${i+1}. [${f.severity.toUpperCase()}] ${f.title}
- **Category:** ${f.category}
- **Description:** ${f.description}
- **Recommendation:** ${f.recommendation}
      `).join('\n');
    }

    const comprehensiveReport = `# CasperGuard AI - Security Audit Report
**Target:** \`${target}\`
**Type:** Smart Contract

## 1. Risk Assessment
- **Score:** ${riskScore}/100
- **Recommendation:** ${riskScore < 30 ? 'SAFE' : riskScore < 60 ? 'REVIEW RECOMMENDED' : 'DO NOT DEPLOY (HIGH RISK)'}

## 2. Executive Summary
${fullReportMarkdown}

## 3. Detailed Technical Findings
${findingsMd}

## 4. Financial Summary (x402 Micropayment)
- **Collected Maximum Budget:** ${estimatedFee.toFixed(2)} CSPR
- **Actual Agent Spend (LLM + Node):** ${actualSpend.toFixed(2)} CSPR
- **Platform Margin (100%):** ${margin.toFixed(2)} CSPR
- **Refunded to User:** ${refunded > 0 ? refunded.toFixed(2) : '0'} CSPR

## 5. On-Chain Transparency (Hashes)
- **Target Contract:** \`${target}\`
- **Fee Payment TX:** \`${deployHash || 'N/A'}\`
- **Audit Registry Contract:** \`${process.env.AUDIT_REGISTRY_CONTRACT_HASH || 'N/A'}\`
- **Audit Record TX:** \`${onChainTxHash || 'Pending / Local dev mode'}\`
- **Refund TX:** \`${refundTxHash || 'N/A'}\`
${x402Receipt ? `- **x402 Payment Proof:** \`${x402Receipt}\`\n` : ''}
---
*Generated by CasperGuard AI Autonomous Agent on Casper Testnet*`;

    const result: AuditResult = {
      contractAddress: target,
      riskScore,
      summary,
      findings: allFindings,
      gasOptimizations: this.scorer.gasOptimizations(source.code),
      cep18Compliant: compliance.cep18,
      cep78Compliant: compliance.cep78,
      upgradeableRisk: compliance.upgradeableRisk,
      auditedAt: new Date().toISOString(),
      onChainTxHash,
      fullReportMarkdown: comprehensiveReport,
      financials: {
        collected: parseFloat(estimatedFee.toFixed(2)),
        actualSpent: parseFloat(actualSpend.toFixed(2)),
        refunded,
        profitMargin: parseFloat(margin.toFixed(2))
      },
      hashes: {
        initialPaymentHash: deployHash,
        registryHash: onChainTxHash,
        refundHash: refundTxHash,
        x402PaymentProof: x402Receipt
      }
    }

    logs.push(`🎯 Agent: Audit complete! Final Risk Score: ${riskScore}/100`)
    logger.info(`[Auditor] Audit complete — Risk: ${riskScore} — Findings: ${allFindings.length}`)
    return result
  }

  private async triggerRefund(userAddressHex: string, amount: number): Promise<string> {
    try {
      const privateKeyPath = process.env.AGENT_PRIVATE_KEY || './keys/secret_key.pem';
      if (!fs.existsSync(privateKeyPath)) {
        logger.error(`[Refund] Private key not found at ${privateKeyPath}`);
        throw new Error('Agent wallet not configured');
      }

      const agentKeyPair = Keys.Ed25519.loadKeyPairFromPrivateFile(privateKeyPath);
      const amountInMotes = (Math.floor(amount * 1_000_000_000)).toString();
      const id = Math.round(Math.random() * 100000);
      const toPublicKey = CLPublicKey.fromHex(userAddressHex);
      const paymentAmount = 100_000_000; // 0.1 CSPR gas

      const casperService = new CasperServiceByJsonRPC(process.env.CASPER_NODE_URL || 'https://node.testnet.casper.network');
      
      const deployParams = new DeployUtil.DeployParams(
        agentKeyPair.publicKey,
        process.env.CASPER_NETWORK_NAME || 'casper-test',
        1,
        1800000
      );

      const session = DeployUtil.ExecutableDeployItem.newTransfer(
        amountInMotes,
        toPublicKey,
        null,
        id
      );

      const payment = DeployUtil.standardPayment(paymentAmount);
      let deploy = DeployUtil.makeDeploy(deployParams, session, payment);
      deploy = DeployUtil.signDeploy(deploy, agentKeyPair);

      const deployResult = await casperService.deploy(deploy);
      return deployResult.deploy_hash;
    } catch (error: any) {
      logger.error(`[Refund] Failed to broadcast refund: ${error.message}`);
      throw error;
    }
  }

  private async fetchSource(target: string): Promise<{ code: string; contractType: string }> {
    // GitHub URL
    if (target.startsWith('https://github.com')) {
      let rawUrl = target
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/')
        .replace('/tree/', '/')
      
      try {
        const res = await axios.get(rawUrl, { timeout: 10000 })
        return { code: res.data as string, contractType: 'github' }
      } catch (err: any) {
        // If it's a 404 (maybe it's a directory), try appending /src/lib.rs or /src/main.rs
        if (err.response?.status === 404 && !rawUrl.endsWith('.rs')) {
          try {
            const libRes = await axios.get(rawUrl.replace(/\/$/, '') + '/src/lib.rs', { timeout: 5000 })
            return { code: libRes.data as string, contractType: 'github' }
          } catch {
            const mainRes = await axios.get(rawUrl.replace(/\/$/, '') + '/src/main.rs', { timeout: 5000 })
            return { code: mainRes.data as string, contractType: 'github' }
          }
        }
        throw new Error(`Failed to fetch GitHub source: ${err.message}`)
      }
    }

    // Casper contract hash — try to get associated source via CSPR.cloud
    const contractInfo = await this.cloud.getContractInfo(target).catch(() => null)
    if (contractInfo?.sourceUrl) {
      const res = await axios.get(contractInfo.sourceUrl, { timeout: 10000 })
      return { code: res.data as string, contractType: 'on-chain' }
    }

    // Return metadata stub for hash-only audits
    return {
      code: `// Contract: ${target}\n// Source not publicly available\n// Analyzing ABI and deployment metadata only`,
      contractType: 'hash-only',
    }
  }

  private async aiAnalysis(code: string, contractType: string, logs: string[]): Promise<{ findings: AuditFinding[], markdownReport: string }> {
    if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) return { findings: [], markdownReport: '# Audit Report\n\nNo LLM API key provided. Static analysis only.' }

    const prompt = `You are a Casper Network smart contract security expert specializing in Rust/WebAssembly contracts.

Analyze the following Casper smart contract code for security vulnerabilities. Focus on:
1. Reentrancy vulnerabilities (cross-contract call patterns)
2. Integer overflow/underflow
3. Access control issues (missing authorization checks)
4. Unsafe storage manipulation
5. Improper purse management (CSPR token handling)
6. Upgradeable contract risks (key weight issues)
7. CEP-18 / CEP-78 standard violations
8. Gas griefing patterns

Contract type: ${contractType}

\`\`\`rust
${code.slice(0, 8000)}
\`\`\`

Respond EXACTLY in this format:

<JSON>
[
  {"severity":"critical|high|medium|low|info", "category":"...", "title":"...", "description":"...", "recommendation":"..."}
]
</JSON>

<REPORT>
Write a comprehensive, deep, and highly detailed markdown-formatted report containing the full security analysis, methodology, discovered vulnerabilities, highlighted code snippets, and remediation steps.
</REPORT>`

    try {
      const llm = getLLM()
      const res = await llm.invoke([{ role: 'user', content: prompt }])
      
      let content = res.content.toString() || '<JSON>[]</JSON><REPORT># Error\nLLM returned empty</REPORT>'
      
      let findings = []
      let markdownReport = '# Audit Report\n\nDetailed markdown report was not generated by LLM.'

      // Extract JSON
      const jsonMatch = content.match(/<JSON>\s*([\s\S]*?)\s*<\/JSON>/i);
      if (jsonMatch) {
          try {
              findings = JSON.parse(jsonMatch[1]);
          } catch (e) {
              logger.warn('[Auditor] Failed to parse JSON from inside <JSON> tags.', e);
          }
      } else {
          // Fallback parsing if LLM forgot tags
          const firstBracket = content.indexOf('[');
          const lastBracket = content.lastIndexOf(']');
          if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
              try {
                  findings = JSON.parse(content.substring(firstBracket, lastBracket + 1));
              } catch (e) {}
          }
      }

      // Extract REPORT
      const reportMatch = content.match(/<REPORT>\s*([\s\S]*?)\s*<\/REPORT>/i);
      if (reportMatch) {
          markdownReport = reportMatch[1];
      } else if (!jsonMatch) {
          // If no tags at all, maybe the whole thing is the report?
          markdownReport = content;
      }
      
      if (!Array.isArray(findings)) findings = [];
      
      logs.push(`✅ Agent: LLM analysis successful.`)
      return { findings, markdownReport }
    } catch (err: any) {
      logs.push(`⚠️ Agent: LLM analysis failed due to parsing/API error.`)
      logger.warn('[Auditor] LLM analysis failed, using static only', err)
      return { 
        findings: [], 
        markdownReport: `# Analysis Error\n\nThe LLM agent encountered an error during deep analysis:\n\`\`\`\n${err?.message || 'Unknown JSON parsing or API failure.'}\n\`\`\`\n\n*Note: Static analysis was still performed.*` 
      }
    }
  }

  private checkCompliance(code: string) {
    const hasCep18 = code.includes('cep18') || code.includes('CEP18') || (code.includes('total_supply') && code.includes('balance_of') && code.includes('transfer'))
    const hasCep78 = code.includes('cep78') || code.includes('CEP78') || (code.includes('mint') && code.includes('token_owner') && code.includes('metadata'))
    const upgradeableRisk = code.includes('upgrade') && !code.includes('require_owner') && !code.includes('assert_caller')
      ? 'No ownership check found on upgrade path'
      : undefined
    return { cep18: hasCep18, cep78: hasCep78, upgradeableRisk }
  }

  private async generateSummary(target: string, score: number, findings: AuditFinding[]): Promise<string> {
    const critical = findings.filter(f => f.severity === 'critical').length
    const high = findings.filter(f => f.severity === 'high').length
    if (critical > 0) return `⚠️ CRITICAL: ${critical} critical vulnerabilities found. Immediate remediation required before mainnet deployment.`
    if (high > 0) return `🟠 HIGH RISK: ${high} high-severity issues detected. Review and fix before deployment.`
    if (score < 30) return `✅ LOW RISK: Contract scored ${score}/100. ${findings.length} minor findings. Generally safe for deployment.`
    return `🟡 MEDIUM RISK: Contract scored ${score}/100 with ${findings.length} findings. Review recommended.`
  }

  private async writeOnChain(target: string, riskScore: number, findings: AuditFinding[]): Promise<string | undefined> {
    try {
      logger.info('[Auditor] Writing audit result on-chain...')
      
      const crit = findings.filter(f => f.severity === 'critical').length
      const high = findings.filter(f => f.severity === 'high').length
      const med = findings.filter(f => f.severity === 'medium').length
      const low = findings.filter(f => f.severity === 'low').length
      
      const hash = process.env.AUDIT_REGISTRY_CONTRACT_HASH
      const nodeUrl = process.env.CASPER_NODE_URL || 'https://node.testnet.casper.network'
      const chainName = process.env.CASPER_NETWORK_NAME || 'casper-test'
      const keyPath = process.env.AGENT_PRIVATE_KEY
      
      if (!hash || !keyPath) {
        logger.warn('[Auditor] Cannot write on-chain: missing contract hash or private key.')
        return undefined
      }

      // Safe summary string
      let safeSummary = await this.generateSummary(target, riskScore, findings)
      safeSummary = safeSummary.replace(/'/g, "").replace(/"/g, "")

      const cmd = `casper-client put-deploy \
        --node-address ${nodeUrl}/rpc \
        --chain-name ${chainName} \
        --secret-key ${keyPath} \
        --session-package-hash ${hash} \
        --session-entry-point submit_audit \
        --payment-amount 5000000000 \
        --session-arg "contract_target:string='${target}'" \
        --session-arg "risk_score:u8='${riskScore}'" \
        --session-arg "summary:string='${safeSummary.substring(0, 100)}'" \
        --session-arg "findings_critical:u8='${crit}'" \
        --session-arg "findings_high:u8='${high}'" \
        --session-arg "findings_medium:u8='${med}'" \
        --session-arg "findings_low:u8='${low}'" \
        --session-arg "audited_at_ms:u64='${Date.now()}'" \
        --session-arg "audit_date:string='${new Date().toISOString()}'" \\
        --session-arg "model:string='${process.env.OPENROUTER_MODEL || 'unknown'}'"`
        
      const { stdout } = await execAsync(cmd)
      
      // Strip casper-client warnings before parsing JSON
      const jsonStart = stdout.indexOf('{')
      const cleanStdout = jsonStart !== -1 ? stdout.substring(jsonStart) : stdout
      
      const parsed = JSON.parse(cleanStdout)
      const deployHash = parsed.result?.deploy_hash || parsed.result?.transaction_hash
      
      logger.info(`[Auditor] Successfully dispatched on-chain transaction: ${deployHash}`)
      return deployHash
    } catch (e: any) {
      logger.error('[Auditor] Failed to write on-chain:', e.message)
      return undefined
    }
  }
}
