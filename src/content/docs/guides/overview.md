---
title: Overview
description: Conceptual overview of the Assegai Agent Sandbox
---

:::note
**MVP Status:** The application is currently in active development. Features are subject to change.
:::

## What is Assegai?

Assegai is a desktop application (Electron) that serves as a secure runtime for AI Agents that interact with blockchain networks. It solves the "unsafe agent" problem by sandboxing execution and enforcing a human-in-the-loop approval process for all financial transactions.

## Core Architecture

### Docker Sandboxing
Unlike standard scripts that run directly on your host machine, Assegai agents run inside **Docker containers**.
* **Isolation:** Agents cannot access your local file system (except their designated workspace).
* **Resource Limits:** CPU and Memory usage are capped per agent configuration.
* **Network:** Agents operate on a custom bridge network with restricted access.

### The Security Proxy
Agents do not hold private keys. Instead, they use the `AssegaiSDK` to request signatures.
1.  **Agent:** Calls `assegai.requestTransaction(...)`.
2.  **Sandbox:** Intercepts the request and pauses the agent.
3.  **UI:** Displays a transaction popup to the user with parsed data.
4.  **User:** Clicks "Approve" or "Reject".
5.  **Sandbox:** If approved, signs the transaction via the connected wallet (e.g., MetaMask, Rainbow, or a local Anvil node) and returns the hash to the agent.

### AI Integration
To prevent API key theft, Assegai includes a local proxy for LLM providers.
* You configure your OpenAI/Anthropic keys in the Assegai Settings.
* Agents call the local proxy endpoint.
* Assegai injects the key and forwards the request to the provider.
* The Agent never sees the actual API key.

## Supported Networks

* **EVM Chains:** Full support for Ethereum, Polygon, Base, Optimism, etc.
* **Localnet:** Integrated support for Foundry/Anvil for zero-cost testing.