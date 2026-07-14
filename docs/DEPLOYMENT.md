# 🚀 Deployment Guide

This guide covers how to deploy the **CasperGuard AI** stack to a production environment.

## 0. Local Development (Quickstart)
If you just want to run the project locally for testing or the Buildathon demo, simply use the provided `Makefile` at the root of the project:
```bash
make install
make dev
```
*(Ensure `.env` files are configured before running `make dev`)*

## 1. Smart Contract Deployment (Casper Testnet)

The on-chain registry component is built with Rust and the **Odra Framework**.

### 1.1 Compile the Contract
```bash
cd contracts
cargo odra build
```

### 1.2 Deploy via Casper Client
Ensure you have a funded `secret_key.pem` for the Testnet.

```bash
casper-client put-deploy \
  --node-address https://node.testnet.casper.network/rpc \
  --chain-name casper-test \
  --secret-key ./keys/secret_key.pem \
  --session-path ./wasm/AuditRegistry.wasm \
  --payment-amount 300000000000 \
  --session-arg "odra_cfg_package_hash_key_name:string='casperguard_pkg'" \
  --session-arg "odra_cfg_allow_key_override:bool='true'" \
  --session-arg "odra_cfg_is_upgradable:bool='true'" \
  --session-arg "odra_cfg_is_upgrade:bool='false'"
```

### 1.3 Authorize the Backend Agent
You must set your backend wallet as the authorized agent to submit audits:
```bash
casper-client put-deploy \
  --node-address https://node.testnet.casper.network/rpc \
  --chain-name casper-test \
  --secret-key ./keys/secret_key.pem \
  --session-package-hash hash-YOUR_CONTRACT_PACKAGE_HASH \
  --session-entry-point "set_agent" \
  --payment-amount 5000000000 \
  --session-arg "new_agent:key='account-hash-YOUR_BACKEND_ACCOUNT_HASH'"
```

### 1.4 Capture the Package Hash
After the deploy is executed and finalized, check `cspr.live` for the deploy hash. You will need the resulting **Contract Package Hash** to configure the backend.

Update `backend/.env` with the hash:
```env
AUDIT_REGISTRY_CONTRACT_HASH=hash-YOUR_CONTRACT_PACKAGE_HASH
```

---

## 2. Backend Agent Node Setup (VPS / Docker)

The backend is a Node.js Express server running the AI agent loop.

### 2.1 Clone & Install
```bash
git clone <repo-url>
cd casperguard-ai/backend
npm install
```

### 2.2 Configure Environment
Copy `.env.example` to `.env` and fill in:
- `OPENROUTER_API_KEY` or `OPENAI_API_KEY`
- `CASPER_NODE_URL`
- `CSPR_CLOUD_API_KEY`
- `AGENT_PRIVATE_KEY` (Absolute path to the `.pem` file funded for gas and refunds)

### 2.3 Run via PM2
For production persistence, use `pm2`:
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name "casperguard-agent"
```

---

## 3. Frontend Deployment

The frontend is a Next.js application that integrates with Casper Wallet. You can deploy it natively on your VPS alongside the backend, or use a managed service like Vercel.

### Option A: Native VPS Deployment (PM2)
If you are deploying the backend on a VPS, you can also host the frontend on the same server to keep everything unified.

1. **Configure Environment:**
```bash
cd casperguard-ai/frontend
cp .env.local.example .env.local
```
Edit `.env.local` and ensure `NEXT_PUBLIC_BACKEND_URL` points to your backend (e.g., `http://your-server-ip:4000` or your domain).

2. **Build and Run with PM2:**
```bash
npm install --legacy-peer-deps
npm run build
pm2 start npm --name "casperguard-frontend" -- run start
```
*(By default, this will run the frontend on port `3000`. You can configure a reverse proxy like **Nginx** to map port 80/443 to `3000` and `4000`)*.

### Option B: Managed Deployment (Vercel)
1. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Select your `casperguard-ai` repository.
3. Under **Framework Preset**, Next.js should be automatically selected.
4. Set the **Root Directory** to `frontend`.
5. Add Environment Variables:
   - `NEXT_PUBLIC_BACKEND_URL`: URL of your deployed backend (e.g., `https://api.casperguard.com`)
   - `NEXT_PUBLIC_CASPER_CHAIN_NAME`: `casper-test`
6. Click **Deploy**. Vercel will build and serve the application. (Ensure `styled-components` version `5.3.11` is maintained in `package.json` to prevent Casper Wallet UI conflicts).
