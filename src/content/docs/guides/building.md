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

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential libsecret-1-dev

# Fedora
sudo dnf install gcc-c++ libsecret-devel
```

**macOS:**
```bash
# Xcode Command Line Tools
xcode-select --install
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
├── vite.config.ts
└── electron.vite.config.ts
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

On Linux, set the environment variable to disable sandbox:

```bash
pnpm run build:linux
```

This is equivalent to:

```bash
ELECTRON_DISABLE_SANDBOX=1 pnpm run build
```

## Packaging for Distribution

Electron Builder is configured but not fully implemented in the provided codebase. To add packaging:

### Install electron-builder

Already included in `devDependencies`:

```json
{
  "devDependencies": {
    "electron-builder": "^26.0.12"
  }
}
```

### Add Build Configuration

Create `electron-builder.json`:

```json
{
  "appId": "com.assegai.sandbox",
  "productName": "Assegai",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "package.json"
  ],
  "extraResources": [
    {
      "from": "node_modules/sql.js/dist/sql-wasm.wasm",
      "to": "sql-wasm.wasm"
    }
  ],
  "mac": {
    "target": ["dmg", "zip"],
    "category": "public.app-category.developer-tools"
  },
  "win": {
    "target": ["nsis", "portable"]
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "category": "Development"
  }
}
```

### Add Package Scripts

Update `package.json`:

```json
{
  "scripts": {
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "dist:mac": "electron-builder --mac",
    "dist:win": "electron-builder --win",
    "dist:linux": "electron-builder --linux"
  }
}
```

### Package the Application

```bash
# Build for current platform
pnpm run dist

# Build for specific platform
pnpm run dist:mac
pnpm run dist:win
pnpm run dist:linux
```

Output will be in the `release/` directory.

## Database Schema

The SQLite database is initialized in `database.ts`. To modify the schema:

1. Edit the `CREATE TABLE` statements in `initialize()`
2. Run a development build
3. Delete the existing database file (for testing)
4. Restart the app to create the new schema

Database location:

- **Dev**: `<userData>/assegai.db` (created on first run)
- **Prod**: `<userData>/assegai.db`

### Adding Tables

Example: Add a `notifications` table:

```javascript
this.db.run(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
  );
`);
```

### Migrations

For production deployments, implement migrations to avoid data loss:

```javascript
// Check schema version
const version = await this.getSetting('schema_version') || 0;

if (version < 1) {
  // Apply migration 1
  this.db.run(`ALTER TABLE agents ADD COLUMN last_run INTEGER`);
  await this.setSetting('schema_version', 1);
}

if (version < 2) {
  // Apply migration 2
  this.db.run(`CREATE TABLE notifications (...)`);
  await this.setSetting('schema_version', 2);
}
```

## Modifying the Frontend

The frontend is built with Vue 3 and Vite.

### Adding Components

Create a new component in `src/render/components/`:

```vue
<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>();
</script>

<style scoped>
.my-component {
  padding: 1rem;
}
</style>
```

Import and use in a view:

```vue
<script setup>
import MyComponent from './components/MyComponent.vue';
</script>

<template>
  <MyComponent title="Hello!" />
</template>
```

### Adding Pinia Stores

Create a new store in `src/render/stores/`:

```typescript
import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: []
  }),
  
  actions: {
    async loadNotifications() {
      this.notifications = await window.electronAPI.notifications.list();
    }
  }
});
```

Use in components:

```vue
<script setup>
import { onMounted } from 'vue';
import { useNotificationStore } from '../stores/notificationStore';

const notificationStore = useNotificationStore();

onMounted(() => {
  notificationStore.loadNotifications();
});
</script>
```

### Styling

Assegai uses Tailwind CSS with a custom theme. Colors are defined in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {...},
        accent: {...},
        background: {...}
      }
    }
  }
};
```

Use semantic color classes:

```html
<div class="bg-background-primary text-text-primary">
  <button class="bg-accent text-text-inverted">
    Click me
  </button>
</div>
```

Dark mode is handled via the `dark:` prefix:

```html
<div class="bg-white dark:bg-gray-900">
  Content
</div>
```

## Adding IPC Handlers

IPC communication between main and renderer processes is handled in `src/main/index.ts`.

### Main Process Handler

```typescript
ipcMain.handle('my-channel', async (event, arg) => {
  // Process the request
  return { success: true, data: result };
});
```

### Preload Script

Expose the handler in `src/preload/index.ts`:

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  myFeature: {
    call: (arg) => ipcRenderer.invoke('my-channel', arg)
  }
});
```

### Renderer Usage

Call from Vue components:

```typescript
const result = await window.electronAPI.myFeature.call(someArg);
```

## Testing

Testing infrastructure is not included but can be added:

### Unit Tests (Vitest)

```bash
pnpm add -D vitest @vue/test-utils
```

Add test script:

```json
{
  "scripts": {
    "test": "vitest"
  }
}
```

Create test files:

```typescript
// src/render/components/MyComponent.spec.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from './MyComponent.vue';

describe('MyComponent', () => {
  it('renders title', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' }
    });
    expect(wrapper.text()).toContain('Test');
  });
});
```

### E2E Tests (Playwright)

```bash
pnpm add -D playwright @playwright/test
```

Configure for Electron:

```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

test('launches app', async () => {
  const electronApp = await electron.launch({
    args: ['dist/main/index.js']
  });
  
  const window = await electronApp.firstWindow();
  expect(await window.title()).toBe('Assegai');
  
  await electronApp.close();
});
```

## Debugging

### Main Process

Use Node.js debugger:

```bash
# Start with debugging enabled
node --inspect-brk dist/main/index.js
```

Attach Chrome DevTools to `chrome://inspect`.

### Renderer Process

Open DevTools in the app (automatically opened in dev mode):

- **Windows/Linux**: `Ctrl+Shift+I`
- **macOS**: `Cmd+Option+I`

Or programmatically:

```typescript
mainWindow.webContents.openDevTools();
```

### VSCode Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "args": [".", "--remote-debugging-port=9223"],
      "outputCapture": "std"
    }
  ]
}
```

## Common Build Issues

### WASM File Not Found

If `sql-wasm.wasm` is missing:

```bash
# Copy manually
cp node_modules/sql.js/dist/sql-wasm.wasm dist/
```

Or configure electron-builder to include it:

```json
{
  "extraResources": [
    {
      "from": "node_modules/sql.js/dist/sql-wasm.wasm",
      "to": "."
    }
  ]
}
```

### Docker API Errors

Ensure Docker is running:

```bash
docker ps
```

If using Windows with WSL2, ensure Docker Desktop is configured for WSL2 integration.

### Vite Build Errors

Clear the cache:

```bash
rm -rf node_modules/.vite
pnpm run build
```

### TypeScript Errors

Ensure all dependencies are installed:

```bash
pnpm install
```

Check `tsconfig.json` for correct paths.

## Performance Optimization

### Frontend Bundle Size

Analyze the bundle:

```bash
pnpm run build -- --analyze
```

Optimize by:

- Lazy-loading components
- Tree-shaking unused dependencies
- Using smaller libraries

### Main Process Startup

Profile startup time:

```bash
NODE_OPTIONS='--prof' pnpm run start
```

Generate report:

```bash
node --prof-process isolate-*.log > profile.txt
```

### Database Performance

For large transaction histories:

- Add indexes on frequently queried columns
- Implement pagination in the UI
- Archive old transactions to a separate table
