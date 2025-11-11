---
title: Wallet Authentication
---
Assegai requires a connected wallet to sign transactions on behalf of your agents. The application supports two authentication methods: WalletConnect for production use and a local test account for development.

## WalletConnect

WalletConnect allows you to connect any compatible mobile or browser wallet to Assegai.

### Connecting via WalletConnect

1. Click **"Generate QR Code"** on the wallet connection screen
2. Open your WalletConnect-compatible wallet (MetaMask, Trust Wallet, Rainbow, etc.)
3. Navigate to the WalletConnect or "Scan QR" feature
4. Scan the QR code displayed in Assegai
5. Approve the connection request in your wallet

The connection will persist across application restarts until you explicitly disconnect.

### Supported Chains

WalletConnect sessions request access to Ethereum mainnet (chain ID 1) by default. Your wallet may prompt you to switch networks or approve additional chains as needed by your agents.

### Disconnecting

To disconnect your wallet:

1. Navigate to the application sidebar
2. Click the **"Logout"** button at the bottom
3. Confirm the disconnection

This will terminate the WalletConnect session and return you to the authentication screen.

## Local Test Account

For local development and testing, Assegai can use a hardcoded private key to sign transactions against a local network.

### Prerequisites

You must have a local Ethereum node running. We recommend [Anvil](https://github.com/foundry-rs/foundry/tree/master/anvil) from the Foundry toolkit:

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Start Anvil (local testnet)
anvil
```

Anvil will start a local node on `http://localhost:8545` with pre-funded test accounts.

### Connecting with Test Account

1. Click **"Use Local Test Account"** on the wallet connection screen
2. Assegai will attempt to connect using the first Anvil test account
3. If successful, you'll be logged in immediately

The test account uses this private key (the first Anvil default):

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

This corresponds to address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### Custom Local RPC

By default, the local test account connects to `http://localhost:8545`. To use a different endpoint:

1. Navigate to **Settings** → **Local Development**
2. Update the **Local RPC Endpoint** field
3. Click **Save**
4. Reconnect using the local test account

This is useful if you're running a testnet on a non-standard port or connecting to a remote development node.

## Security Considerations

### WalletConnect

- WalletConnect sessions are encrypted end-to-end
- Your private keys never leave your wallet application
- Assegai only receives transaction signatures after you approve them in your wallet
- Connection URIs are ephemeral and expire after a single use

### Local Test Account

- **WARNING**: The local test account feature uses a hardcoded private key that is publicly known
- This is intended **only** for local development against testnets
- Never use the local test account with a mainnet node or with real funds
- The private key is visible in the source code and should never be used for production

## Session Management

Wallet sessions are maintained in memory and cleared when the application exits. On restart, you'll need to reconnect your wallet.

The application tracks the connection state globally. When authenticated, all transaction requests will use the connected wallet's signing capabilities.
