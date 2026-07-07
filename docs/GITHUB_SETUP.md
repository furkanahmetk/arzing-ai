# 🔐 Open Source & GitHub Push Guide

Since **CasperGuard AI** is participating in a public hackathon (Casper Agentic Buildathon), you will likely need to push it to a new, empty GitHub repository. However, the project handles real Private Keys (`.pem`) and API keys.

**Follow this guide strictly to ensure zero credentials are leaked when pushing to GitHub.**

## 1. Verify your `.gitignore`

Before running any git commands, verify that your `.gitignore` contains the following lines:

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

Since your real `.env` is ignored, developers cloning your repo won't know what variables to set. We have provided `.env.example` files in both the `backend/` and `frontend/` folders. Make sure these exist and do not contain your actual secrets.

## 3. Creating a New Repo and Pushing from Scratch

If you haven't initialized git yet, or want to start completely fresh without any commit history, follow these exact steps in your terminal:

```bash
# 1. Initialize a brand new git repository
git init

# 2. Add all files (the .gitignore will automatically skip the keys and .env files)
git add .

# 3. Create your first commit
git commit -m "Initial commit: CasperGuard AI Platform"

# 4. Rename the default branch to 'main'
git branch -M main
```

Now, go to **[GitHub.com](https://github.com/new)** and create a **New Repository**. Give it a name (e.g., `casperguard-ai`), leave it **Public**, and DO NOT initialize it with a README, .gitignore, or license (leave those unchecked).

Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/casperguard-ai.git`), then run the following in your terminal:

```bash
# 5. Link your local project to the GitHub repo
git remote add origin https://github.com/YOUR_USERNAME/casperguard-ai.git

# 6. Push your code to GitHub
git push -u origin main
```

## 4. Final Security Check 🚨

Once the push is complete, open your GitHub repository in the browser.
Navigate to:
- The `backend/` folder: **Make sure `.env` IS NOT THERE.**
- The `keys/` folder: **Make sure this folder DOES NOT EXIST or is completely empty on GitHub.**

If you see `.env` or `keys/secret_key.pem` on GitHub, **DELETE THE REPOSITORY IMMEDIATELY**, revoke any leaked keys (API or Blockchain), and start over.
