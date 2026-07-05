# 🎭 Demo Scenarios

Use these step-by-step scripts when presenting CasperGuard AI to hackathon judges or stakeholders. They are designed to highlight the AI, Agentic behavior, and Casper integrations.

## Scenario 1: The Vulnerable Contract Catch
**Goal:** Show how the LLM instantly detects critical vulnerabilities and logs the immutable proof on-chain.

**Steps:**
1. Open the **CasperGuard AI Dashboard** on your browser.
2. Click **Connect Wallet** using CSPR.click to authenticate.
3. Navigate to the **Auditor** page.
4. Paste the URL of a known vulnerable Casper contract (e.g., a contract missing `caller` verification or with an unsafe `unwrap()`).
5. Click **Start Autonomous Audit**.
6. **Talking Point:** Explain that the backend Agent is now downloading the source, executing static analysis via Rust rules, and utilizing an LLM (GPT-4o/Gemini) to do semantic vulnerability scanning.
7. Wait for the result to appear on the screen. Point out the **Risk Score** (e.g., 90/100).
8. Highlight the **Transaction Hash** that appears. Click it to open [cspr.live](https://testnet.cspr.live).
9. **Talking Point:** Show the judges that the Risk Score, the Summary, and the exact timestamp (`audit_date`) are now immutably logged on the Casper Testnet via our native `AuditRegistry` contract.

## Scenario 2: Agent-to-Agent Microtransactions (x402)
**Goal:** Demonstrate the autonomous API economy using the x402 protocol.

**Steps:**
1. Open a terminal during your presentation.
2. Run a simple `curl` script that attempts to access the AI API without paying.
   ```bash
   curl -X POST http://localhost:4000/api/audit -d '{"target": "demo"}'
   ```
3. Show the judges the `402 Payment Required` HTTP response headers.
4. **Talking Point:** Explain that because Casper has low fees, autonomous agents can pay each other directly per API request. No credit cards, no human intervention.
5. Run your "Agent script" which automatically signs a 0.5 CSPR transaction and attaches the cryptographic proof to the header `X-Payment`.
6. Show the `200 OK` response with the complete AI audit JSON.

## Scenario 3: Network Sentinel Anomaly Detection
**Goal:** Show how CasperGuard protects the network health.

**Steps:**
1. Navigate to the **Network Intelligence** (Validators) dashboard.
2. Show the list of validators fetched automatically via **CSPR.cloud REST APIs**.
3. Point out a validator with a high risk score.
4. **Talking Point:** Explain that our background Node.js daemon (the Sentinel Agent) constantly monitors the CSPR.cloud event stream. If a validator drops offline, changes its commission to 100% maliciously, or unstakes massively, the AI instantly recalculates their score and alerts delegators.
