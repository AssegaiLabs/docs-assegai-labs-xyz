---
title: Installation & Setup
description: How to build and run the Assegai Sandbox
---

## Pre-built Binaries

Coming soon. For now:

## Building from Source

### Prerequisites

1.  **Node.js**: Version 18+
2.  **pnpm**: Package manager (`npm install -g pnpm`)
3.  **Docker Desktop**: Must be installed and running (Required for agent containers).
4.  **Foundry (Optional)**: If you wish to use the Local Test Account feature.

Clone the repository and install dependencies:

```bash
git clone https://github.com/AssegaiLabs/Assegai-Agent-Sandbox.git
cd Assegai-Agent-Sandbox
pnpm install
```

Build and run:

```bash
pnpm start
```

For development with hot reload:

```bash
pnpm run dev
```

## Connecting a Wallet

Once the application launches:

### Option A: Local Development (Recommended for Testing)
1.  Start a local Anvil node (via Foundry).
2.  In Assegai, select **"Use Local Test Account"**.
3.  This uses a pre-funded test account, requiring no real funds or external wallet.

### Option B: WalletConnect
1.  Click **"Connect Wallet"**.
2.  Scan the QR code with a WalletConnect-compatible wallet (Rainbow, MetaMask Mobile, Trust Wallet, etc.).
3.  Approve the connection on your device.
