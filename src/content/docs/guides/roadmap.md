---
title: Roadmap
description: Planned features and enhancements for Assegai
---

:::note[MVP Status]
This roadmap represents planned development phases. Priorities may shift based on user feedback.
:::

## Phase 1: UX & SDK Maturity (Current)

Focused on improving the user experience and developer ergonomics.

### Transaction Approval UX
Enhanced transaction approval flow for better clarity and control.
- [ ] **Transaction Queue**: "1 of 3" indicator for multiple pending approvals
- [ ] **Reject All**: Button to reject all pending transactions at once
- [ ] **Decoded Context**: Human-readable action display (e.g., "Transfer 0.5 ETH")
- [ ] **Allowance Impact**: Warning showing budget usage impact before approval

### Spending Allowances UI
Improved spending allowance configuration and visibility.
- [ ] **Chain Grouping**: Organize allowances by chain (Localhost, Ethereum, Base, etc.)
- [ ] **Progress Bars**: Visual indicators showing spent vs. limit
- [ ] **Presets**: Quick configuration presets ("Testnet", "Conservative", "Custom")
- [ ] **Reset Controls**: "Reset Spent" button to clear accumulated spend

### Agent Logs
Enhanced logging interface for better debugging.
- [ ] **Log Filtering**: Filter by level (All / Info / Success / Warn / Error)
- [ ] **Clean Timestamps**: HH:MM:SS format with level-based coloring
- [ ] **Structured Data**: Expandable JSON data attached to log entries

### API Cost Dashboard
Track AI API usage and costs across agents.
- [ ] **Summary View**: Total cost, tokens used, API calls
- [ ] **Per-Agent Breakdown**: Table showing Agent, Provider, Calls, Tokens, Cost

### SDK Enhancements
- [x] Full TypeScript types and exports
- [x] Custom error classes with structured error handling
- [x] JSDoc documentation
- [ ] Two new example agents demonstrating common patterns

### Open Source Preparation
- [ ] Code cleanup (remove debug logs, hardcoded values)
- [ ] Cross-platform build verification (macOS, Windows, Linux)
- [ ] Documentation (CONTRIBUTING.md, Architecture overview)

## Phase 2: Core Security & Reliability

Building robust safety mechanisms and operational controls.

### Transaction Simulation
Simulate transactions before execution to predict outcomes and detect issues.
- [ ] Pre-execution dry runs using Foundry/Anvil
- [ ] Gas estimation improvements with EIP-1559 support
- [ ] User-friendly error parsing for reverts

### Emergency Controls
Quick response mechanisms for security incidents.
- [ ] **Global Kill Switch**: Pause all running agents immediately
- [ ] **Automatic Suspension**: Suspend agents that trigger repeated failures or anomaly detection

### Audit Logging
Complete activity tracking for compliance and debugging.
- [ ] Comprehensive logs of all agent actions
- [ ] Transaction decision audit trail (approvals/rejections with timestamps)
- [ ] Exportable audit reports

## Phase 3: Advanced Features

Expanding capabilities for power users and teams.

### Analytics Dashboard
Visualize spending, API costs, and agent performance over time.
- [ ] Historical spending breakdown by agent, token, and chain
- [ ] API cost tracking trends (OpenAI/Anthropic usage)
- [ ] Gas efficiency metrics and optimization suggestions

### Agent Templates
Pre-configured agents for common use cases.
- [ ] **DCA Bot**: Dollar Cost Averaging template
- [ ] **Portfolio Rebalancer**: Simple asset allocation management
- [ ] **Price Alert**: Monitoring and notification template

### Multi-Signature Approvals
Policy-based transaction approval for teams.
- [ ] Configurable approval policies (M-of-N)
- [ ] Role-based access control for agent deployment

### Agent Collaboration
Enable agents to coordinate and share information.
- [ ] Inter-agent communication channels (IPC)
- [ ] Shared state management
