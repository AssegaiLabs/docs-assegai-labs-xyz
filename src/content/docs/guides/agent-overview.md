---
title: Agents Overview
---

Agents are containerized programs that run in Docker with controlled access to blockchain networks and AI APIs. Each agent runs in isolation with defined permissions and resource limits.

## Agent Capabilities

Agents can:

- Query blockchain data via whitelisted RPC endpoints
- Request transaction approvals
- Call AI APIs (OpenAI, Anthropic) if configured
- Log activity
- Access a persistent workspace volume


## Agent Structure

Minimal agent directory:

```
my-agent/
├── assegai.json       # Manifest
├── index.js           # Entry point
├── Dockerfile         # Dockerfile
├── package.json       # Dependencies
└── sdk.js             # AssegaiSDK helper (optional)
```

### Manifest (`assegai.json`)

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

**Fields:**

- **name**: Display name
- **version**: Semantic version
- **runtime**: `"node"` (Python pending)
- **entrypoint**: Main file
- **permissions.chains**: CAIP-2 chain identifiers
- **permissions.rpcs**: Chain ID → RPC URL mapping
- **permissions.apis**: AI services to use
- **resources.memory**: Memory limit (e.g. "256MB", "1GB")
- **resources.cpu**: CPU quota as fraction (e.g. "0.5", "2.0")
- **spending_limits**: Limits in ETH

## Agent Lifecycle

### Installation

1. Reads and validates manifest
2. Builds Docker image
3. Registers in database
4. Configures spending limits and RPC whitelist

### Starting

1. Creates container with resource limits
2. Generates authentication token
3. Injects environment variables
4. Starts container
5. Status becomes "running"

### Stopping

1. Sends `SIGTERM` to container
2. 10 second grace period
3. Forcibly stops and removes container
4. Status becomes "stopped"

### Deletion

1. Stops agent if running
2. Removes Docker image
3. Deletes database records

## Docker Configuration

Containers run with:

- Readonly root filesystem
- No capabilities
- `no-new-privileges` security
- Dedicated bridge network
- Resource limits (memory, CPU)
- Writable `/agent-workspace` volume

## Agent Permissions

### Validation

The API proxy performs several checks:

**Token Allowance Check:**

- For native transfers: Verify allowance exists for chain's native token
- For ERC20 transfers: Parse transfer data, verify token allowance, confirm `value` is 0

**Spending Limit Check (Native Transfers):**

- Verify transaction is within per-transaction limit
- Verify daily/weekly/monthly limits (including pending transactions)
- Calculate cumulative spending to ensure compliance

If any check fails, the request is rejected immediately with an error message. The agent receives the error and can handle it appropriately.

### User Decision

The user reviews the transaction and chooses:

- **Approve & Sign**: Execute the transaction
- **Reject**: Cancel the transaction

The agent's `requestTransaction()` call blocks during this time, waiting for the user's decision.

### Transaction Execution (if approved)

If the user clicks **"Approve & Sign"**:

1. Assegai sends the transaction to the connected wallet
2. The wallet signs and broadcasts the transaction
3. The transaction hash is returned
4. Database status is updated to `'approved'`
5. Spending totals are incremented (for native transfers)
6. The transaction hash is sent back to the agent

### RPC Whitelisting

Agents can only query chains in their manifest. Non-whitelisted chains return 403.

Example for local development:

```json
"rpcs": {
  "eip155:31337": "http://host.docker.internal:8545"
}
```
### API Rate Limiting

- **OpenAI**: 100 requests per 60 seconds
- **Anthropic**: 50 requests per 60 seconds
- **RPC**: 30 requests per 10 seconds

## Agent approvals

All transactions require explicit approval. Agents cannot execute autonomously.

### Agent Requests Transaction

An agent uses the SDK to request a transaction:

```javascript
const txHash = await assegai.requestTransaction({
  chain: 'eip155:1',
  to: '0xRecipientAddress',
  value: '1000000000000000000',  // 1 ETH in wei
  data: '0x',
  gasLimit: '21000'
});
```

The SDK sends this request to the API proxy, which validates it against configured limits and allowances.

## Agent limits

Assegai enforces spending limits to prevent agents from exhausting wallet funds. Limits are configured per agent and checked before any transaction is approved.

### Spending Limits (Native Assets)

Spending limits apply to native asset transfers (ETH, MATIC, etc.) and are configured as rolling time windows:

- **Per Transaction**: Maximum value for a single transaction
- **Daily**: Maximum total value in a 24-hour period
- **Weekly**: Maximum total value in a 7-day period  
- **Monthly**: Maximum total value in a 30-day period

These limits are defined in the agent's manifest:

```json
{
  "spending_limits": {
    "per_transaction": "0.1",
    "daily": "1.0", 
    "weekly": "5.0",
    "monthly": "20.0"
  }
}
```

All values are specified in ETH (or the native asset equivalent for other chains).

### Token Allowances (ERC20)

Token allowances set the maximum amount of specific ERC20 tokens an agent can spend per transaction. These are configured through the Assegai UI after agent installation.

Token allowances are chain-specific and token-specific. An agent might have:

- 1000 USDC allowance on Ethereum (chain 1)
- 500 USDC allowance on Polygon (chain 137)
- 10 ETH allowance on Base (chain 8453)


## Best Practices

### Design

- Handle `SIGTERM` and `SIGINT` gracefully
- Log important events
- Handle transaction rejections
- Persist state to `/agent-workspace`
- Keep logic simple

### Security

- Never hardcode credentials
- Use provided environment variables
- Validate external data
- Implement retry logic with backoff

### Testing

- Test with local test account
- Use Anvil/Hardhat for deterministic state
- Verify spending limits work
- Check logs frequently

