---
title: Sandboxing & Security
description: How Assegai isolates agents from your system
---

Assegai uses a defense-in-depth approach to ensure AI agents can operate autonomously without putting your host system or private keys at risk.

## Docker Isolation

Every agent runs in its own ephemeral **Docker container**. This provides the first layer of defense:

* **Filesystem Isolation:** Agents cannot access your host OS files. They are given a restricted, read-only root filesystem and a specific writable volume for their workspace.
* **Network Isolation:** Agents operate on a custom Docker bridge network. They cannot scan your local network or access other services running on `localhost` unless explicitly permitted.
* **Resource Limits:** You can configure strict limits on CPU and Memory (RAM) usage per agent to prevent denial-of-service or crypto-mining abuse.

## The Signing Gap

The most critical security feature of Assegai is that **Agents never hold private keys.**

1.  When an agent wants to send a transaction, it constructs the transaction payload.
2.  It sends this payload to the Assegai Host process via the SDK.
3.  The agent process is **paused**.
4.  The Assegai UI presents the transaction details to the human user.
5.  Only if the user clicks **Approve** does the Host sign the transaction using the connected wallet.

This "Human-in-the-Loop" architecture ensures that an agent generally cannot drain your wallet without your permission, even if the agent's code is compromised.

## Seccomp Profiles

(Advanced) Assegai applies custom Seccomp (Secure Computing Mode) profiles to agent containers to restrict the system calls they can make to the Linux kernel, further reducing the attack surface.