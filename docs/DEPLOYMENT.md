# 🚀 Deployment Guide

This guide covers how to deploy the CasperGuard AI stack to a production environment.

## 1. Smart Contract Deployment (Casper Testnet)

The on-chain component is built with Rust and the Odra Framework.

1. **Compile the Contract:**
   ```bash
   cd contracts
   cargo build --release --target wasm32-unknown-unknown
   ```

2. **Deploy via Casper Client:**
   Ensure you have a funded `secret_key.pem` for the Testnet.
   ```bash
   casper-client put-deploy \
     --node-address https://node.testnet.casper.network/rpc \
     --chain-name casper-test \
     --secret-key ./keys/secret_key.pem \
     --session-path ./target/wasm32-unknown-unknown/release/AuditRegistry.wasm \
     --payment-amount 500000000000 \
     --session-arg "odra_cfg_package_hash_key_name:string='casperguard_pkg'" \
     --session-arg "odra_cfg_allow_key_override:bool='true'" \
     --session-arg "odra_cfg_is_upgradable:bool='true'" \
     --session-arg "odra_cfg_constructor:string='init'" \
     --session-arg "odra_cfg_is_upgrade:bool='false'" \
     --session-arg "odra_cfg_is_factory_upgrade:bool='false'"
   ```

3. **Capture the Package Hash:**
   Once the deploy is executed, find your transaction on [testnet.cspr.live](https://testnet.cspr.live). Copy the resulting `hash-...` package string and place it in your backend `.env` file under `AUDIT_REGISTRY_CONTRACT_HASH`.

## 2. Backend Deployment (Node.js)

The backend handles the AI LLM logic, CSPR.cloud ingestion, and on-chain writing.

1. **Build the Backend:**
   ```bash
   cd backend
   npm install
   npm run build
   ```

2. **Environment Variables:**
   Create a `.env` file referencing `.env.example`. Ensure your `AGENT_PRIVATE_KEY` path is absolute and points to a secure location on your server.

3. **Run with PM2:**
   For production stability, use PM2:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name "casperguard-backend"
   pm2 save
   ```

## 3. Frontend Deployment (Vercel / Next.js)

The frontend is a Next.js 14 application.

1. **Vercel Deployment (Recommended):**
   - Push your repository to GitHub (ensure `.env` and `keys/` are ignored!).
   - Import the project into Vercel.
   - Set the Root Directory to `frontend`.
   - Add your Frontend Environment Variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CSPR_CLICK_APP_ID`).
   - Click **Deploy**.

2. **Manual Server Deployment:**
   ```bash
   cd frontend
   npm install
   npm run build
   npm start
   ```
