---
title: Overview
description: Overview of the Assegai AI Sandbox
---

:::caution[Work in Progress]
This project is currently in active development and pending open-source release. Documentation, APIs, and features are subject to change without notice.
:::

## What is Assegai AI Sandbox?

The Assegai AI Sandbox is an Electron-based desktop application (cross-platform: macOS, Windows, Linux) that allows users to run AI agents in Docker containers for on-chain blockchain activity.

## Core Features

### Agent Management
- Install agents from local directories with `assegai.json` manifest files
- Automatic Docker image building for Node.js runtime agents
- Start and stop agents with resource limits (CPU, memory)
- View real-time agent logs

### Wallet Integration
- **WalletConnect**: Connect external wallets via WalletConnect protocol
- **Local Development**: Connect with private key for local testnet development (Anvil, Hardhat, etc.)
- Configurable local RPC endpoint URL

### Transaction Control
- All transactions require explicit user approval
- Transaction approval interface with full transaction details
- View transaction history with status tracking
- Spending limits enforced at multiple levels:
  - Per-transaction limit
  - Daily spending limit  
  - Weekly spending limit
  - Monthly spending limit

### Token Allowances
- Configure spending allowances per token per chain
- Support for native assets (ETH, etc.) and ERC-20 tokens
- Automatic allowance checking before transaction execution

### AI API Integration
- Proxied access to OpenAI and Anthropic APIs
- Encrypted API key storage using Electron's safeStorage
- Automatic cost tracking using LiteLLM pricing data
- Rate limiting per agent per service

### Network Access
- Whitelisted RPC endpoints per agent per chain
- Support for custom RPC URLs
- Docker network isolation

## Architecture

![image info](../../../assets/arch.svg)

### Agent Isolation
Agents run in Docker containers with:
- Resource limits (configurable CPU and memory)
- Read-only root filesystem
- No root privileges
- Isolated network (custom Docker bridge)
- Dedicated workspace volumes

### Security Model
- API proxy server runs on localhost:8765
- Agent authentication via generated tokens
- No direct external network access from containers
- Host access via `host.docker.internal`

## Agent Manifest Format

Agents require an `assegai.json` manifest:

```json
{
  "name": "My Agent",
  "version": "1.0.0",
  "runtime": "node",
  "entrypoint": "index.js",
  "permissions": {
    "chains": ["eip155:1"],
    "rpcs": {
      "eip155:1": "https://eth-mainnet.example.com"
    },
    "apis": ["openai", "anthropic"]
  },
  "resources": {
    "memory": "512M",
    "cpu": "0.5"
  },
  "spending_limits": {
    "per_transaction": "0.01",
    "daily": "0.1",
    "weekly": "0.5",
    "monthly": "2.0"
  }
}
```

## Database

The application uses sql.js (SQLite in WebAssembly) to store:
- Agent configurations and status
- Transaction history
- Spending limits and current spending
- Token allowances per chain
- Whitelisted RPC endpoints
- API usage logs
- Application settings

## Status

Currently in MVP development. Core functionality is implemented for:
- Docker-based agent execution
- Transaction approval workflows
- Spending controls
- Wallet connectivity
- AI API access

## Getting Started

To begin using the Assegai AI Sandbox:

1. Install the application for your platform
2. Connect a wallet (WalletConnect or local dev account)
3. Install an agent from a local directory
4. Configure spending limits and token allowances
5. Start the agent

For local development, ensure you have:
- Docker Desktop installed and running
- A local testnet running (Anvil, Hardhat, Ganache, etc.) if using dev wallet mode

## Contact

- **Email**: dev@assegailabs.xyz
- **GitHub**: [github.com/assegailabs](https://github.com/assegailabs)
- **Website**: [assegailabs.xyz](https://sandbox.assegailabs.xyz)