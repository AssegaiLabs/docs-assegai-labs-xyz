---
title: Agents Overview
description: Understanding Assegai Agents, their structure, and security model.
---

Agents are containerized programs that run in Docker with controlled access to blockchain networks and AI APIs. Each agent runs in strict isolation with defined permissions, resource limits, and a mandatory "Human-in-the-Loop" approval flow for transactions.

## Agent Capabilities

Agents are designed to be autonomous but safe. They can:

- **Query Blockchain Data**: Read data from whitelisted RPC endpoints (e.g., getting balances, simulating transactions).
- **Request Transactions**: Propose transactions that require user approval to execute.
- **Use AI Models**: Access configured LLMs (OpenAI, Anthropic) via the secure proxy.
- **Persist Data**: Read and write to a dedicated `/agent-workspace` volume.
- **Log Activity**: Send structured logs to the user dashboard.

## Agent Structure

A minimal agent requires the following file structure:

```text
my-agent/
├── assegai.json       # Manifest configuration
├── index.js           # Main entry point
├── Dockerfile         # (Optional) Custom build steps
└── package.json       # Node.js dependencies
```

## Chain Identifiers

Assegai uses [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) chain identifiers for cross-chain compatibility:

| Chain | CAIP-2 Identifier |
| :--- | :--- |
| Ethereum Mainnet | `eip155:1` |
| Polygon | `eip155:137` |
| Base | `eip155:8453` |
| Optimism | `eip155:10` |
| Arbitrum One | `eip155:42161` |
| Sepolia (Testnet) | `eip155:11155111` |
| Anvil (Local) | `eip155:31337` |
