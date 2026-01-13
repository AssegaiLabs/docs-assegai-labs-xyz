---
title: Building Agents
description: How to create and package agents for Assegai
---

An Assegai agent is essentially a Dockerized Node.js application that uses the `@assegailabs/sdk` to interact with the world.

## Directory Structure

A valid agent requires a specific directory structure:

```text
my-agent/
├── assegai.json        # The Agent Manifest
├── package.json        # Standard Node.js dependencies
├── index.js            # Entry point (your code)
└── Dockerfile          # (Optional) Custom build instructions
```

## The Manifest (`assegai.json`)

This file defines your agent's identity, permissions, and resource requirements.

```json
{
  "name": "DeFi Sniper",
  "version": "1.0.0",
  "runtime": "node",
  "entrypoint": "index.js",
  "permissions": {
    "chains": ["eip155:1", "eip155:8453"],
    "rpcs": {
      "eip155:1": "https://eth.llamarpc.com",
      "eip155:8453": "https://mainnet.base.org"
    },
    "apis": ["openai", "anthropic"],
    "contracts": ["0x..."]
  },
  "resources": {
    "memory": "512MB",
    "cpu": "1.0"
  },
  "spending_limits": {
    "per_transaction": "0.1",
    "daily": "1.0",
    "weekly": "5.0",
    "monthly": "20.0"
  }
}
```

### Configuration Fields

| Field | Description |
| :--- | :--- |
| `runtime` | Currently supports `node`. |
| `permissions.chains` | Array of CAIP-2 chain identifiers the agent can access (e.g., `eip155:1` for Ethereum). |
| `permissions.apis` | Array of AI services required (e.g., `["openai", "anthropic"]`). |
| `spending_limits` | Limits defined in the native currency (e.g., ETH). |

## Agent Code (`index.js`)

Your agent must import the SDK to perform sensitive actions.

```javascript
import { AssegaiSDK } from '@assegailabs/sdk';

const sdk = new AssegaiSDK();

async function start() {
  await sdk.info('Agent initializing...');

  // 1. Get the user's connected wallet address
  const address = await sdk.getWalletAddress('eip155:1');
  
  // 2. Read data (No approval needed)
  const balance = await sdk.getBalance('eip155:1', address);
  await sdk.info(`Balance: ${BigInt(balance)} wei`);
  
  // 3. Execute Action (Triggers User Approval Popup)
  try {
    const txHash = await sdk.requestTransaction({
      chain: 'eip155:1',
      to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      value: '1000000000000000', // Wei
      data: '0x'
    });
    await sdk.success(`Transaction mined: ${txHash}`);
  } catch (error) {
    await sdk.error('Transaction failed or was rejected');
  }
}

start();
```

## Installing Your Agent

1.  Open the Assegai Sandbox App.
2.  Click **"Install Agent"**.
3.  Select the folder containing your `assegai.json`.
4.  The Sandbox will build the Docker image locally.
5.  Click **"Start"** on the new Agent Card.
