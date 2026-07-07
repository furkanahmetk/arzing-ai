<div align="center">
  <h1>🛡️ CasperGuard AI</h1>
  <p><strong>Autonomous Security & Network Intelligence for the Casper Network</strong></p>
  <p>
    <a href="https://casper.network"><img src="https://img.shields.io/badge/Network-Casper%20Testnet-red?style=for-the-badge&logo=casper" alt="Casper Network" /></a>
    <a href="https://make.services/cspr-cloud"><img src="https://img.shields.io/badge/Powered%20By-CSPR.cloud-blue?style=for-the-badge" alt="CSPR.cloud" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Smart%20Contracts-Odra%20Framework-orange?style=for-the-badge" alt="Odra Framework" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Agent-x402%20Micropayments-green?style=for-the-badge" alt="x402" /></a>
  </p>
</div>

---

## 📖 Overview

**CasperGuard AI** is a fully autonomous AI security agent built on the Casper Network. It performs deep vulnerability audits on Rust/WASM smart contracts, monitors validator health, and logs immutable security reports on-chain. 

Designed for the **Casper Agentic Buildathon 2026**, CasperGuard AI demonstrates the future of AI-driven blockchain interactions, utilizing **CSPR.cloud MCP** for real-time telemetry and **x402 Micropayments** for autonomous financial execution.

## 🌟 Key Features

### 1. Autonomous Smart Contract Auditor 🤖
- Uses advanced LLMs (Gemma-3-27B-IT, GPT-4o) combined with static Rust pattern analysis to find:
  - Reentrancy attacks
  - Integer Overflows/Underflows
  - CEP-18 / CEP-78 standard violations
  - Unsafe upgrade paths and authorization bypasses
- Logs every audit report immutably on the Casper Network via the **AuditRegistry** smart contract.

### 2. Native Casper Wallet & x402 Micropayments 💳
- Fully integrated with the native **Casper Wallet** using real `TransferDeploy` (No mock message signing).
- Calculates real-time dynamic service fees in CSPR based on LLM token costs and network data requirements.
- Automatically initiates **On-Chain Refunds** for any unspent CSPR budget after the AI agent completes its analysis.

### 3. CSPR.cloud Telemetry Integration 📡
- Fetches real-time contract bytecode, ABIs, and deployment history natively via the **CSPR.cloud REST/Stream API**.
- Monitors Casper Validators for uptime and risk profiling.

## 🚀 Live Testnet Deployments

To ensure absolute transparency and auditability, the core smart contracts and agent wallets for CasperGuard AI are actively deployed on the **Casper Testnet**:

| Component | Hash / Public Key |
| :--- | :--- |
| **Audit Registry Contract** | `hash-0fac2940d2669bb4291e6603c8ea10fbd5181f8c29fb0c19077b91c08946344c` |
| **Agent Master Wallet** | `019c347ac8fb0817aa856a85131ab08efa9366ea98d59dd3578fc52ed7826fc042` |

> You can view all agent transactions, fee collections, and user refunds natively on [cspr.live/testnet](https://testnet.cspr.live).

## 🏗️ Architecture

CasperGuard AI operates through three decoupled layers:
1. **Frontend (Next.js):** The user interface and native Casper Wallet integration.
2. **Backend Agent (Node.js):** The autonomous LLM orchestration layer and x402 Facilitator logic.
3. **Smart Contracts (Rust/Odra):** The `AuditRegistry` contract that acts as the source of truth for all security findings.

> 📚 For a deep dive into the architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 📖 Documentation

Everything you need to understand, deploy, and monetize CasperGuard AI is fully documented:

- 🚀 **[Deployment Guide](docs/DEPLOYMENT.md)** - How to deploy the frontend, backend, and smart contracts.
- ⚙️ **[Architecture Overview](docs/ARCHITECTURE.md)** - How the AI Agent loop and MCPs work.
- 📜 **[Smart Contracts](docs/SMART_CONTRACTS.md)** - Deep dive into the Odra Framework integration.
- 🤖 **[x402 Protocol Guide](docs/X402_INTEGRATION.md)** - How to use the M2M API for Agentic Commerce.
- 💸 **[Monetization & x402](docs/MONETIZATION.md)** - Dynamic fee calculation, margin logic, and refunds.
- 🎮 **[Usage Guide](docs/USAGE.md)** - How to use the Web UI and API.
- 🎬 **[Demo Scenarios](docs/DEMO_SCENARIOS.md)** - Step-by-step test scenarios for judges.

## 🚀 Quickstart (Local Development)

### Prerequisites
- Node.js 20+
- Casper Wallet browser extension (Testnet connected)

### Setup
```bash
# 1. Clone repository
git clone https://github.com/yourusername/casperguard-ai.git
cd casperguard-ai

# 2. Setup Backend Agent
cd backend
npm install
cp .env.example .env # Configure OpenRouter/OpenAI API Keys
npm run dev

# 3. Setup Frontend
cd ../frontend
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```
Open `http://localhost:3000` to access the CasperGuard AI dashboard.

## 🛡️ License
MIT License. Built for the Casper Agentic Buildathon 2026.
