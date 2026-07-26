# Contributing to Arzing AI

First off, thank you for considering contributing to **Arzing AI**! It's people like you that make Arzing AI such a great platform for autonomous smart contract auditing and real-time network monitoring on the Casper Network.

The following is a set of guidelines for contributing to Arzing AI and its packages, which are hosted in the [Arzing AI Repository](https://github.com/furkanahmetk/arzing-ai) on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Styleguides](#styleguides)
  - [Git Commit Messages](#git-commit-messages)
  - [Code Formatting](#code-formatting)
- [Local Development Setup](#local-development-setup)

## Code of Conduct

This project and everyone participating in it is governed by the [Arzing AI Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Arzing AI. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- **Check open issues** before creating a new one to avoid duplicates.
- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps** which reproduce the problem in as many details as possible.
- **Describe the behavior you observed** after following the steps and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead** and why.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When you are creating an enhancement issue, please include:

- **A clear and descriptive title**.
- **A step-by-step description** of the suggested enhancement in as many details as possible.
- **Specific examples** to demonstrate the steps.
- **Why this enhancement would be useful** to most Arzing AI users.

### Your First Code Contribution

Unsure where to begin contributing to Arzing AI? You can start by looking through these `good first issue` and `help wanted` issues:

- [Good First Issues](https://github.com/furkanahmetk/arzing-ai/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [Help Wanted Issues](https://github.com/furkanahmetk/arzing-ai/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)

### Pull Requests

The process described here has several goals:

1. Maintain Arzing AI's quality
2. Fix problems that are important to users
3. Engage the community in working toward the best possible platform
4. Enable a sustainable system for Arzing AI's maintainers to review contributions

**Steps for Submitting a PR:**

1. **Fork the repository** and clone it locally.
2. **Create a branch** for your edits (`git checkout -b feature/your-feature-name`).
3. **Make your changes** locally. Ensure the test suite passes if applicable.
4. **Commit your changes** using [Conventional Commits](#git-commit-messages).
5. **Push to your fork** and submit a Pull Request against the `main` branch.
6. Link any relevant issues in the PR description (e.g., `Fixes #123`).

## Styleguides

### Git Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for our commit messages. This leads to more readable messages that are easy to follow when looking through the project history.

**Format:**
    <type>(<scope>): <subject>

**Allowed Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

**Example:**
`feat(auditor): add continuous monitoring loop for active validators`

### Code Formatting

- We use standard tools (e.g., Prettier/ESLint for TypeScript, `cargo fmt` for Rust/Odra contracts).
- Before submitting a PR, please ensure you have run the appropriate formatters and linters.

## Local Development Setup

To get a local copy up and running, follow these simple steps:

1. Clone the repo:
    git clone https://github.com/furkanahmetk/arzing-ai.git

2. Navigate to the project directory:
    cd arzing-ai

3. Install dependencies:
    npm install

4. Start the development server:
    npm run dev

*(Note: Please refer to the README.md for more specific environment variable setups and smart contract deployment steps).*

---
*Thank you for helping make Arzing AI better!*
