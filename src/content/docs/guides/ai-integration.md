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
        { role: 'user', content: 'Hello!' }
      ]
    })
  }
);

const data = await response.json();
console.log(data.choices[0].message.content);
```

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
      model: 'claude-sonnet-4-20250514',
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

- **OpenAI**: `http://host.docker.internal:8765/api/openai/*`
- **Anthropic**: `http://host.docker.internal:8765/api/anthropic/*`

The proxy strips the prefix and forwards to the real API with authentication.

## Rate Limiting

Per-agent rate limits:

- **OpenAI**: 100 requests per 60 seconds
- **Anthropic**: 50 requests per 60 seconds

Exceeding limits returns:

```json
{
  "error": "Rate limit exceeded"
}
```

## Cost Tracking

Token usage and costs are logged to the database using pricing data from [LiteLLM](https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json).

Cost estimates are approximate. Verify actual costs with your API provider.

## Error Handling

### Key Not Configured

```json
{
  "error": "OpenAI API key not configured in Assegai Settings."
}
```

**Solution**: Configure the key in Settings.

### Invalid API Key

```json
{
  "error": "Incorrect API key provided: sk-..."
}
```

**Solution**: Verify the key is correct.

### Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded"
}
```

**Solution**: Implement backoff or reduce request frequency.

## Security Considerations

### Key Exposure

API keys are never:

- Logged
- Returned in responses
- Visible in UI after saving
- Accessible to agents directly

### Key Rotation

To rotate a key:

1. Generate new key from API provider
2. Update in Assegai Settings
3. Restart running agents

## Local RPC Configuration

Settings also allows configuring the local RPC endpoint:

**Default**: `http://localhost:8545`

To change:

1. Navigate to **Settings** → **Local Development**
2. Update **Local RPC Endpoint**
3. Click **Save**
4. Reconnect using local test account

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

## Local RPC Configuration

While not an "API key", the Settings view also allows configuring the local RPC endpoint for development:

### Local RPC URL

Default: `http://localhost:8545`

This is used when connecting with the local test account. If your local testnet runs on a different port:

1. Navigate to **Settings** → **Local Development**
2. Update **Local RPC Endpoint**
3. Click **Save**
4. Reconnect using the local test account

This setting does **not** affect agents, as they use RPC URLs from their manifests.

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
