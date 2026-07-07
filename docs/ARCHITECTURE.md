# ⚙️ Architecture

CasperGuard AI is designed as a decentralized, agentic workflow. It bridges the gap between Web3 (Casper Network) and AI (Large Language Models) to create a fully autonomous security auditor.

## System Diagram

```mermaid
graph TD
    User([User / Developer]) -->|Connects Wallet| UI[Next.js Frontend]
    UI -->|Signs Transfer Deploy| Wallet[Casper Wallet Extension]
    Wallet -->|Broadcasts TX| CasperRPC[Casper Testnet RPC]
    
    UI -->|Initiates Audit| API[Node.js Backend / Express]
    
    API -->|Validates Payment Hash| CasperRPC
    API -->|Fetches Bytecode/ABI| CSPRCloud[CSPR.cloud REST API]
    API -->|Fetches Source Code| GitHub[GitHub (If provided)]
    
    API -->|Orchestrates LLM| Router[LLM Router]
    Router -->|Prompt & Code| LLM[OpenRouter / OpenAI]
    LLM -->|Returns JSON Findings| Router
    
    API -->|Executes Refund Deploy| CasperRPC
    API -->|Logs Audit Record| Registry[AuditRegistry Smart Contract]
    
    Registry -->|Immutable Ledger| CasperRPC
```

## The Agent Loop (`AuditorAgent`)

The core of the backend is the `AuditorAgent` class, which executes a strict deterministic state machine:

1. **Payment Verification**: Wait for the frontend's `deployHash` to be finalized on the Casper Testnet.
2. **Source Material Retrieval**: 
   - Fetch smart contract data via `CSPR.cloud` MCP.
   - Fetch Rust source code via GitHub API if a URL is provided.
3. **Static Pattern Analysis**: Run RegEx and AST-based static analysis to quickly identify common Rust/Casper anti-patterns.
4. **LLM Deep Analysis**: Send the source code to the LLM (e.g., `Gemma-3-27B-IT`) with a highly specific security prompt. The LLM identifies complex logic flaws, Reentrancy, and standard violations (CEP-18/CEP-78).
5. **Scoring & Merging**: Merge static and AI findings to generate a final Risk Score (0-100).
6. **On-Chain Registry Logging**: Broadcast a transaction to the `AuditRegistry` contract to log the final score and contract hash immutably.
7. **Refund Execution**: Calculate exact API costs, apply the platform margin, and refund any remaining user budget via a native Casper Transfer.

## CSPR.cloud Integration

CasperGuard AI relies heavily on [CSPR.cloud](https://make.services/cspr-cloud) to pull real-time blockchain state.

Instead of running a heavy archival node, the Agent queries CSPR.cloud REST endpoints to retrieve:
- Contract dictionaries and ABIs.
- Historical contract deploys to verify upgrade events.
- Validator performance metrics for the "Sentinel" health dashboard.
