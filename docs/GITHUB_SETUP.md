# 🔐 Open Source & GitHub Push Guide

Since **CasperGuard AI** is participating in a public hackathon (Casper Agentic Buildathon), the repository must be open-sourced. However, the project handles real Private Keys (`.pem`) and API keys.

**Follow this guide strictly to ensure zero credentials are leaked when pushing to GitHub.**

## 1. Verify your `.gitignore`

Before running `git add .`, verify that your `.gitignore` contains the following lines:

```gitignore
# Keys — NEVER commit private keys!
*.pem
secret_key*
keys/

# Environment
.env
*.env.local

# Database
*.db
*.db-wal
*.db-shm
```
*Note: We have already configured this for you in the root `.gitignore`.*

## 2. Prepare Example `.env` files

Since your real `.env` is ignored, developers cloning your repo won't know what variables to set.
Ensure you provide a `.env.example` in the `backend/` directory:

```env
# backend/.env.example
PORT=4000
OPENAI_API_KEY=your_openai_key_here
CASPER_NODE_URL=https://node.testnet.casper.network
CASPER_NETWORK_NAME=casper-test
CSPR_CLOUD_API_KEY=your_cspr_cloud_key
AGENT_PRIVATE_KEY=/absolute/path/to/keys/secret_key.pem
AGENT_PUBLIC_KEY=your_public_key_hex
AUDIT_REGISTRY_CONTRACT_HASH=hash-...
```

## 3. Scrubbing Git History (If you made a mistake)

If you accidentally committed `secret_key.pem` or `.env` locally BEFORE adding them to `.gitignore`, simply removing them now is **NOT ENOUGH** (they will remain in the git history).

If this happened, you must reset your git repository:
```bash
# Danger: This removes all git history and starts fresh
rm -rf .git
git init
git add .
git commit -m "Initial commit: CasperGuard AI Platform"
```

## 4. Pushing to GitHub

Once everything is scrubbed and ignored:

```bash
git remote add origin https://github.com/YOUR_USERNAME/casperguard-ai.git
git branch -M main
git push -u origin main
```

**Final Check:** Open your GitHub repository in the browser. Navigate to the `backend/` folder. If you see `.env` or `keys/secret_key.pem`, **DELETE THE REPOSITORY IMMEDIATELY**, revoke the leaked keys, and start over.
