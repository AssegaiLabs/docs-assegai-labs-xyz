---
title: AI Integration
---
Agents can call AI services like OpenAI and Anthropic if API keys are configured in Assegai. Keys are stored encrypted and never exposed back to the UI after saving.

## Supported Services

Assegai currently supports:

- **OpenAI**: GPT models, embeddings, and other OpenAI API endpoints
- **Anthropic**: Claude models and related services

Additional services can be added in future releases.

## Configuring API Keys

### Via Settings UI

1. Navigate to **Settings** in the sidebar
2. Locate the **API Keys** section
3. Enter your API key in the appropriate field:
   - OpenAI: `sk-...`
   - Anthropic: `sk-ant-...`
4. Click **Save** next to the field

The key is immediately encrypted and stored. The input field is cleared after saving.

### Security Model

API keys are stored using Electron's `safeStorage` module:

```javascript
// Encryption (on save)
const encrypted = safeStorage.encryptString(apiKey);
fs.writeFileSync('keys.enc', encrypted);

// Decryption (on use)
const decrypted = safeStorage.decryptString(encryptedBuffer);
```

**Platform-specific encryption:**

- **Windows**: DPAPI (Data Protection API)
- **macOS**: Keychain
- **Linux**: libsecret (requires installation)

Keys are encrypted at rest and only decrypted in memory when an agent makes an API request.

### Encrypted Storage Location

Keys are stored in:

- **Windows**: `%APPDATA%/assegai-sandbox-mvp/keys.enc`
- **macOS**: `~/Library/Application Support/assegai-sandbox-mvp/keys.enc`
- **Linux**: `~/.config/assegai-sandbox-mvp/keys.enc`

This file is binary and cannot be read without the correct decryption keys (which are OS/user-specific).

## Using API Keys in Agents

### Declaring API Permissions

Agents must declare which APIs they intend to use in their manifest:

```json
{
  "permissions": {
    "apis": ["openai", "anthropic"]
  }
}
```

This is informational only and doesn't enforce restrictions. All agents with valid credentials can access configured services.

### Making API Calls

Agents use the API proxy to make requests. The proxy automatically injects the configured API key.

#### OpenAI Example

```javascript
const response = await fetch(
  'http://host.docker.internal:8765/api/openai/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Assegai-Agent-ID': agentId,
      'X-Assegai-Agent-Token': agentToken
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'Hello, Claude!' }
      ]
    })
  }
);

const data = await response.json();
console.log(data.choices[0].message.content);
```

The agent doesn't provide the OpenAI API key, it's instead injected by the proxy.

#### Anthropic Example

```javascript
const response = await fetch(
  'http://host.docker.internal:8765/api/anthropic/v1/messages',
  {
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
        { role: 'user', content: 'Explain quantum computing' }
      ]
    })
  }
);

const data = await response.json();
console.log(data.content[0].text);
```

### API Endpoints

The proxy exposes:

- **OpenAI**: `http://host.docker.internal:8765/api/openai/*`
- **Anthropic**: `http://host.docker.internal:8765/api/anthropic/*`

All endpoints under these paths are proxied to the respective services with authentication.

**Example paths:**

- `/api/openai/v1/chat/completions`
- `/api/openai/v1/embeddings`
- `/api/anthropic/v1/messages`

The API proxy strips the `/api/openai` or `/api/anthropic` prefix and forwards the request to the real API.

## Rate Limiting

API calls are rate-limited per agent to prevent abuse:

- **OpenAI**: 100 requests per 60 seconds
- **Anthropic**: 50 requests per 60 seconds

Exceeding these limits returns a 429 error:

```json
{
  "error": "Rate limit exceeded"
}
```

Rate limits are enforced regardless of the API provider's own rate limits. Adjust your agent's request frequency accordingly.

## Cost Tracking

Assegai tracks API usage and estimates costs based on token consumption:

### OpenAI Pricing (per 1k tokens)

- **GPT-4**: $0.03 input, $0.06 output
- **GPT-4 Turbo**: $0.01 input, $0.03 output
- **GPT-3.5 Turbo**: $0.0005 input, $0.0015 output

### Anthropic Pricing (per 1k tokens)

- **Claude 3 Opus**: $0.015 input, $0.075 output
- **Claude 3 Sonnet**: $0.003 input, $0.015 output
- **Claude 3 Haiku**: $0.00025 input, $0.00125 output

Usage is logged in the database:

```sql
CREATE TABLE api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  service TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  tokens_used INTEGER,
  cost_usd REAL,
  timestamp INTEGER NOT NULL
);
```

**Note**: Cost estimates are approximate and may not reflect actual billing. Always verify costs with your API provider.

### Viewing Usage

API usage tracking is not currently exposed in the UI but can be queried directly:

```sql
SELECT 
  agent_id,
  service,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd) as total_cost
FROM api_usage
GROUP BY agent_id, service;
```

## Error Handling

### Key Not Configured

If an agent tries to call an API without a configured key:

```json
{
  "error": "OpenAI API key not configured in Assegai Settings."
}
```

**Solution**: Configure the key in Settings and restart the agent.

### Invalid API Key

If the API provider rejects the key:

```json
{
  "error": "Incorrect API key provided: sk-..."
}
```

**Solution**: Verify the key is correct and has the necessary permissions.

### Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded"
}
```

**Solution**: Implement exponential backoff in the agent or reduce request frequency.

### Network Errors

If the proxy cannot reach the API provider:

```json
{
  "error": "Network request failed"
}
```

**Solution**: Check internet connectivity and verify the API provider's status.

## Security Considerations

### Key Exposure

API keys are never:

- Logged to console or files
- Returned in API responses
- Visible in the UI after saving
- Accessible to agents directly

Agents receive API responses but never the keys themselves.

### Key Rotation

To rotate an API key:

1. Generate a new key from your API provider
2. Update the key in Assegai Settings
3. Restart any running agents to use the new key

Old keys can be revoked immediately from the API provider's dashboard.

### Multi-Tenant Risks

All agents share the same API keys. A compromised or malicious agent could:

- Consume all rate limit quotas
- Rack up API costs
- Access the same API resources as other agents

**Mitigation**: Only install agents from trusted sources, and monitor API usage regularly.

### Local vs Production Keys

Use separate API keys for development and production:

- **Development**: Lower-tier keys with spending caps
- **Production**: Full-access keys with monitoring enabled

This limits the impact of development mistakes or security issues.

## Removing API Keys

To remove an API key:

1. Delete the `keys.enc` file from the user data directory
2. Restart Assegai

Alternatively, save an empty string as the key value (though this leaves the key storage file in place).

There's no UI for removing keys directly.

## Local RPC Configuration

While not an "API key", the Settings view also allows configuring the local RPC endpoint for development:

### Local RPC URL

Default: `http://localhost:8545`

This is used when connecting with the local test account. If your local testnet runs on a different port:

1. Navigate to **Settings** → **Local Development**
2. Update **Local RPC Endpoint**
3. Click **Save**
4. Reconnect using the local test account

This setting does **not** affect agents—they use RPC URLs from their manifests.

## Troubleshooting

### "Failed to encrypt keys"

On Linux, ensure `libsecret` is installed:

```bash
# Ubuntu/Debian
sudo apt-get install libsecret-1-dev

# Fedora
sudo dnf install libsecret-devel
```

Without it, Electron cannot encrypt keys, and they may be stored in plaintext (with a warning).

### Keys Lost After OS Update

If OS encryption keys change (e.g., after reinstalling the OS or changing users), the `keys.enc` file may become undecryptable.

**Solution**: Re-enter the API keys in Settings.

### API Costs Higher Than Expected

- Review API usage in the database
- Check for agent loops or excessive requests
- Verify rate limiting is working correctly
- Consider setting lower rate limits or using cheaper models

### Cannot Save Key

If the Save button doesn't work:

- Ensure the key format is correct (starts with `sk-` for OpenAI, `sk-ant-` for Anthropic)
- Check console for JavaScript errors
- Verify the Settings IPC handler is registered

## Best Practices

### For Users

- Use API keys with spending alerts enabled
- Never share your `keys.enc` file
- Rotate keys periodically
- Monitor API usage and costs
- Use separate keys for development and production

### For Agent Developers

- Handle API errors gracefully (don't crash on 429 or 500)
- Implement retry logic with exponential backoff
- Cache API responses when possible
- Use the most efficient models for your use case
- Log API usage to help users track costs
