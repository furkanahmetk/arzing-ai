# 📜 Smart Contracts

CasperGuard AI utilizes the **Odra Framework** to build secure, upgradeable smart contracts on the Casper Network.

## 1. The Audit Registry Contract

The primary smart contract is the `AuditRegistry`. Its purpose is to act as an immutable ledger for all security audits performed by the CasperGuard AI agent. 

By logging audits on-chain, developers can programmatically verify if a specific smart contract package has been audited and what its risk score is, enabling dynamic DeFi integrations (e.g., a DEX refusing to list a token with a risk score > 60).

### Core Data Structures
```rust
pub struct AuditRecord {
    pub contract_hash: String,
    pub risk_score: u8,
    pub audited_by: Address,
    pub timestamp: u64,
    pub findings_ipfs_hash: String, // Or plain string summary for MVP
}
```

### Entry Points
- `log_audit(contract_hash, risk_score, findings)`: Called exclusively by the Agent's verified wallet address. Stores the audit result in the registry.
- `get_audit(contract_hash)`: Public read function to retrieve the latest audit score for a specific contract.

## 2. On-Chain Financial Flow (x402 & Refunds)

CasperGuard AI eliminates the need for mock signatures by using real `TransferDeploy` mechanisms via the native Casper Wallet SDK.

### 2.1 The Fee Payment (User -> Platform)
When a user requests an audit:
1. The frontend calculates an estimated maximum budget (e.g., `15.5 CSPR`).
2. A `DeployUtil.ExecutableDeployItem.newTransfer` is generated.
3. The user signs the real transfer using the Casper Wallet UI.
4. The frontend broadcasts the signed deploy to the `casper-test` network via `CasperServiceByJsonRPC`.
5. The `deployHash` is passed to the backend Agent.

### 2.2 The Refund Execution (Platform -> User)
After the AI completes the audit, the exact LLM token cost is calculated.
If the actual cost (plus the 30% platform margin) is less than the user's prepayment:
1. The Agent initiates a secondary `TransferDeploy`.
2. The Agent signs the transaction using its securely stored `AGENT_PRIVATE_KEY`.
3. The remaining CSPR is refunded directly to the user's `userAddress`.
4. The `refundHash` is explicitly listed in the final Audit Report for complete financial transparency.
