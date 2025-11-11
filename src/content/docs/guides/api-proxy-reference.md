---
title: API Proxy Reference
---
Complete reference for the Assegai API Proxy, which provides agents with access to blockchain networks, AI services, and transaction capabilities.

## Summary

The API Proxy runs on `http://host.docker.internal:8765` and exposes several endpoints for agent use:

- **Transaction Management**: Request and query transaction status
- **Blockchain Queries**: Execute RPC calls via whitelisted endpoints
- **AI Services**: Proxy requests to OpenAI and Anthropic APIs
- **Wallet Operations**: Retrieve connected wallet addresses
- **Logging**: Send messages to the Assegai UI

All requests require authentication via agent ID and token headers.

## Authentication

Every request must include these headers:

```
X-Assegai-Agent-ID: <agent-id>
X-Assegai-Agent-Token: <agent-token>
```

These are provided via environment variables:

```javascript
const agentId = process.env.ASSEGAI_AGENT_ID;
const agentToken = process.env.ASSEGAI_AGENT_TOKEN;
```

**Unauthorized requests** (missing or invalid credentials) receive:

```json
{
  "error": "Unauthorized: Missing agent credentials in headers"
}
```

## Rate Limiting

API calls are rate-limited per agent:

| Service | Window | Max Requests |
|---------|--------|--------------|
| OpenAI | 60 seconds | 100 |
| Anthropic | 60 seconds | 50 |
| RPC | 10 seconds | 30 |

Exceeding limits returns:

```json
{
  "error": "Rate limit exceeded"
}
```

Rate limiters reset automatically after the time window expires.

## Endpoints

### Health Check

```
GET /health
```

Returns the proxy status.

**Response:**

```json
{
  "status": "ok",
  "timestamp": 1699612800000
}
```

**No authentication required.**

---

### Request Transaction

```
POST /agent/request-transaction
```

Requests user approval for a blockchain transaction.

**Request Body:**

```json
{
  "chain": "eip155:1",
  "to": "0xRecipientAddress",
  "value": "1000000000000000000",
  "data": "0x",
  "gasLimit": "21000"
}
```

**Parameters:**

- **chain** (string, required): CAIP-2 chain identifier (e.g., "eip155:1", "eip155:137")
- **to** (string, required): Recipient address (0x-prefixed hex)
- **value** (string, required): Transaction value in wei
- **data** (string, optional): Transaction data payload (defaults to "0x")
- **gasLimit** (string, optional): Gas limit (defaults to "21000")

**Response (Success):**

```json
{
  "success": true,
  "txHash": "0xabcdef..."
}
```

**Response (Rejected):**

```json
{
  "error": "Transaction rejected by user"
}
```

**Possible Errors:**

- **403**: Token/chain not whitelisted, spending limit exceeded, insufficient allowance
- **429**: Rate limit exceeded
- **500**: Timeout (5 minutes), wallet error, or internal error

**Behavior:**

This endpoint **blocks** until the user approves or rejects the transaction. Implement timeouts in the agent if necessary.

**Example (Native Transfer):**

```javascript
const response = await fetch('http://host.docker.internal:8765/agent/request-transaction', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Assegai-Agent-ID': agentId,
    'X-Assegai-Agent-Token': agentToken
  },
  body: JSON.stringify({
    chain: 'eip155:1',
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    value: '1000000000000000000', // 1 ETH
    gasLimit: '21000'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Transaction sent:', result.txHash);
}
```

**Example (ERC20 Transfer):**

```javascript
// Transfer 1000 USDC (6 decimals)
const amount = '1000000000'; // 1000 * 10^6
const recipient = '0xRecipientAddress';

const data = '0xa9059cbb' + // transfer(address,uint256)
  '000000000000000000000000' + recipient.slice(2).toLowerCase() +
  parseInt(amount).toString(16).padStart(64, '0');

const response = await fetch('http://host.docker.internal:8765/agent/request-transaction', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Assegai-Agent-ID': agentId,
    'X-Assegai-Agent-Token': agentToken
  },
  body: JSON.stringify({
    chain: 'eip155:1',
    to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC contract
    value: '0', // Must be 0 for ERC20
    data: data
  })
});
```

---

### Query Chain

```
POST /agent/query-chain
```

Executes an RPC call on a whitelisted chain.

**Request Body:**

```json
{
  "chain": "eip155:1",
  "method": "eth_getBalance",
  "params": ["0xAddress", "latest"]
}
```

**Parameters:**

- **chain** (string, required): CAIP-2 chain identifier
- **method** (string, required): RPC method name
- **params** (array, required): Method parameters

**Response (Success):**

```json
{
  "result": "0x1234567890abcdef"
}
```

**Response (Error):**

```json
{
  "error": "RPC Error: <error message>"
}
```

**Possible Errors:**

- **403**: Chain not whitelisted for this agent
- **400**: RPC node returned an error
- **500**: Network error or RPC unreachable

**Common RPC Methods:**

**Get Balance:**

```javascript
{
  "chain": "eip155:1",
  "method": "eth_getBalance",
  "params": ["0xAddress", "latest"]
}
// Returns: "0x..." (wei as hex string)
```

**Get Transaction Count:**

```javascript
{
  "chain": "eip155:1",
  "method": "eth_getTransactionCount",
  "params": ["0xAddress", "latest"]
}
// Returns: "0x..." (nonce as hex string)
```

**Call Contract:**

```javascript
{
  "chain": "eip155:1",
  "method": "eth_call",
  "params": [
    {
      "to": "0xContractAddress",
      "data": "0x70a08231..." // balanceOf(address) call data
    },
    "latest"
  ]
}
// Returns: "0x..." (return data as hex)
```

**Get Block Number:**

```javascript
{
  "chain": "eip155:1",
  "method": "eth_blockNumber",
  "params": []
}
// Returns: "0x..." (block number as hex)
```

---

### Get Wallet Address

```
GET /agent/wallet-address/:chain
```

Retrieves the connected wallet's address for a specific chain.

**Parameters:**

- **chain** (path parameter): CAIP-2 chain identifier

**Response:**

```json
{
  "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Example:**

```javascript
const response = await fetch('http://host.docker.internal:8765/agent/wallet-address/eip155:1', {
  method: 'GET',
  headers: {
    'X-Assegai-Agent-ID': agentId,
    'X-Assegai-Agent-Token': agentToken
  }
});

const { address } = await response.json();
console.log('Wallet address:', address);
```

**Note:** The same wallet may have different addresses on different chains if using multi-chain wallets, but typically returns the same Ethereum address for all EVM chains.

---

### Agent Log

```
POST /agent/log
```

Sends a log message to the Assegai UI and console.

**Request Body:**

```json
{
  "level": "info",
  "message": "Agent started successfully"
}
```

**Parameters:**

- **level** (string): Log level (`info`, `warn`, `error`, `success`)
- **message** (string): Log message

**Response:**

```json
{
  "success": true
}
```

**Example:**

```javascript
await fetch('http://host.docker.internal:8765/agent/log', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Assegai-Agent-ID': agentId,
    'X-Assegai-Agent-Token': agentToken
  },
  body: JSON.stringify({
    level: 'info',
    message: 'Processing transaction...'
  })
});
```

Logs appear in:

- The agent's Docker logs (`docker logs <container>`)
- The main process console
- Future: The Assegai UI log viewer

---

### OpenAI Proxy

```
POST /api/openai/*
```

Proxies requests to OpenAI's API with automatic authentication.

**URL Format:**

```
http://host.docker.internal:8765/api/openai/v1/chat/completions
http://host.docker.internal:8765/api/openai/v1/embeddings
```

The `/api/openai` prefix is stripped and forwarded to `https://api.openai.com`.

**Example (Chat Completion):**

```javascript
const response = await fetch('http://host.docker.internal:8765/api/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Assegai-Agent-ID': agentId,
    'X-Assegai-Agent-Token': agentToken
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Explain quantum entanglement.' }
    ],
    max_tokens: 500
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

**Response:** Standard OpenAI API response format.

**Possible Errors:**

- **500**: OpenAI API key not configured
- **429**: Rate limit exceeded
- **Other**: OpenAI API errors (forwarded as-is)

**Cost Tracking:** Token usage and estimated costs are logged to the database automatically.

---

### Anthropic Proxy

```
POST /api/anthropic/*
```

Proxies requests to Anthropic's API with automatic authentication.

**URL Format:**

```
http://host.docker.internal:8765/api/anthropic/v1/messages
```

The `/api/anthropic` prefix is stripped and forwarded to `https://api.anthropic.com`.

**Example (Messages API):**

```javascript
const response = await fetch('http://host.docker.internal:8765/api/anthropic/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Assegai-Agent-ID': agentId,
    'X-Assegai-Agent-Token': agentToken
  },
  body: JSON.stringify({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: 'Write a haiku about AI agents.' }
    ]
  })
});

const data = await response.json();
console.log(data.content[0].text);
```

**Response:** Standard Anthropic API response format.

**Possible Errors:**

- **500**: Anthropic API key not configured
- **429**: Rate limit exceeded
- **Other**: Anthropic API errors (forwarded as-is)

**Cost Tracking:** Token usage and estimated costs are logged to the database automatically.

---

### RPC Proxy (Direct)

```
POST /rpc/:chain
```

Alternative RPC endpoint that forwards JSON-RPC requests directly.

**URL Format:**

```
http://host.docker.internal:8765/rpc/eip155:1
```

**Request Body:** Standard JSON-RPC format.

```json
{
  "jsonrpc": "2.0",
  "method": "eth_getBalance",
  "params": ["0xAddress", "latest"],
  "id": 1
}
```

**Response:** Standard JSON-RPC format.

```json
{
  "jsonrpc": "2.0",
  "result": "0x1234567890",
  "id": 1
}
```

**Note:** This endpoint is functionally equivalent to `/agent/query-chain` but uses JSON-RPC format directly. Prefer `/agent/query-chain` for consistency with the SDK.

---

## AssegaiSDK Reference

The AssegaiSDK provides a higher-level interface to the API proxy.

### Constructor

```javascript
import { AssegaiSDK } from './sdk.js';

const assegai = new AssegaiSDK();
```

Reads configuration from environment variables:

- `ASSEGAI_API_PROXY` (default: `http://host.docker.internal:8765`)
- `ASSEGAI_AGENT_ID`
- `ASSEGAI_AGENT_TOKEN`

### Methods

#### `requestTransaction(params)`

Requests a transaction approval.

**Parameters:**

```typescript
{
  chain: string;     // CAIP-2 chain ID
  to: string;        // Recipient address
  value: string;     // Value in wei
  data?: string;     // Optional transaction data
  gasLimit?: string; // Optional gas limit
}
```

**Returns:** `Promise<string>` - Transaction hash

**Throws:** Error if rejected, timeout, or validation fails

**Example:**

```javascript
try {
  const txHash = await assegai.requestTransaction({
    chain: 'eip155:1',
    to: '0xRecipient',
    value: '1000000000000000000'
  });
  console.log('Transaction sent:', txHash);
} catch (error) {
  console.error('Transaction failed:', error.message);
}
```

---

#### `queryChain(chain, method, params)`

Executes an RPC call.

**Parameters:**

- **chain** (string): CAIP-2 chain identifier
- **method** (string): RPC method name
- **params** (array): Method parameters

**Returns:** `Promise<any>` - RPC result

**Throws:** Error if chain not whitelisted or RPC fails

**Example:**

```javascript
const balance = await assegai.queryChain(
  'eip155:1',
  'eth_getBalance',
  ['0xAddress', 'latest']
);
console.log('Balance:', balance);
```

---

#### `getWalletAddress(chain)`

Retrieves the wallet address for a chain.

**Parameters:**

- **chain** (string): CAIP-2 chain identifier

**Returns:** `Promise<string>` - Wallet address

**Example:**

```javascript
const address = await assegai.getWalletAddress('eip155:1');
console.log('Address:', address);
```

---

#### `getBalance(chain, address)`

Convenience method for `eth_getBalance`.

**Parameters:**

- **chain** (string): CAIP-2 chain identifier
- **address** (string): Address to query

**Returns:** `Promise<string>` - Balance in wei (hex string)

**Example:**

```javascript
const balanceWei = await assegai.getBalance('eip155:1', '0xAddress');
const balanceEth = parseInt(balanceWei, 16) / 1e18;
console.log('Balance:', balanceEth, 'ETH');
```

---

#### `log(level, message)`

Sends a log message.

**Parameters:**

- **level** (string): Log level (`info`, `warn`, `error`, `success`)
- **message** (string): Log message

**Returns:** `Promise<void>`

**Example:**

```javascript
await assegai.log('info', 'Agent initialized');
await assegai.log('error', 'Failed to process request');
```

---

## Error Handling

All API errors follow this format:

```json
{
  "error": "Error message"
}
```

HTTP status codes:

- **200**: Success
- **400**: Bad request (invalid parameters)
- **401**: Unauthorized (missing/invalid credentials)
- **403**: Forbidden (policy violation, limits exceeded)
- **429**: Rate limit exceeded
- **500**: Internal server error

**SDK Error Handling:**

```javascript
try {
  const result = await assegai.requestTransaction({...});
} catch (error) {
  // error.message contains the error string
  console.error('Request failed:', error.message);
}
```

## Chain Identifiers (CAIP-2)

Chains are identified using CAIP-2 format: `namespace:chain_id`

Common identifiers:

| Chain | Identifier |
|-------|------------|
| Ethereum Mainnet | eip155:1 |
| Ethereum Goerli | eip155:5 |
| Polygon | eip155:137 |
| Binance Smart Chain | eip155:56 |
| Arbitrum One | eip155:42161 |
| Optimism | eip155:10 |
| Base | eip155:8453 |
| Avalanche C-Chain | eip155:43114 |
| Local Anvil | eip155:31337 |

Format: `eip155:<chain_id>`

## Best Practices

### Retry Logic

Implement exponential backoff for failed requests:

```javascript
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

const balance = await retryRequest(() => 
  assegai.getBalance('eip155:1', address)
);
```

### Rate Limit Handling

Respect rate limits:

```javascript
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Batch requests with delays
for (const address of addresses) {
  const balance = await assegai.getBalance('eip155:1', address);
  await delay(100); // 100ms between requests
}
```

### Error Context

Provide context in error logs:

```javascript
try {
  const txHash = await assegai.requestTransaction({...});
} catch (error) {
  await assegai.log('error', `Failed to send transaction to ${to}: ${error.message}`);
}
```

### Transaction Validation

Validate inputs before requesting transactions:

```javascript
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

if (!isValidAddress(to)) {
  await assegai.log('error', 'Invalid recipient address');
  return;
}
```

## Advanced Usage

### Contract Interactions

Call and parse contract data:

```javascript
// ERC20 balanceOf(address)
const balanceData = '0x70a08231' + 
  '000000000000000000000000' + address.slice(2);

const result = await assegai.queryChain('eip155:1', 'eth_call', [{
  to: '0xTokenContract',
  data: balanceData
}, 'latest']);

const balance = BigInt(result);
console.log('Token balance:', balance.toString());
```

### Gas Estimation

Estimate gas before transactions:

```javascript
const gasEstimate = await assegai.queryChain('eip155:1', 'eth_estimateGas', [{
  to: recipient,
  value: '0x' + BigInt(amount).toString(16),
  data: '0x'
}]);

const gasLimit = (BigInt(gasEstimate) * 120n / 100n).toString(); // +20% buffer

await assegai.requestTransaction({
  chain: 'eip155:1',
  to: recipient,
  value: amount,
  gasLimit: gasLimit
});
```

### Event Listening

Poll for events:

```javascript
async function waitForTransaction(txHash) {
  while (true) {
    const receipt = await assegai.queryChain('eip155:1', 'eth_getTransactionReceipt', [txHash]);
    
    if (receipt) {
      if (receipt.status === '0x1') {
        await assegai.log('success', `Transaction confirmed: ${txHash}`);
        return receipt;
      } else {
        await assegai.log('error', `Transaction failed: ${txHash}`);
        throw new Error('Transaction reverted');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
  }
}
```

## Security Considerations

### Never Hardcode Secrets

Don't include private keys or sensitive data:

```javascript
// ❌ BAD
const privateKey = '0x1234...';

// ✅ GOOD
// Use the connected wallet via the proxy
```

### Validate All Inputs

Never trust external data:

```javascript
function validateTransactionRequest(req) {
  if (!req.to || !isValidAddress(req.to)) {
    throw new Error('Invalid recipient address');
  }
  
  if (!req.value || BigInt(req.value) < 0) {
    throw new Error('Invalid transaction value');
  }
  
  // Additional validation...
}
```

### Handle User Rejection

Don't crash if users reject transactions:

```javascript
try {
  const txHash = await assegai.requestTransaction({...});
  // Handle success
} catch (error) {
  if (error.message.includes('rejected')) {
    await assegai.log('info', 'Transaction rejected by user');
    // Continue gracefully
  } else {
    throw error; // Re-throw unexpected errors
  }
}
```

## Troubleshooting

### "Unauthorized" Error

- Verify agent ID and token are set correctly
- Check environment variables in the container
- Ensure the agent was started by Assegai (not manually)

### "Chain not whitelisted"

- Verify the chain is in the agent's manifest
- Check the chain identifier format (must be CAIP-2)
- Ensure RPC URL is configured

### "Rate limit exceeded"

- Reduce request frequency
- Implement delays between requests
- Use exponential backoff on retries

### "API key not configured"

- Configure the API key in Assegai Settings
- Restart the agent after setting keys

