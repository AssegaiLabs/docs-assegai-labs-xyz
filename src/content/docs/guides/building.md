---
title: Building from Source
---
This guide covers building Assegai from source for development or customization purposes.

## Prerequisites

### Required Software

- **Node.js**: Version 20 or higher
- **pnpm**: Package manager (recommended over npm)
- **Docker**: Docker Desktop or Docker Engine must be running
- **Git**: For cloning the repository

### Platform-Specific Requirements

**macOS:**
```bash
# Xcode Command Line Tools - if not already installed
xcode-select --install
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential libsecret-1-dev

# Fedora
sudo dnf install gcc-c++ libsecret-devel
```

**Windows:**
- Install Visual Studio Build Tools
- Ensure Python 3 is available (required for node-gyp)

## Cloning the Repository

```bash
git clone https://github.com/your-org/assegai-sandbox.git
cd assegai-sandbox
```

## Installing Dependencies

Assegai uses `pnpm` for dependency management:

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install project dependencies
pnpm install
```

This will install:

- Electron and build tools
- Vue 3 and Pinia for the frontend
- Docker API bindings
- WalletConnect libraries
- Express for the API proxy
- sql.js for the database

## Project Structure

```
assegai-sandbox/
├── docker
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main entry point
│   │   └── services/      # Backend services
│   │       ├── api-proxy.ts
│   │       ├── database.ts
│   │       ├── docker-manager.ts
│   │       ├── wallet-manager.ts
│   │       └── key-storage.ts
│   ├── preload/           # Preload scripts (IPC bridge)
│   └── render/            # Vue frontend
│       ├── App.vue
│       ├── components/
│       └── stores/
├── shared/                # Shared types and constants
├── dist/                  # Build output
├── package.json
├── tsconfig.json
├── vite.config.cjs
├── eslint.config.mjs
├── electron-builder.config.ts
├── tsconfig.node.json
├── tsconfig.main.json
└── # additional config
```

## Development Build

### Building the Application

```bash
pnpm run build
```

This command:

1. Compiles TypeScript to JavaScript
2. Bundles the Vue frontend with Vite
3. Processes Electron main and preload scripts
4. Outputs to `dist/` directory

Build output structure:

```
dist/
├── main/           # Main process JavaScript
├── preload/        # Preload scripts
└── render/         # Frontend HTML/JS/CSS
```

### Running in Development Mode

```bash
pnpm run dev
```

This starts:

- Vite dev server on `http://localhost:5173`
- Electron app in development mode
- Hot module replacement (HMR) for the frontend

The app will:

- Load the frontend from the dev server
- Open DevTools automatically
- Enable verbose logging
- Reload on main process changes (manual restart required)

### Development vs Production Mode

The application detects its mode via the `NODE_ENV` variable:

```javascript
const isDev = process.env.NODE_ENV !== 'production' && 
              !fs.existsSync(rendererPath);
```

**Development mode:**

- Frontend loaded from Vite dev server
- DevTools opened by default
- Detailed error messages
- No auto-hide menu bar

**Production mode:**

- Frontend loaded from `dist/render/index.html`
- DevTools closed by default
- Generic error messages
- Auto-hide menu bar

## Building for Production

### Standard Build

```bash
pnpm run build
pnpm run start
```

This builds and runs the production app without packaging.

### Linux-Specific Build

On Linux, set the environment variable to disable sandbox ([a requirement for electron it seems](https://github.com/mifi/lossless-cut/issues/258))

```bash
pnpm run build:linux
```

This is equivalent to:

```bash
ELECTRON_DISABLE_SANDBOX=1 pnpm run build
```

## Database Schema

The SQLite database is initialized in `database.ts`. To modify the schema:

1. Edit the `CREATE TABLE` statements in `initialize()`
2. Run a development build
3. Delete the existing database file (for testing)
4. Restart the app to create the new schema

Database location:

- **Dev**: `<userData>/assegai.db` (created on first run)
- **Prod**: `<userData>/assegai.db`
