---
title: Installation
---
Assegai AI Sandbox is a cross-platform desktop application that enables you to run AI agents in isolated Docker environments with blockchain transaction capabilities.

## System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+ recommended)
- **Docker**: Docker Desktop (or Docker Engine on Linux) must be installed and running
- **Node.js**: Version 20+ (for building from source)
- **Memory**: 4GB RAM minimum, 8GB+ recommended
- **Storage**: 2GB free space for the application and Docker images

## Docker Installation

Assegai requires Docker to run agents in isolated containers. Install Docker Desktop for your platform:

- **Windows/Mac**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Install Docker Engine using your distribution's package manager

Verify Docker is running:

```bash
docker ps
```

If this command succeeds, Docker is properly configured.

## Installing Assegai

### Pre-built Binaries

Coming soon. For now:

### Building from Source

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

## First Launch

On first launch, Assegai will:

1. Initialize the SQLite database in your user data directory
2. Create the Docker bridge network (`assegai-bridge`)
3. Start the API proxy server on port 8765
4. Present the wallet connection screen

## Troubleshooting

### Docker Not Running

If you see "Docker is not running or accessible", ensure:

1. Docker Desktop is launched and running
2. Your user has permissions to access Docker (on Linux, add yourself to the `docker` group)
3. The Docker daemon is accepting connections

### Port 8765 Already in Use

If the API proxy fails to start, another service may be using port 8765. Check for conflicts:

```bash
# Linux/Mac
lsof -i :8765

# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 8765
```

### WASM Loading Error

If the application fails to initialize with a WASM-related error, the `sql-wasm.wasm` file may be missing. This typically only affects custom builds. Verify the file exists in:

- Development: `node_modules/sql.js/dist/sql-wasm.wasm`
- Production: `resources/sql-wasm.wasm`

