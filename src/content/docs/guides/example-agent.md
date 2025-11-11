---
title: Example Agent
---
This guide walks through the included example agent, which demonstrates core Assegai functionality: wallet address retrieval, balance checking, transaction requests, and logging.

## Overview

The example agent performs the following actions:

1. Retrieves the connected wallet address for a local chain
2. Checks the wallet's ETH balance
3. Requests a small demo transaction (0.0001 ETH)
4. Runs a heartbeat loop, logging status every 60 seconds

This agent is designed to run against a local testnet (Anvil) on chain ID 31337.

## Project Structure

```
example-agent/
├── assegai.json    # Agent manifest
├── package.json    # Node.js dependencies
├── index.js        # Main agent logic
└── sdk.js          # AssegaiSDK helper class
```

## The Manifest

```json
{
  "name": "Local Test Agent",
  "version": "1.0.0",
  "runtime": "node",
  "entrypoint": "index.js",
  "permissions": {
    "chains": ["eip155:31337"],
    "rpcs": {
      "eip155:31337": "http://host.docker.internal:8545"
    },
    "apis": [],
    "contracts": []
  },
  "resources": {
    "memory": "256MB",
    "cpu": "0.5"
  },
  "spending_limits": {
    "per_transaction": "1.0",
    "daily": "10.0",
    "weekly": "50.0",
    "monthly": "100.0"
  }
}
```

Key points:

- **Chain**: `eip155:31337` is the local Anvil testnet
- **RPC**: Points to `host.docker.internal:8545`, accessible from inside the container
- **Resources**: Limited to 256MB RAM and 0.5 CPU cores
- **Spending limits**: Generous limits for testing (1 ETH per transaction, 10 ETH daily)

## The SDK (`sdk.js`)

The example includes a simple SDK wrapper for the Assegai API proxy:

```javascript
export class AssegaiSDK {
  constructor() {
    this.apiProxyUrl = process.env.ASSEGAI_API_PROXY || 
                       'http://host.docker.internal:8765';
    this.agentId = process.env.ASSEGAI_AGENT_ID || '';
    this.agentToken = process.env.ASSEGAI_AGENT_TOKEN || '';
  }

  async fetch(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Assegai-Agent-ID': this.agentId,
      'X-Assegai-Agent-Token': this.agentToken,
      ...options.headers
    };
    
    const response = await fetch(`${this.apiProxyUrl}${path}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorPayload = await response.json();
      throw new Error(errorPayload.error || 'Request failed');
    }
    
    return response.json();
  }
}
```

The SDK:

- Reads configuration from environment variables injected by Assegai
- Adds authentication headers to all requests
- Handles errors from the API proxy
- Provides convenience methods for common operations

### Key SDK Methods

**`requestTransaction(params)`**

Requests a transaction approval:

```javascript
const txHash = await assegai.requestTransaction({
  chain: 'eip155:31337',
  to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  value: '100000000000000',  // 0.0001 ETH in wei
  data: '0x'
});
```

This will display an approval prompt in the Assegai UI and block until the user approves or rejects.

**`queryChain(chain, method, params)`**

Executes an RPC call:

```javascript
const balance = await assegai.queryChain(
  'eip155:31337',
  'eth_getBalance',
  [address, 'latest']
);
```

**`getWalletAddress(chain)`**

Retrieves the connected wallet address:

```javascript
const address = await assegai.getWalletAddress('eip155:31337');
```

**`getBalance(chain, address)`**

Convenience wrapper for `eth_getBalance`:

```javascript
const balanceWei = await assegai.getBalance('eip155:31337', address);
```

**`log(level, message)`**

Sends a log message to Assegai:

```javascript
await assegai.log('info', 'Agent started successfully');
await assegai.log('error', 'Failed to connect to RPC');
```

Supported levels: `info`, `warn`, `error`, `success`

## Main Agent Logic (`index.js`)

### Setup

```javascript
import { AssegaiSDK } from './sdk.js';

const assegai = new AssegaiSDK();
const LOCAL_CHAIN = 'eip155:31337';
```

### Helper Function

```javascript
function formatEth(wei) {
  if (!wei || wei === '0') return '0.0000';
  const weiBigInt = BigInt(wei);
  const ethAsInteger = weiBigInt / BigInt(10**14);
  return (parseFloat(ethAsInteger.toString()) / 10000).toFixed(4);
}
```

This formats wei amounts as human-readable ETH with 4 decimal places.

### Balance Checking

```javascript
async function checkBalance() {
  try {
    const address = await assegai.getWalletAddress(LOCAL_CHAIN);
    await assegai.log('info', `✅ Wallet address found: ${address}`);
    
    const balanceWei = await assegai.getBalance(LOCAL_CHAIN, address);
    await assegai.log('info', `💰 Current balance: ${formatEth(balanceWei)} ETH`);
  } catch (error) {
    await assegai.log('error', `❌ Failed to check balance: ${error.message}`);
  }
}
```

This function:

1. Retrieves the wallet address for the local chain
2. Queries the balance via RPC
3. Logs the formatted balance
4. Handles errors gracefully

### Transaction Request

```javascript
async function requestDemoTransaction() {
  try {
    const demoAmountWei = '100000000000000'; // 0.0001 ETH
    const demoRecipient = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

    await assegai.log('info', 
      `💸 Requesting demo transaction: ${formatEth(demoAmountWei)} ETH to ${demoRecipient}`
    );
    await assegai.log('info', '👉 Please approve the transaction in the Assegai UI.');

    const txHash = await assegai.requestTransaction({
      chain: LOCAL_CHAIN,
      to: demoRecipient,
      value: demoAmountWei,
      data: '0x'
    });

    await assegai.log('success', `✅ Transaction sent! Hash: ${txHash}`);
  } catch (error) {
    await assegai.log('warn', 
      `⚠️ Transaction request failed or was rejected: ${error.message}`
    );
  }
}
```

Key points:

- The transaction is for 0.0001 ETH to vitalik.eth's address
- The `requestTransaction` call blocks until user action
- If approved, the function receives the transaction hash
- If rejected or timed out, an error is thrown

### Main Loop

```javascript
async function main() {
  await assegai.log('info', '🚀 MVP Showcase Agent starting...');
  await checkBalance();
  
  // Request transaction after 5 seconds
  setTimeout(requestDemoTransaction, 5000);

  // Heartbeat every 60 seconds
  await assegai.log('info', '🕐 Main loop started. Will check balance every 60 seconds.');
  setInterval(() => {
    assegai.log('info', '💓 Agent heartbeat...');
    checkBalance();
  }, 60000);
}
```

The agent:

1. Logs startup
2. Checks balance immediately
3. Waits 5 seconds then requests the demo transaction
4. Starts a heartbeat loop that checks balance every 60 seconds

### Graceful Shutdown

```javascript
const shutdown = async (signal) => {
  await assegai.log('info', `🛑 Received ${signal}. Agent shutting down...`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

The agent handles termination signals gracefully, logging the shutdown before exiting.

### Error Handling

```javascript
main().catch(async (error) => {
  await assegai.log('error', 
    `💥 A fatal error occurred during startup: ${error.message}`
  );
  process.exit(1);
});
```

Fatal errors during startup are logged and cause the agent to exit with a non-zero code.

## Running the Example

### Prerequisites

1. Install and start Anvil:

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Start Anvil
anvil
```

2. Connect to Assegai using the local test account

### Installation

1. Open Assegai
2. Click **"Install Agent"**
3. Navigate to the example agent directory
4. Click **"Select Folder"**

Assegai will build the Docker image and register the agent.

### Running

1. Click **"Start"** on the agent card
2. The agent will begin executing
3. After 5 seconds, a transaction approval overlay will appear
4. Click **"Approve & Sign"** to execute the transaction

### Viewing Logs

Click **"Logs"** on the agent card to view real-time output:

```
[2024-11-10T15:23:10.123Z] [INFO] 🚀 MVP Showcase Agent starting...
[2024-11-10T15:23:10.234Z] [INFO] ✅ Wallet address found: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
[2024-11-10T15:23:10.345Z] [INFO] 💰 Current balance: 10000.0000 ETH
[2024-11-10T15:23:15.456Z] [INFO] 💸 Requesting demo transaction: 0.0001 ETH to 0xd8dA...2913
[2024-11-10T15:23:15.567Z] [INFO] 👉 Please approve the transaction in the Assegai UI.
[2024-11-10T15:23:20.678Z] [SUCCESS] ✅ Transaction sent! Hash: 0xabc123...
```

## Customizing the Example

### Changing the Amount

Modify the `demoAmountWei` variable:

```javascript
const demoAmountWei = '1000000000000000000'; // 1.0 ETH
```

### Adding More Transactions

Call `requestDemoTransaction()` multiple times or in different contexts:

```javascript
// Request transaction every 10 minutes
setInterval(requestDemoTransaction, 600000);
```

### Different Recipient

Change the `demoRecipient` address:

```javascript
const demoRecipient = '0xYourAddressHere';
```

### ERC20 Transfers

To send tokens instead of native ETH:

```javascript
const erc20Transfer = {
  chain: LOCAL_CHAIN,
  to: '0xTokenContractAddress',
  value: '0',  // Must be 0 for ERC20
  data: '0xa9059cbb' +  // transfer(address,uint256)
        '000000000000000000000000' + recipientAddress.slice(2) +
        amount.toString(16).padStart(64, '0')
};

await assegai.requestTransaction(erc20Transfer);
```

**Note**: Token transfers require token allowances to be configured in the agent settings. See [Transaction Limits](transaction-limits) for details.

## Common Issues

### "Agent not authenticated"

Ensure the agent is starting with the correct environment variables. These are injected automatically by Assegai and should not be hardcoded.

### "Chain not whitelisted"

Verify the chain ID in your manifest matches what you're requesting:

```json
"chains": ["eip155:31337"]
```

### "RPC connection failed"

Check that Anvil is running on `localhost:8545` and accessible from Docker. On some systems, you may need to bind Anvil to `0.0.0.0`:

```bash
anvil --host 0.0.0.0
```

### Transaction approval timeout

Transaction requests timeout after 5 minutes. Approve or reject promptly to avoid timeouts.

## Next Steps

Now that you understand the example agent:

- Explore [Transaction Limits](transaction-limits) to control spending
- Read the [API Proxy Reference](api-proxy-reference) for complete SDK documentation
- Learn about [Docker Isolation](docker-isolation) to understand the security model