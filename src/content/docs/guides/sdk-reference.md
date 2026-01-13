---
title: SDK Reference
description: API documentation for @assegailabs/sdk
---

The [`@assegailabs/sdk`](https://www.npmjs.com/package/@assegailabs/sdk) package provides typed access to blockchain operations, AI models, and logging from within Assegai agents.

## Installation

```bash
npm install @assegailabs/sdk
```

## Quick Start

```typescript
import { AssegaiSDK } from '@assegailabs/sdk';

// SDK automatically reads credentials from environment
const sdk = new AssegaiSDK();

async function main() {
  await sdk.info('Agent starting...');

  const address = await sdk.getWalletAddress('eip155:1');
  const balance = await sdk.getBalance('eip155:1', address);

  await sdk.success(`Balance: ${BigInt(balance)} wei`);
}

main().catch(console.error);
```

## Constructor

```typescript
const sdk = new AssegaiSDK(config?: AssegaiConfig);
```

Configuration options (all optional, defaults to environment variables):

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiProxyUrl` | `string` | `ASSEGAI_API_PROXY` or `http://host.docker.internal:8765` | API proxy URL |
| `agentId` | `string` | `ASSEGAI_AGENT_ID` | Agent identifier |
| `agentToken` | `string` | `ASSEGAI_AGENT_TOKEN` | Authentication token |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `debug` | `boolean` | `false` | Enable debug logging |

## Wallet & Chain Operations

### getWalletAddress(chain)

Get the connected wallet address for a chain.

```typescript
const address = await sdk.getWalletAddress('eip155:1');
// Returns: "0x..."
```

**Parameters:**
- `chain`: CAIP-2 chain identifier (e.g., `'eip155:1'` for Ethereum mainnet)

**Returns:** `Promise<Address>` - The wallet address (0x-prefixed)

### queryChain(chain, method, params)

Execute a JSON-RPC query on a chain.

```typescript
const blockNumber = await sdk.queryChain('eip155:1', 'eth_blockNumber', []);
const code = await sdk.queryChain('eip155:1', 'eth_getCode', [address, 'latest']);
```

**Parameters:**
- `chain`: CAIP-2 chain identifier
- `method`: JSON-RPC method name
- `params`: Array of method parameters (default: `[]`)

**Returns:** `Promise<T>` - The RPC result

### getBalance(chain, address)

Get the ETH balance of an address.

```typescript
const balanceHex = await sdk.getBalance('eip155:1', '0x...');
const balanceWei = BigInt(balanceHex);
```

**Returns:** `Promise<string>` - Balance in wei as hex string

### getTransactionCount(chain, address)

Get the transaction count (nonce) for an address.

```typescript
const nonce = await sdk.getTransactionCount('eip155:1', address);
```

**Returns:** `Promise<string>` - Transaction count as hex string

### getGasPrice(chain)

Get the current gas price.

```typescript
const gasPrice = await sdk.getGasPrice('eip155:1');
```

**Returns:** `Promise<string>` - Gas price in wei as hex string

### getBlockNumber(chain)

Get the current block number.

```typescript
const blockNumber = await sdk.getBlockNumber('eip155:1');
```

**Returns:** `Promise<string>` - Block number as hex string

### isContract(chain, address)

Check if an address is a contract.

```typescript
const isContract = await sdk.isContract('eip155:1', address);
```

**Returns:** `Promise<boolean>` - True if address has code deployed

## Transactions

### requestTransaction(request)

Request a transaction. **This will pause execution until the user approves or rejects.**

```typescript
try {
  const txHash = await sdk.requestTransaction({
    chain: 'eip155:1',
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f...',
    value: '1000000000000000000', // 1 ETH in wei
    data: '0x',       // optional, default: '0x'
    gasLimit: '21000' // optional, default: '21000'
  });
  await sdk.success(`Transaction sent: ${txHash}`);
} catch (error) {
  if (error instanceof TransactionRejectedError) {
    await sdk.warn('User rejected the transaction');
  } else if (error instanceof InsufficientAllowanceError) {
    await sdk.error('Spending allowance not configured');
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `chain` | `string` | Yes | CAIP-2 chain identifier |
| `to` | `Address` | Yes | Recipient address (0x-prefixed) |
| `value` | `string` | Yes | Value in wei (as string) |
| `data` | `HexData` | No | Transaction data (default: `'0x'`) |
| `gasLimit` | `string` | No | Gas limit (default: `'21000'`) |

**Returns:** `Promise<TransactionHash>` - The transaction hash

**Throws:**
- `TransactionRejectedError` - User clicked "Reject"
- `TransactionTimeoutError` - User didn't respond within 5 minutes
- `InsufficientAllowanceError` - Spending allowance not configured

## AI/LLM Operations

### callClaude(options)

Call the Anthropic Claude API.

```typescript
const response = await sdk.callClaude({
  model: 'claude-sonnet-4-5-20250929',
  messages: [
    { role: 'user', content: 'Analyze this transaction...' }
  ],
  system: 'You are a blockchain analyst.',
  max_tokens: 4096,
});

// Extract text from response
const text = response.content
  .filter(block => block.type === 'text')
  .map(block => block.text)
  .join('');
```

**Options:**

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `model` | `ClaudeModel` | Yes | Model identifier |
| `messages` | `Message[]` | Yes | Conversation messages |
| `max_tokens` | `number` | No | Max tokens to generate (default: 4096) |
| `system` | `string` | No | System prompt |
| `tools` | `Tool[]` | No | Tools available to the model |
| `temperature` | `number` | No | Temperature (0-1) |
| `stop_sequences` | `string[]` | No | Stop sequences |

**Supported Claude Models:**
- `claude-opus-4-5-20251124` - Most capable, complex reasoning
- `claude-sonnet-4-5-20250929` - Balanced performance and speed
- `claude-haiku-4-5-20251015` - Fast, cost-efficient
- `claude-3-5-sonnet-20241022` - Previous generation
- `claude-3-5-haiku-20241022` - Previous generation

### callOpenAI(options)

Call the OpenAI API.

```typescript
const response = await sdk.callOpenAI({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a DeFi assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  max_tokens: 1024,
});

const text = response.choices[0].message.content;
```

**Options:**

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `model` | `OpenAIModel` | Yes | Model identifier |
| `messages` | `array` | Yes | Conversation messages |
| `max_tokens` | `number` | No | Max tokens to generate |
| `temperature` | `number` | No | Temperature (0-2) |
| `tools` | `array` | No | Function tools |

**Supported OpenAI Models:**
- `gpt-5.2` - Latest flagship model
- `gpt-5.1` - Previous flagship
- `gpt-5` - GPT-5 base
- `gpt-4.1` - Optimized for coding
- `gpt-4.1-mini` - Fast, efficient
- `gpt-4o` - Multimodal flagship
- `gpt-4o-mini` - Fast multimodal
- `o3` - Reasoning model
- `o4-mini` - Fast reasoning

## Logging

### log(level, message, data?)

Send a log message to the Assegai UI.

```typescript
await sdk.log('info', 'Processing started', { step: 1 });
```

**Parameters:**
- `level`: `'debug' | 'info' | 'warn' | 'error' | 'success'`
- `message`: Log message string
- `data`: Optional structured data object

### Convenience Methods

```typescript
await sdk.debug('Debug message', { data });  // Only shown when debug=true
await sdk.info('Info message', { data });
await sdk.warn('Warning message', { data });
await sdk.error('Error message', { data });
await sdk.success('Success message', { data }); // Shown in green
```

## Utilities

### getAgentId()

Get the agent ID.

```typescript
const agentId = sdk.getAgentId();
```

### isConfigured()

Check if the SDK is properly configured.

```typescript
if (!sdk.isConfigured()) {
  throw new Error('SDK not configured');
}
```

### healthCheck()

Check if the API proxy is reachable.

```typescript
const healthy = await sdk.healthCheck();
```

## Error Handling

The SDK throws typed errors for different failure scenarios:

```typescript
import {
  AssegaiError,
  AuthenticationError,
  ForbiddenError,
  RateLimitError,
  TimeoutError,
  NetworkError,
  ValidationError,
  TransactionRejectedError,
  TransactionTimeoutError,
  InsufficientAllowanceError,
  RpcError,
  ApiError,
  ErrorCode,
} from '@assegailabs/sdk';

try {
  await sdk.requestTransaction({ ... });
} catch (error) {
  if (error instanceof TransactionRejectedError) {
    // User clicked "Reject" in the UI
  } else if (error instanceof TransactionTimeoutError) {
    // User didn't respond within 5 minutes
  } else if (error instanceof InsufficientAllowanceError) {
    // Spending allowance not configured
  } else if (error instanceof RateLimitError) {
    // Too many requests
    console.log('Retry after:', error.retryAfter);
  } else if (error instanceof RpcError) {
    // Blockchain RPC error
    console.log('RPC code:', error.rpcCode);
  } else if (error instanceof AssegaiError) {
    // Other SDK error
    console.log(error.code, error.message, error.details);
  }
}
```

### Error Codes

| Code | Description |
| :--- | :--- |
| `UNAUTHORIZED` | Authentication failed |
| `FORBIDDEN` | Access forbidden |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMITED` | Rate limit exceeded |
| `TIMEOUT` | Request timed out |
| `NETWORK_ERROR` | Network error |
| `VALIDATION_ERROR` | Validation failed |
| `TRANSACTION_REJECTED` | User rejected transaction |
| `TRANSACTION_TIMEOUT` | Transaction approval timed out |
| `INSUFFICIENT_ALLOWANCE` | Spending allowance not configured |
| `RPC_ERROR` | Blockchain RPC error |
| `API_ERROR` | AI API error |

## TypeScript Types

The SDK exports comprehensive TypeScript types:

```typescript
import type {
  // Configuration
  AssegaiConfig,
  
  // Chain types
  ChainId,         // CAIP-2 identifier, e.g., "eip155:1"
  Address,         // 0x-prefixed address
  TransactionHash, // 0x-prefixed tx hash
  HexData,         // 0x-prefixed hex data
  
  // Transaction types
  TransactionRequest,
  TransactionResult,
  
  // RPC types
  RpcMethod,
  ChainQueryParams,
  
  // AI types
  ClaudeModel,
  ClaudeOptions,
  ClaudeResponse,
  OpenAIModel,
  OpenAIOptions,
  OpenAIResponse,
  Message,
  MessageRole,
  Tool,
  ContentBlock,
  TextContent,
  ImageContent,
  ToolUseContent,
  ToolResultContent,
  
  // Logging
  LogLevel,
  LogEntry,
  
  // Errors
  AssegaiErrorInfo,
} from '@assegailabs/sdk';

export { ErrorCode } from '@assegailabs/sdk';
```

## Environment Variables

These environment variables are set automatically by Assegai when running agents:

| Variable | Description |
| :--- | :--- |
| `ASSEGAI_AGENT_ID` | Unique agent identifier |
| `ASSEGAI_AGENT_TOKEN` | Authentication token |
| `ASSEGAI_API_PROXY` | API proxy URL (default: `http://host.docker.internal:8765`) |
