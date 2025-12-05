---
title: Roadmap
description: Planned features and enhancements for Assegai
---

:::note[MVP Status]
This roadmap represents aspirational goals for the public release. Priorities may change based on early user feedback.
:::

## Phase 1: Core Security & Reliability (Current)

### Transaction Simulation
Simulate transactions before execution to predict outcomes and detect potential issues.
- [ ] Pre-execution dry runs using Foundry/Anvil
- [ ] Gas estimation improvements with EIP-1559 support
- [ ] User-friendly error parsing for reverts

### Emergency Controls
Quick response mechanisms for security incidents.
- [ ] **Global Kill Switch**: Pause all running agents immediately.
- [ ] **Automatic Suspension**: Suspend agents that trigger repeated failures or anomaly detection.

### Audit Logging
Complete activity tracking for compliance and debugging.
- [ ] Comprehensive logs of all agent actions
- [ ] Transaction decision audit trail (User approvals/rejections)

## Phase 2: User Experience

### Analytics Dashboard
Visualize spending, API costs, and agent performance.
- [ ] Real-time spending breakdown by agent, token, and chain
- [ ] API cost tracking (OpenAI/Anthropic usage)
- [ ] Gas efficiency metrics

### Agent Templates
Pre-configured agents for common use cases.
- [ ] **DCA Bot**: Dollar Cost Averaging template.
- [ ] **Portfolio Rebalancer**: Simple asset allocation management.
- [ ] **Sniper**: Basic mempool monitoring template.

## Phase 3: Advanced Features

### Multi-Signature Approvals
Policy-based transaction approval for teams.
- [ ] Configurable approval policies (M-of-N)
- [ ] Role-based access control for agent deployment

### Agent Collaboration
Enable agents to coordinate and share information.
- [ ] Inter-agent communication channels (IPC)
- [ ] Shared state management