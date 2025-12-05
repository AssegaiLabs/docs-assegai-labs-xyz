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
    "chains": ["ethereum", "base"],
    "rpcs": {
      "ethereum": "[https://eth.llamarpc.com](https://eth.llamarpc.com)",
      "base": "[https://mainnet.base.org](https://mainnet.base.org)"
    },
    "apis": ["openai"],
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
| `permissions.chains` | Array of chain slugs the agent is allowed to access. |
| `permissions.apis` | Array of AI services required (e.g., `["openai", "anthropic"]`). |
| `spending_limits` | Limits defined in the native currency (e.g., ETH). |

## Agent Code (`index.js`)

Your agent must import the SDK to perform sensitive actions.

```javascript
import { AssegaiSDK } from './sdk.js';

const assegai = new AssegaiSDK();

async function start() {
  await assegai.log('info', 'Agent initializing...');

  // 1. Get the user's connected wallet address
  const address = await assegai.getWalletAddress('ethereum');
  
  // 2. Read data (No approval needed)
  const balance = await assegai.queryChain('ethereum', 'eth_getBalance', [
    address,
    'latest'
  ]);
  
  // 3. Execute Action (Triggers User Approval Popup)
  try {
    const txHash = await assegai.requestTransaction({
      chain: 'ethereum',
      to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      value: '1000000000000000', // Wei
      data: '0x'
    });
    await assegai.log('success', `Transaction mined: ${txHash}`);
  } catch (error) {
    await assegai.log('error', 'User rejected the transaction');
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