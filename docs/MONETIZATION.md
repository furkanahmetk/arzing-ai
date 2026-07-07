# 💸 Monetization & x402 Mechanics

CasperGuard AI implements a robust, transparent, and user-centric monetization model. It utilizes the **x402 Micropayments** concept, adapting it for autonomous AI agents that require upfront budgets for unpredictable LLM API costs.

## The Problem with Fixed Pricing in AI
AI agents do not have fixed execution costs. Auditing a 100-line token contract costs significantly fewer LLM tokens than auditing a 5,000-line DeFi protocol. A fixed fee would either be too expensive for small users or result in a net loss for the platform operators.

## The Dynamic Budget Solution

CasperGuard AI uses a **Pre-pay and Refund** mechanism:

### 1. The Estimate (Frontend)
Before an audit begins, the frontend calculates an "Estimated Maximum Budget" based on the size of the target URL or contract.
- Example: `Estimated Fee = 50.00 CSPR`

### 2. The Pre-Payment (Casper Wallet)
The user is asked to sign a native Casper Network `TransferDeploy` sending `50.00 CSPR` to the Platform's Master Wallet.
- This secures the funds before the Agent spends its own fiat currency on LLM API tokens.

### 3. Execution & Cost Tracking (Backend Agent)
The Agent performs the audit. Behind the scenes, it tracks exact costs:
- **LLM Cost + Node Compute**: Complex multi-prompt execution (e.g., `15.00 CSPR`).

### 4. Margin Calculation
The platform adds a transparent **100%** profit margin to the actual execution cost. This represents a highly lucrative SaaS business model.
- **Total Cost** = `15.00 CSPR`
- **Margin (100%)** = `15.00 CSPR`
- **Final Deducted Amount** = `30.00 CSPR`

### 5. On-Chain Refund
Since the user prepaid `50.00 CSPR`, the Agent immediately initiates an automated `TransferDeploy` to refund the difference using its own private key.
- **Refund Amount** = `50.00 - 30.00 = 20.00 CSPR`
- The `refundHash` is explicitly printed in the final Markdown Audit Report provided to the user.

## Benefits of this Model
1. **Agent Autonomy**: The Agent never risks running out of funds mid-analysis.
2. **Absolute Transparency**: The user sees exactly how much the LLM cost, how much the platform took, and receives an on-chain refund hash as proof.
3. **Frictionless UX**: The user only signs one transaction at the beginning. The refund happens automatically.
