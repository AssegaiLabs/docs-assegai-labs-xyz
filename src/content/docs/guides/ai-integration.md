---
title: AI Integration
description: Using LLMs securely within Assegai Agents
---

Agents often require access to Large Language Models (LLMs) like GPT-5 or Claude 4.5 to make decisions. Assegai provides a secure way to delegate this access, while offering the flexibility to integrate with local models and advanced tooling standards like the Model Context Protocol (MCP).

## The API Proxy

Traditionally, developers hardcode API keys into their scripts. This is dangerous if you share the agent code or if the agent is compromised.

Assegai includes a **Local API Proxy** running on the host machine.

1.  **Configuration:** You enter your OpenAI or Anthropic API keys in the Assegai App **Settings** menu. These are stored encrypted on your device.
2.  **Agent Request:** The agent uses the `@assegailabs/sdk` to call `callOpenAI` or `callAnthropic`.
3.  **Injection:** The request is sent to the Assegai Host. The Host verifies the agent has permission to use that API, injects the real API key, and forwards the request to the provider.
4.  **Response:** The response is stripped of sensitive headers and returned to the agent.

### Supported Providers

* **OpenAI**: GPT-5, GPT-5-Turbo
* **Anthropic**: Claude 4.5 Sonnet, Claude 4.5 Opus

### Usage Example

```javascript
import AssegaiSDK from '@assegailabs/sdk';
const assegai = new AssegaiSDK();

// The agent does NOT need an API key in its environment variables
const result = await assegai.callOpenAI('/v1/chat/completions', {
    model: "gpt-5",
    messages: [
        { role: "system", content: "You are a DeFi assistant." },
        { role: "user", content: "Analyze this token swap path..." }
    ]
});
```

## Flexible Integration

The Assegai SDK is designed to be agnostic, allowing you to connect your agents to a wide variety of external tools and runtimes beyond the built-in proxy.

### Local Inference with Ollama

For complete privacy or zero-cost inference, you can integrate with local model runners like [Ollama](https://github.com/ollama/ollama).

Since Assegai agents run in Docker, they can communicate with services running on your host machine (if configured) or external endpoints. You can use standard HTTP libraries to call a local Ollama instance.

```javascript
// Example: Calling a local Llama 3 model via Ollama
const response = await fetch('[http://host.docker.internal:11434/api/generate](http://host.docker.internal:11434/api/generate)', {
  method: 'POST',
  body: JSON.stringify({
    model: "llama3",
    prompt: "Generate a transaction summary..."
  })
});
```

### Model Context Protocol (MCP)

Assegai is fully compatible with the **Model Context Protocol (MCP)**, allowing agents to act as orchestrators for external tools and data sources. 

Because the SDK provides raw access to the LLM (via `callClaude` or `callOpenAI`), you can implement the standard MCP loop:
1.  **Discover** tools from an MCP server.
2.  **Pass** tool definitions to the LLM.
3.  **Execute** the returned tool calls via the MCP client.
4.  **Feed** results back to the LLM.

#### Architecture Example

In this pattern, your agent container runs an instance of the `@modelcontextprotocol/sdk`.

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// 1. Setup the MCP Client
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const mcpClient = new Client({ name: 'my-agent', version: '1.0' }, { capabilities: {} });
await mcpClient.connect(clientTransport);

// 2. Discover Tools
const tools = await mcpClient.listTools();

// 3. Orchestrate with Claude via Assegai SDK
const response = await assegai.callClaude('claude-4-5-sonnet', history, {
    tools: tools.map(t => ({ 
        name: t.name, 
        description: t.description, 
        input_schema: t.inputSchema 
    }))
});
```

This architecture allows Assegai agents to serve as powerful, sandboxed "brains" that control complex pipelines while maintaining the security guarantees of the sandbox for final transaction approval.