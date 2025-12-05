---
title: SDK Reference
description: API documentation for @assegailabs/sdk
---

The [`@assegailabs/sdk`](https://www.npmjs.com/package/@assegailabs/sdk) packagge is injected into the agent's runtime environment.

## Methods

### requestTransaction(params)
Requests the user to sign and broadcast a transaction. **This will pause execution until the user approves or rejects.**

**Parameters:**
* `chain`: string (e.g., 'ethereum')
* `to`: string (Hex address)
* `value`: string (Integer in Wei)
* `data`: string (Hex data)
* `gasLimit`: string (Optional)

**Returns:** `Promise<string>` (The transaction hash)

### queryChain(chain, method, params)
Performs a read-only JSON-RPC call via the configured RPC provider.

**Parameters:**
* `chain`: string
* `method`: string (e.g., 'eth_getBalance', 'eth_call')
* `params`: Array<any>

**Returns:** `Promise<any>` (The RPC result)

### getWalletAddress(chain)
Returns the public address of the wallet currently connected to the Sandbox.

**Returns:** `Promise<string>`

## AI Methods

### callOpenAI(endpoint, body)
Proxies a request to the OpenAI API using the user's stored API key.

**Parameters:**
* `endpoint`: string (e.g., '/v1/chat/completions')
* `body`: object (Standard OpenAI request body)

**Example:**
```javascript
const response = await assegai.callOpenAI('/v1/chat/completions', {
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Analyze this transaction data...' }]
});
```

### `callAnthropic(endpoint, body)`
Proxies a request to the Anthropic API.

**Parameters:**
* `endpoint`: string (e.g., '/v1/messages')
* `body`: object

## Utilities

### log(level, message)
sends a log message to the Sandbox Dashboard UI. Use this instead of `console.log` to ensure the user sees the output in the app.

**Parameters:**
* `level`: 'info' | 'warn' | 'error' | 'success'
* `message`: string