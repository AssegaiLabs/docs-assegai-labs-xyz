---
title: Contributing
---
Contributions to Assegai are welcome! This guide covers the development workflow, coding standards, and submission process.

## Getting Started

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/assegailabs/assegai-sandbox.git
cd assegai-sandbox
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/assegailabs/assegai-sandbox.git
```

### Development Setup

Follow the [Building from Source](building) guide to set up your development environment.

Key steps:

```bash
pnpm install
pnpm run build
pnpm run dev
```

## Development Workflow

### Creating a Branch

Create a feature branch from `main`:

```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

Branch naming conventions:

- `feature/`: New features
- `fix/`: Bug fixes
- `docs/`: Documentation updates
- `refactor/`: Code refactoring
- `test/`: Test additions or fixes

### Making Changes

1. Make your changes in logical commits
2. Write clear commit messages (see [Commit Messages](#commit-messages))
3. Test your changes thoroughly
4. Ensure code follows the style guide

### Testing

Before submitting:

```bash
# Build the application
pnpm run build

# Run in production mode
pnpm run start

# Test core functionality:
# - Agent installation
# - Agent start/stop
# - Transaction approval flow
# - Settings persistence
```

Automated tests can be added using Vitest (see [Building](building#testing)).

### Code Style

Assegai uses TypeScript with ESLint for linting:

```bash
# Check for linting errors
pnpm run lint

# Auto-fix linting issues
pnpm run lint:fix
```

**Style guidelines:**

- Use TypeScript for type safety
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Comment complex logic
- Avoid deeply nested code (extract functions)
- Prefer `async/await` over callbacks

**Example:**

```typescript
// Good
async function startAgent(agentId: string): Promise<void> {
  const agent = await database.getAgent(agentId);
  if (!agent) {
    throw new Error('Agent not found');
  }
  
  await dockerManager.startContainer(agentId);
  await database.updateStatus(agentId, 'running');
}

// Avoid
function startAgent(agentId, callback) {
  database.getAgent(agentId, (err, agent) => {
    if (err) return callback(err);
    dockerManager.startContainer(agentId, (err) => {
      if (err) return callback(err);
      database.updateStatus(agentId, 'running', callback);
    });
  });
}
```

### Commit Messages

Write clear, descriptive commit messages:

```
<type>: <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build process or auxiliary tools

**Example:**

```
feat: Add token allowance configuration UI

- Add AgentSettingsModal component
- Implement allowance storage in database
- Add IPC handlers for get/set allowances
- Support native and ERC20 tokens

Closes #42
```

## Submitting Changes

### Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### Create a Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template:
   - Describe the changes
   - Reference any related issues
   - List testing steps
   - Note any breaking changes

### PR Review Process

Maintainers will review your PR and may request changes:

- Address feedback promptly
- Push additional commits to the same branch
- Engage in discussion if you disagree with feedback

Once approved, a maintainer will merge your PR.

## Areas for Contribution

### High-Priority Features

- **Python runtime support**: Extend docker-manager to build Python-based agents
- **Transaction confirmation tracking**: Monitor transactions on-chain and update status
- **Enhanced logging UI**: Real-time log streaming in the UI
- **Agent templates**: Pre-built agent scaffolds for common use cases
- **Multi-wallet support**: Allow connecting multiple wallets
- **API usage dashboard**: Visualize API costs and usage over time

### Bug Fixes

Check the issues page for bugs labeled `good first issue` or `help wanted`.

### Documentation

Improvements to documentation are always welcome:

- Fix typos or unclear explanations
- Add examples or tutorials
- Improve API reference completeness
- Translate documentation (future)

### Testing

- Add unit tests for services
- Add integration tests for IPC handlers
- Add E2E tests for critical workflows
- Improve test coverage

## Code Review Guidelines

### For Contributors

When your PR is under review:

- Be responsive to feedback
- Don't take criticism personally
- Ask for clarification if feedback is unclear
- Update your PR with requested changes
- Mark conversations as resolved when addressed

### For Reviewers

When reviewing PRs:

- Be constructive and respectful
- Explain the reasoning behind suggestions
- Distinguish between blocking issues and suggestions
- Approve when the code meets standards
- Thank contributors for their time

## Security Vulnerabilities

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email security@assegai.example.com with details
3. Allow time for the issue to be addressed before disclosure

Responsible disclosure is appreciated and will be credited.

## Architecture Decisions

Major architectural changes should be discussed before implementation:

1. Open an issue describing the proposal
2. Explain the problem and proposed solution
3. Discuss alternatives and trade-offs
4. Get feedback from maintainers
5. Proceed with implementation once consensus is reached

## Coding Best Practices

### Error Handling

Always handle errors gracefully:

```typescript
// Backend
try {
  await riskyOperation();
} catch (error) {
  console.error('[Component] Error:', error);
  return { success: false, error: error.message };
}

// Frontend
try {
  const result = await window.electronAPI.someAction();
  if (!result.success) {
    alert(`Failed: ${result.error}`);
  }
} catch (error) {
  console.error('IPC error:', error);
  alert('An unexpected error occurred');
}
```

### Type Safety

Use TypeScript's type system effectively:

```typescript
// Define interfaces for complex data
interface TransactionRequest {
  chain: string;
  to: string;
  value: string;
  data: string;
  gasLimit: string;
}

// Use return types
async function createTransaction(req: TransactionRequest): Promise<string> {
  // Implementation
  return txHash;
}

// Avoid 'any' types when possible
```

### Database Operations

Always save after mutations:

```typescript
async updateAgent(id: string, status: string) {
  this.db.run('UPDATE agents SET status = ? WHERE id = ?', [status, id]);
  this.save(); // Don't forget this!
}
```

### IPC Communication

Structure IPC messages consistently:

```typescript
// Main process
ipcMain.handle('action-name', async (event, arg1, arg2) => {
  try {
    const result = await doSomething(arg1, arg2);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Renderer process
const result = await window.electronAPI.actionName(arg1, arg2);
if (!result.success) {
  // Handle error
}
```

## Documentation Standards

### Code Comments

Comment complex logic:

```typescript
// Good: Explains the "why"
// Reset spending limits if the time window has expired
if (Date.now() > limiter.resetAt) {
  limiter.count = 0;
  limiter.resetAt = Date.now() + windowMs;
}

// Avoid: States the obvious
// Set count to 0
limiter.count = 0;
```

### JSDoc for Public APIs

Document public methods:

```typescript
/**
 * Starts a Docker container for the specified agent.
 * 
 * @param agentId - The unique identifier of the agent
 * @throws {Error} If the agent is not found or Docker fails
 * @returns Promise that resolves when the container is running
 */
async startAgent(agentId: string): Promise<void> {
  // Implementation
}
```

### README Updates

If your PR adds new features:

- Update the README with usage examples
- Add any new dependencies or requirements
- Update screenshots or demos if applicable

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Recognition

Contributors will be recognized in:

- The README contributors section
- Release notes for significant features
- Credits in the application (future)

Thank you for contributing to Assegai!