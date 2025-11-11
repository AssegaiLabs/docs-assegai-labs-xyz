---
title: Agents Overview
---
Agents in Assegai are containerized programs that can interact with blockchain networks and AI APIs in a controlled, sandboxed environment. Each agent runs in isolation with defined permissions and resource limits. An agent can currently be a Node.js or Python application packaged with an `assegai.json` manifest that declares its capabilities and requirements. Agents run inside Docker containers with strictly limited resources and network access.

Agents can:

- Query blockchain data via whitelisted RPC endpoints
- Request transaction approvals from the user
- Call AI APIs (OpenAI, Anthropic) if configured
- Log activity visible in the Assegai UI
- Access a persistent workspace volume

Agents cannot:

- Make arbitrary network requests
- Access the host filesystem outside their workspace
- Execute privileged operations
- Communicate with other containers
- Bypass spending limits or approval requirements

## Agent Structure

A minimal agent directory contains:

```
my-agent/
├── assegai.json       # Agent manifest
├── index.js           # Entry point
├── Dockerfile         # Dockerfile
├── package.json       # Dependencies (Node.js)
└── sdk.js             # AssegaiSDK helper (optional)
```

### The Manifest (`assegai.json`)

The manifest defines the agent's configuration:

```json
{
  "name": "My Agent",
  "version": "1.0.0",
  "runtime": "node",
  "entrypoint": "index.js",
  "permissions": {
    "chains": ["eip155:1", "eip155:137"],
    "rpcs": {
      "eip155:1": "https://eth-mainnet.example.com",
      "eip155:137": "https://polygon-mainnet.example.com"
    },
    "apis": ["openai", "anthropic"],
    "contracts": []
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

**Field Reference:**

- **name**: Display name for the agent
- **version**: Semantic version string
- **runtime**: `"node"` or `"python"` (Python support pending)
- **entrypoint**: Main file to execute
- **permissions.chains**: Array of CAIP-2 chain identifiers the agent can access
- **permissions.rpcs**: Map of chain IDs to RPC URLs
- **permissions.apis**: AI services the agent can use (if API keys are configured)
- **resources.memory**: Memory limit (e.g., "256MB", "1GB")
- **resources.cpu**: CPU quota as a fraction of one core (e.g., "0.5", "2.0")
- **spending_limits**: Default spending limits in ETH (see [Transaction Limits](transaction-limits))

## Agent Lifecycle

### Installation

When you install an agent:

1. Assegai reads and validates the `assegai.json` manifest
2. A Docker image is built from the agent's directory
3. The agent is registered in the database with a unique ID
4. Spending limits and RPC whitelist are configured

Installation does not start the agent automatically.

### Starting

When you start an agent:

1. A Docker container is created with the configured resource limits
2. The container is assigned a unique authentication token
3. Environment variables are injected (`ASSEGAI_AGENT_ID`, `ASSEGAI_AGENT_TOKEN`, etc.)
4. The container starts and executes the entrypoint
5. The agent's status changes to "running"

### Running

While running, the agent:

- Communicates with Assegai via the API proxy on `http://host.docker.internal:8765`
- Authenticates requests using its agent ID and token
- Operates within resource and spending constraints
- Can request transaction approvals at any time

### Stopping

When you stop an agent:

1. Docker sends `SIGTERM` to the container
2. The agent has 10 seconds to gracefully shut down
3. The container is forcibly stopped and removed
4. The agent's status changes to "stopped"

### Deletion

Deleting an agent:

1. Stops the agent if running
2. Removes the Docker image
3. Deletes all database records (transactions, limits, logs)

This action is irreversible.

## Docker Configuration

Agents run in hardened Docker containers with:

- **Readonly root filesystem**: Agents cannot modify system files
- **No capabilities**: All Linux capabilities are dropped
- **Security options**: `no-new-privileges` prevents privilege escalation
- **Network isolation**: Containers run on a dedicated bridge network
- **Resource limits**: Memory and CPU are strictly capped
- **Workspace volume**: Agents get a writable volume at `/agent-workspace`

Container configuration:

```javascript
{
  ReadonlyRootfs: true,
  CapDrop: ['ALL'],
  SecurityOpt: ['no-new-privileges'],
  NetworkMode: 'assegai-bridge',
  Memory: <configured memory in bytes>,
  CpuQuota: <configured CPU * 100000>
}
```

## Developing Agents

Agents interact with Assegai through the **AssegaiSDK**, which provides methods for:

- Requesting wallet addresses
- Querying blockchain state
- Requesting transaction approvals
- Logging to the Assegai UI

See the [Example Agent](example-agent) guide for a complete walkthrough, and the [API Proxy Reference](api-proxy-reference) for detailed SDK documentation.

## Agent Permissions

### RPC Whitelisting

Agents can only query chains explicitly listed in their manifest. RPC calls to non-whitelisted chains are rejected with a 403 error.

RPC endpoints can be:

- Public hosted nodes
- Private infrastructure
- Local development nodes (using `host.docker.internal`)

Example for local development:

```json
"rpcs": {
  "eip155:31337": "http://host.docker.internal:8545"
}
```

### API Rate Limiting

API calls to OpenAI and Anthropic are rate-limited per agent:

- **OpenAI**: 100 requests per 60 seconds
- **Anthropic**: 50 requests per 60 seconds
- **RPC**: 30 requests per 10 seconds

Exceeding these limits returns a 429 error.

### Transaction Approval

All transactions require explicit approval via the Assegai UI. Agents cannot execute transactions autonomously. See [Transaction Approvals](transaction-approvals) for details.

## Best Practices

### Agent Design

- Implement graceful shutdown handlers for `SIGTERM` and `SIGINT`
- Log important events using the SDK's `log()` method
- Handle transaction rejections gracefully
- Persist state to the `/agent-workspace` volume if needed
- Keep the agent logic simple and focused

### Security

- Never hardcode private keys or sensitive credentials in agents
- Use environment variables provided by Assegai
- Validate all external data (RPC responses, API results)
- Implement reasonable retry logic with backoff
- Monitor resource usage to stay within limits

### Testing

- Test agents locally using the local test account feature
- Use Anvil or Hardhat for deterministic blockchain state
- Verify spending limits and approval flows work as expected
- Check logs frequently during development

## Troubleshooting

### Agent Won't Start

Check that:

- Docker is running
- The agent has a valid `assegai.json`
- Resource limits are reasonable (not too low)
- All dependencies are properly declared in `package.json`

View the agent's Docker build logs for specific errors.

### Agent Crashes Immediately

- Examine the agent logs via the UI
- Verify the entrypoint file exists and is executable
- Check for missing dependencies or syntax errors
- Ensure the agent handles startup errors gracefully

### Network Requests Fail

- Confirm the RPC URL is correct and accessible
- Verify the chain is whitelisted in the manifest
- Check that the agent is using the correct chain ID format (CAIP-2)
- For local development, ensure `host.docker.internal` resolves

### Transaction Requests Rejected

- Verify spending limits are not exceeded
- Check that token allowances are configured (for ERC20 transfers)
- Ensure the transaction parameters are valid
- Review the specific rejection reason in the API response

## Next Steps

Continue to the [Example Agent](example-agent) guide to build your first agent, or explore [Transaction Limits](transaction-limits) to understand spending controls.