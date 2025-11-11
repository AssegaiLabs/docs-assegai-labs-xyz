---
title: Transaction Limits
---
Assegai enforces spending limits to prevent agents from exhausting wallet funds. Limits are configured per agent and checked before any transaction is approved.

## Types of Limits

### Spending Limits (Native Assets)

Spending limits apply to native asset transfers (ETH, MATIC, etc.) and are configured as rolling time windows:

- **Per Transaction**: Maximum value for a single transaction
- **Daily**: Maximum total value in a 24-hour period
- **Weekly**: Maximum total value in a 7-day period  
- **Monthly**: Maximum total value in a 30-day period

These limits are defined in the agent's manifest:

```json
{
  "spending_limits": {
    "per_transaction": "0.1",
    "daily": "1.0", 
    "weekly": "5.0",
    "monthly": "20.0"
  }
}
```

All values are specified in ETH (or the native asset equivalent for other chains).

### Token Allowances (ERC20)

Token allowances set the maximum amount of specific ERC20 tokens an agent can spend per transaction. These are configured through the Assegai UI after agent installation.

Token allowances are chain-specific and token-specific. An agent might have:

- 1000 USDC allowance on Ethereum (chain 1)
- 500 USDC allowance on Polygon (chain 137)
- 10 ETH allowance on Base (chain 8453)

## How Limits Are Enforced

When an agent requests a transaction, Assegai performs the following checks:

### 1. Token Allowance Validation

For native asset transfers:

```javascript
// Transaction must be whitelisted
// Agent needs allowance for native token (0xeeee...eeee)
```

For ERC20 transfers:

```javascript
// Transaction value must be 0
// Transaction data must be valid ERC20 transfer call
// Agent needs allowance for the specific token contract
```

If the transaction involves a token not in the agent's allowance list, it's rejected with:

```
No allowance found for [token] on chain [chainId]
```

If the requested amount exceeds the configured allowance:

```
Requested amount exceeds the configured allowance for this token
```

### 2. Spending Limit Validation (Native Transfers Only)

After token allowance checks, native asset transactions are validated against spending limits:

```javascript
// Check per-transaction limit
if (value > perTransactionLimit) reject();

// Check daily limit (including pending transactions)
if (dailySpent + pendingSum + value > dailyLimit) reject();

// Check weekly limit
if (weeklySpent + pendingSum + value > weeklyLimit) reject();

// Check monthly limit
if (monthlySpent + pendingSum + value > monthlyLimit) reject();
```

**Pending transactions** are included in limit calculations to prevent race conditions where multiple simultaneous requests could exceed limits.

If limits are exceeded:

```
Total spending limit exceeded
```

### 3. User Approval

After passing all automated checks, the transaction is presented to the user for final approval. The user can still reject any transaction, regardless of whether it's within limits.

## Configuring Limits

### Default Limits (Manifest)

Default spending limits are set when installing an agent via the manifest:

```json
{
  "spending_limits": {
    "per_transaction": "0.5",
    "daily": "2.0",
    "weekly": "10.0",
    "monthly": "40.0"
  }
}
```

These limits are converted to wei and stored in the database.

### Token Allowances (UI)

After installing an agent, configure token allowances:

1. Click the **settings icon** (sliders) on the agent card
2. Enter allowances for each token/chain combination
3. Click **Save Allowances**

Available tokens (as of this version):

| Token | Chain | Decimals | Token Address |
|-------|-------|----------|---------------|
| ETH | Localhost (31337) | 18 | 0xeeee...eeee |
| ETH | Ethereum (1) | 18 | 0xeeee...eeee |
| USDC | Ethereum (1) | 6 | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 |
| MATIC | Polygon (137) | 18 | 0xeeee...eeee |
| USDC | Polygon (137) | 6 | 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 |
| ETH | Base (8453) | 18 | 0xeeee...eeee |
| USDC | Base (8453) | 6 | 0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913 |

Native assets are represented by the address `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`.

**Example Configuration:**

- Local testnet ETH: `10` (allows 10 ETH per transaction)
- Mainnet ETH: `0.1` (allows 0.1 ETH per transaction)
- Mainnet USDC: `1000` (allows 1000 USDC per transaction)

Leave a field empty or set to `0` to disallow that token entirely.

## Limit Resets

Spending limits reset automatically based on elapsed time:

- **Daily**: Resets 24 hours after the last reset
- **Weekly**: Resets 7 days after the last reset
- **Monthly**: Resets 30 days after the last reset

Resets are tracked per agent and occur lazily when limits are next checked.

Example timeline:

```
Day 1, 10:00 AM: Agent installed, limits initialized
Day 1, 10:30 AM: Spends 0.5 ETH (daily: 0.5/1.0)
Day 2, 11:00 AM: Daily limit resets (daily: 0/1.0)
Day 2, 11:30 AM: Spends 0.8 ETH (daily: 0.8/1.0, weekly: 1.3/5.0)
```

**Note**: Pending transactions that are later rejected do not increment spending totals. Only approved transactions count.

## ERC20 Transfer Encoding

When agents request ERC20 transfers, they must construct the transaction correctly:

### Transfer Function Signature

```
transfer(address recipient, uint256 amount)
```

Selector: `0xa9059cbb`

### Transaction Structure

```javascript
{
  chain: 'eip155:1',
  to: '0xTokenContractAddress',
  value: '0',  // MUST be 0 for ERC20
  data: '0xa9059cbb' +
        '000000000000000000000000' + recipientAddress.slice(2).toLowerCase() +
        amount.toString(16).padStart(64, '0')
}
```

**Common Mistakes:**

- Setting `value` to anything other than `'0'` → rejected
- Incorrect function selector → rejected
- Malformed data encoding → rejected
- Token contract not in allowance list → rejected

### Validation

Assegai parses the transaction data to extract:

1. Token contract address (the `to` field)
2. Transfer amount (from the `data` field)

The amount is compared against the token's allowance. If valid, the transaction proceeds to user approval.

## Viewing Spending History

Transaction history is available in the **Transactions** tab:

- View all approved and rejected transactions
- See amounts, recipients, and timestamps
- Track cumulative spending against limits

Spending totals are not directly visible in the UI, but can be inferred from the transaction history.

## Security Implications

### Why Limits Matter

Spending limits are the primary defense against:

- Buggy agents that request excessive transactions
- Malicious agents attempting to drain wallets
- Agent logic errors that create infinite loops
- Compromised agent code

Without limits, a malfunctioning agent could request transactions until the wallet is empty or the user stops responding to approval prompts.

### Limit Selection Guidelines

When setting limits, consider:

- **Agent purpose**: A trading agent needs higher limits than a monitoring agent
- **Agent maturity**: Start with lower limits for untested agents
- **Wallet balance**: Limits should never exceed what you're willing to lose
- **Time horizon**: Monthly limits should account for sustained agent activity

**Conservative Example:**

```json
{
  "per_transaction": "0.01",
  "daily": "0.05",
  "weekly": "0.2",
  "monthly": "0.5"
}
```

**Aggressive Example:**

```json
{
  "per_transaction": "1.0",
  "daily": "5.0",
  "weekly": "20.0",
  "monthly": "50.0"
}
```

### Defense in Depth

Spending limits are one layer of protection. Additional layers include:

- **User approval**: Every transaction requires manual confirmation
- **Docker isolation**: Agents cannot access the host system or wallet directly
- **RPC whitelisting**: Agents can only interact with approved chains
- **Rate limiting**: API and RPC calls are throttled
- **Audit logs**: All activity is logged for review

No single mechanism is foolproof. Use all layers together for maximum security.

## Troubleshooting

### "No allowance found for [token]"

The agent is trying to spend a token that isn't configured in its allowances.

**Solution**: Open agent settings and add an allowance for that token/chain combination.

### "Requested amount exceeds the configured allowance"

The transaction amount is higher than the per-transaction allowance for that token.

**Solution**: Increase the allowance or modify the agent to request smaller amounts.

### "Total spending limit exceeded"

The agent has hit its daily, weekly, or monthly spending cap for native assets.

**Solution**: Wait for the limit to reset, or manually increase limits in the database (requires caution).

### "ERC20 transfers must have a transaction value of 0"

The agent is trying to send both ETH and tokens in the same transaction.

**Solution**: ERC20 transfers must have `value: '0'`. If you need to send ETH, make a separate native asset transaction.

## Advanced: Database Direct Modification

For advanced users, spending limits can be modified directly in the SQLite database:

```sql
-- View current limits
SELECT * FROM spending_limits WHERE agent_id = 'your-agent-id';

-- Update daily limit to 5 ETH (5000000000000000000 wei)
UPDATE spending_limits 
SET daily_limit = '5000000000000000000'
WHERE agent_id = 'your-agent-id';

-- Reset spending totals
UPDATE spending_limits
SET daily_spent = '0', weekly_spent = '0', monthly_spent = '0'
WHERE agent_id = 'your-agent-id';
```

The database is located at:

- **Windows**: `%APPDATA%/assegai-sandbox-mvp/assegai.db`
- **macOS**: `~/Library/Application Support/assegai-sandbox-mvp/assegai.db`
- **Linux**: `~/.config/assegai-sandbox-mvp/assegai.db`

**Warning**: Direct database modifications bypass validation. Use with caution.
