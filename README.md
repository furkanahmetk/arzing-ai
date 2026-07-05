# 🛡️ CasperGuard AI

> **Autonomous Smart Contract Security Auditor & Network Health Guardian for Casper Network**

[![Casper AI Toolkit](https://img.shields.io/badge/Casper%20AI%20Toolkit-Powered-red?style=for-the-badge)](https://www.casper.network/ai)
[![x402 Protocol](https://img.shields.io/badge/x402-Micropayments-blue?style=for-the-badge)](https://docs.cspr.cloud/x402-facilitator-api/reference)
[![MCP Native](https://img.shields.io/badge/MCP-Native-green?style=for-the-badge)](https://docs.cspr.cloud/agentic-tools/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**CasperGuard AI** is an advanced, autonomous agentic security system built for the Casper ecosystem. It continuously audits smart contracts for vulnerabilities, monitors validator health in real-time, and detects network anomalies—all without human intervention. Designed for the Casper Agentic Buildathon 2026.

---

## 🌟 Key Features

1. **AI-Powered Smart Contract Audits:** Automatically scans `.rs` files or Wasm binaries using Large Language Models (LLM) combined with static analysis rules.
2. **On-Chain Audit Immutable Ledger:** Audit reports, risk scores, and identified vulnerabilities are permanently hashed and logged directly on the Casper Testnet via our native `AuditRegistry` smart contract.
3. **Network Health Monitoring (Sentinel):** A background daemon that continuously analyzes network metrics (uptime, self-stake ratios, commission rates) via CSPR.cloud and flags malicious or failing validators.
4. **Autonomous Machine-to-Machine Payments:** Fully implements the **x402 Protocol**, allowing autonomous agents to pay for audit API endpoints using CSPR microtransactions.
5. **CSPR.click Integration:** Seamless wallet integration for decentralized app authentication.

## 🏗️ Architecture

```mermaid
graph TD
    UI[Frontend: Next.js + CSPR.click] -->|HTTP Request| API[Backend: Node.js API]
    API -->|x402 Payment Gate| X402[x402 Facilitator]
    API -->|LLM Prompt| AI[OpenAI / Gemini]
    API -->|Deploy Transaction| Contract[AuditRegistry Smart Contract]
    
    Sentinel[Network Sentinel Daemon] -->|Polls| CSPRCloud[CSPR.cloud API]
    Sentinel -->|Alerts| DB[(Local SQLite DB)]
    
    Contract --> Casper[Casper Testnet (Condor)]
```

## 📚 Documentation Directory

Explore the complete guide to using, deploying, and presenting CasperGuard AI:

- 📖 **[Usage Guide](docs/USAGE.md)**: How to navigate the UI, request audits, and monitor the network.
- 🚀 **[Deployment Guide](docs/DEPLOYMENT.md)**: Step-by-step instructions for deploying the backend, frontend, and smart contract.
- 🎭 **[Demo Scenarios](docs/DEMO_SCENARIOS.md)**: Ready-to-use scripts for pitching and demonstrating the product to hackathon judges.
- 🔐 **[GitHub Setup (Open Source Guide)](docs/GITHUB_SETUP.md)**: How to safely push this project to a public repository without leaking private keys.

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Rust + `cargo`
- Casper account with Testnet funds

### 1. Start the Backend
```bash
cd backend
npm install
cp .env.example .env # Add your API keys!
npm run build
npm start
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the UI.

## 📜 License
This project is open-source and licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
