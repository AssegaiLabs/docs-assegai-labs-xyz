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