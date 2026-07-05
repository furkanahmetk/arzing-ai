# 📖 Usage Guide

This document explains how to use the CasperGuard AI platform from both a user (Frontend) and an automated agent (Backend/API) perspective.

## 1. Connecting Your Wallet

1. Open the frontend application (typically `http://localhost:3000`).
2. Click the **Connect Wallet** button powered by **CSPR.click** in the top right corner.
3. Select your preferred wallet (Casper Wallet, Ledger, etc.).
4. Once connected, your active public key will be displayed, and you will gain access to the restricted dashboard features.

## 2. Running an AI Smart Contract Audit

1. Navigate to the **Auditor** page.
2. In the input form, provide the Github URL or raw Rust/Wasm source code of the contract you wish to analyze.
3. Click **Start Autonomous Audit**.
4. The system will process the code using our AI Model integration (OpenAI/Gemini).
5. **On-Chain Logging:** Once the analysis is complete, the backend agent will construct a Casper transaction to deploy the audit report to the native `AuditRegistry` smart contract on the Casper Testnet.
6. A success notification will display the **Transaction Hash**. You can click this hash to view the immutable record on [cspr.live](https://testnet.cspr.live).

## 3. Viewing Network Intelligence (Sentinel)

1. Navigate to the **Network Intelligence** or **Validators** page.
2. The UI pulls real-time data from the backend SQLite database, which is constantly updated by the Sentinel daemon.
3. You will see a list of validators scored from **0 to 100** based on their risk profile.
4. **Risk Factors included:**
   - Era Uptime & Consistency
   - Sudden Commission Rate Spikes
   - Self-Stake to Delegator Ratio
5. Use this dashboard to make informed delegation decisions or monitor the network for Sybil attacks.

## 4. API Usage (For external Agents)

CasperGuard AI exposes a programmable API protected by the **x402 Micropayment Protocol**. Other agents can pay CSPR programmatically to utilize our AI audit pipeline.

### Requesting an Audit
```bash
curl -X POST http://localhost:4000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"target": "https://github.com/example/casper-contract"}'
```

### The x402 Flow
1. The server returns a `402 Payment Required` with a payment amount and a target wallet.
2. Your agent creates a Casper transfer transaction and sends it to the network.
3. Your agent retries the `POST` request, attaching the `X-Payment` proof signature in the headers.
4. The server validates the proof via the x402 Facilitator API and returns the detailed JSON audit report.
