---
title: Transaction Approvals
---
Every blockchain transaction requested by an agent requires explicit user approval through the Assegai UI. This is the final security checkpoint before funds are moved.

## Approval Workflow

### 1. Agent Requests Transaction

An agent uses the SDK to request a transaction:

```javascript
const txHash = await assegai.requestTransaction({
  chain: 'eip155:1',
  to: '0xRecipientAddress',
  value: '1000000000000000000',  // 1 ETH in wei
  data: '0x',
  gasLimit: '21000'
});
```

The SDK sends this request to the API proxy, which validates it against configured limits and allowances.

### 2. Validation

The API proxy performs several checks:

**Token Allowance Check:**

- For native transfers: Verify allowance exists for chain's native token
- For ERC20 transfers: Parse transfer data, verify token allowance, confirm `value` is 0

**Spending Limit Check (Native Transfers):**

- Verify transaction is within per-transaction limit
- Verify daily/weekly/monthly limits (including pending transactions)
- Calculate cumulative spending to ensure compliance

If any check fails, the request is rejected immediately with an error message. The agent receives the error and can handle it appropriately.

### 3. Database Record Creation

If validation passes, the transaction is recorded in the database with status `'pending'`:

```sql
INSERT INTO transactions (
  id, agent_id, chain, to_address, value, data, gas_limit, status
) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending');
```

### 4. User Prompt

The API proxy sends an IPC message to the renderer process, triggering the transaction overlay:

```javascript
mainWindow.webContents.send('tx:approval-needed', {
  txId,
  agentId,
  chain,
  to,
  value,
  data,
  gasLimit
});
```

The UI displays a modal overlay with transaction details.

### 5. User Decision

The user reviews the transaction and chooses:

- **Approve & Sign**: Execute the transaction
- **Reject**: Cancel the transaction

The agent's `requestTransaction()` call blocks during this time, waiting for the user's decision.

### 6. Transaction Execution (if approved)

If the user clicks **"Approve & Sign"**:

1. Assegai sends the transaction to the connected wallet
2. The wallet signs and broadcasts the transaction
3. The transaction hash is returned
4. Database status is updated to `'approved'`
5. Spending totals are incremented (for native transfers)
6. The transaction hash is sent back to the agent

The agent receives the transaction hash and can continue execution:

```javascript
// Agent code continues here
console.log(`Transaction sent: ${txHash}`);
```

### 7. Transaction Rejection (if rejected)

If the user clicks **"Reject"**:

1. Database status is updated to `'rejected'`
2. An error is sent back to the agent
3. The agent's promise rejects with an error

The agent receives the rejection:

```javascript
try {
  const txHash = await assegai.requestTransaction({...});
} catch (error) {
  // error.message === "Transaction rejected by user"
  console.log('User rejected the transaction');
}
```

## Transaction Approval Overlay

The approval UI displays:

### Agent Information

- **Agent ID**: The unique identifier of the requesting agent
- **Agent Name**: Displayed in the agent card (if available from context)

### Transaction Details

- **Chain**: The target blockchain (e.g., "eip155:1" for Ethereum mainnet)
- **To Address**: The recipient address (full address, not ENS)
- **Value**: The transaction value in wei and formatted ETH
- **Data**: The transaction data payload (if present and not "0x")
- **Gas Limit**: The maximum gas for the transaction

### Example UI Display

```
Transaction Approval Required

Agent ID
a1b2c3d4e5f6...

Chain
eip155:1

To Address
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

Value
1000000000000000 Wei
(0.001 ETH)

[Reject]  [Approve & Sign]
```

## Timeout Handling

Transaction approval requests timeout after **5 minutes** (300 seconds). If the user doesn't respond within this window:

1. The pending transaction is removed from memory
2. An error is sent to the agent
3. Database status remains `'pending'`

The agent receives a timeout error:

```javascript
catch (error) {
  // error.message === "Transaction approval timeout"
}
```

**Best Practice**: Agents should handle timeouts gracefully and retry if appropriate. Users should respond to approval prompts promptly.

## Concurrent Requests

Multiple agents can request transactions simultaneously. Each request:

- Gets a unique transaction ID
- Appears as a separate overlay (queued if UI is busy)
- Is tracked independently in the database

However, **spending limits** account for all pending transactions across all agents. If Agent A has a pending 0.5 ETH transaction and Agent B requests 0.6 ETH, and the daily limit is 1.0 ETH, Agent B's request will be rejected:

```
Total spending limit exceeded
```

This prevents multiple agents from coordinating to exceed limits.

## Transaction Status Flow

Transactions progress through these states:

```
pending → approved → [confirmed]
       ↘ rejected
       ↘ timeout (pending remains)
```

- **pending**: Awaiting user approval
- **approved**: User approved, transaction sent to network
- **rejected**: User declined the transaction
- **confirmed**: Transaction mined (not currently tracked)

The `confirmed` status is not yet implemented but reserved for future blockchain confirmation tracking.

## Security Considerations

### Why Manual Approval?

Manual approval is the most critical security control in Assegai. It ensures:

- No autonomous transaction execution
- Human review of all fund movements
- Defense against buggy or malicious agents
- Transparency in agent operations

Even with perfect spending limits and allowances, manual approval provides a final sanity check.

### Approval Fatigue

Frequent approval prompts can lead to "approval fatigue" where users click through without careful review.

**Mitigation strategies:**

- Design agents to minimize transaction frequency
- Batch operations when possible
- Set conservative spending limits
- Review agent logs regularly to understand transaction patterns

### Social Engineering

A malicious agent could display misleading logs to trick users into approving harmful transactions.

**Example attack:**

```javascript
// Malicious agent
await assegai.log('info', 'Sending 0.01 ETH to savings address...');
await assegai.requestTransaction({
  to: '0xAttackerAddress',
  value: '10000000000000000000'  // Actually 10 ETH
});
```

**Defense**: Always review the transaction overlay carefully. The overlay shows the **actual** transaction details, not what the agent claims in logs.

### Transaction Replay

Approved transactions are sent to the network immediately. There's no mechanism to replay or modify a transaction after approval.

If a transaction fails on-chain (e.g., due to insufficient gas or contract revert), it's not automatically retried. The agent must detect the failure and request a new transaction if needed.

## Wallet Integration

### WalletConnect

With WalletConnect, transaction approval requires **two** confirmations:

1. **Assegai UI**: User clicks "Approve & Sign"
2. **Wallet App**: User confirms in their mobile/browser wallet

Both must approve for the transaction to execute. If the user rejects in either location, the transaction fails.

### Local Test Account

With the local test account, Assegai signs transactions directly using the hardcoded private key. Only the Assegai UI approval is required.

This is faster for development but bypasses the wallet app's security features.

## Database Records

All transactions are recorded in the `transactions` table:

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  chain TEXT NOT NULL,
  tx_hash TEXT,
  to_address TEXT NOT NULL,
  value TEXT NOT NULL,
  data TEXT,
  gas_limit TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  approved_at INTEGER,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);
```

**Key fields:**

- **id**: Unique transaction ID (generated by API proxy)
- **tx_hash**: Blockchain transaction hash (null until approved)
- **status**: Current state (pending/approved/rejected)
- **approved_at**: Timestamp of approval (null if not approved)

This provides a complete audit trail of all agent transaction requests.

## Transaction History View

The **Transactions** tab in Assegai displays:

- All transactions from all agents
- Status indicators (pending/approved/rejected)
- Transaction details (amount, recipient, hash)
- Timestamps

This allows post-hoc review of agent behavior and spending patterns.

## Troubleshooting

### Overlay Doesn't Appear

If an approval prompt doesn't show:

- Check that Assegai is focused and visible
- Verify the agent is running (check status)
- Review agent logs for errors
- Check the console for IPC-related errors

The overlay requires the main window to be initialized and not destroyed.

### Transaction Stuck "Pending"

If a transaction remains pending indefinitely:

- The approval request may have timed out
- Check if the agent is still running
- Review database for status

Restart the agent to clear stale requests.

### Approved Transaction Not Sending

If approval succeeds but the transaction fails:

- Check wallet connection status
- Verify the connected wallet has sufficient balance
- Review gas settings and network conditions
- Check for RPC errors in Assegai logs

The wallet must be able to broadcast transactions to the network.

### Multiple Overlays Stacking

If multiple approval prompts appear:

- Each represents a distinct transaction request
- Handle them one at a time (oldest first)
- Consider stopping the agent if it's requesting too frequently

Agents should rate-limit their transaction requests to avoid overwhelming the user.

## Best Practices

### For Agent Developers

- Log clear context before requesting transactions
- Handle rejections gracefully (don't crash or spam)
- Implement exponential backoff for retries
- Consider user approval latency in timing-sensitive logic
- Test approval flows thoroughly in development

### For Users

- Review each transaction carefully before approving
- Verify the recipient address matches expectations
- Check the amount is reasonable
- Reject suspicious or unexpected requests
- Monitor transaction history regularly

### For Security-Critical Scenarios

- Use WalletConnect instead of the local test account
- Set very conservative spending limits
- Review agent logs before approving transactions
- Test agents on testnets before mainnet deployment
- Keep Assegai updated to the latest version
