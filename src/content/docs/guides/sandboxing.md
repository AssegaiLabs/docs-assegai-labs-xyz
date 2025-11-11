---
title: Sandboxing
---
Assegai runs each agent in an isolated Docker container with strict security controls. This sandboxing prevents agents from accessing the host system, other containers, or unauthorized network resources.

## Why Docker?

Docker provides several security benefits:

- **Process isolation**: Agents run in separate process namespaces
- **Filesystem isolation**: Agents cannot access host files
- **Network isolation**: Agents cannot reach arbitrary network endpoints
- **Resource limits**: CPU and memory are strictly capped
- **Immutable runtime**: Root filesystem is read-only

Without containerization, a malicious or buggy agent could compromise the entire system.

## Container Configuration

Each agent container is created with hardened security settings:

```javascript
{
  Image: 'assegai-agent-<id>:latest',
  HostConfig: {
    // Filesystem security
    ReadonlyRootfs: true,
    
    // Capability dropping
    CapDrop: ['ALL'],
    
    // Security options
    SecurityOpt: ['no-new-privileges'],
    
    // Resource limits
    Memory: <configured memory>,
    MemorySwap: <configured memory>,
    CpuQuota: <configured CPU * 100000>,
    CpuPeriod: 100000,
    
    // Network isolation
    NetworkMode: 'assegai-bridge',
    
    // Volume mounts
    Binds: ['assegai-<id>-workspace:/agent-workspace:rw']
  }
}
```

### Read-Only Root Filesystem

The container's root filesystem is mounted read-only:

```javascript
ReadonlyRootfs: true
```

This prevents agents from:

- Modifying system binaries
- Installing additional packages
- Creating persistent backdoors
- Tampering with Node.js runtime files

The only writable location is `/agent-workspace`, a dedicated volume for agent data.

### Capability Dropping

All Linux capabilities are dropped:

```javascript
CapDrop: ['ALL']
```

This removes the container's ability to:

- Change file ownership
- Manage network interfaces
- Load kernel modules
- Execute privileged operations

Even if an agent exploits a vulnerability, it cannot escalate privileges.

### No New Privileges

The `no-new-privileges` security option prevents privilege escalation:

```javascript
SecurityOpt: ['no-new-privileges']
```

This ensures:

- SUID binaries cannot grant additional privileges
- Child processes inherit restrictions
- Exploits cannot bypass the security model

### Resource Limits

CPU and memory are strictly capped per the agent's manifest:

```javascript
// Memory limit (e.g., 512MB)
Memory: 536870912,
MemorySwap: 536870912,  // Prevent swap usage

// CPU limit (e.g., 0.5 cores)
CpuQuota: 50000,
CpuPeriod: 100000
```

Resource limits prevent:

- Denial-of-service attacks on the host
- Runaway processes consuming all CPU
- Memory exhaustion crashes

Agents that exceed limits are throttled or killed by Docker.

### Network Isolation

Agents run on a dedicated bridge network:

```javascript
NetworkMode: 'assegai-bridge'
```

The `assegai-bridge` network is created by Assegai with this configuration:

```javascript
{
  Name: 'assegai-bridge',
  Driver: 'bridge',
  Internal: false,  // Allows external access
  EnableIPv6: false,
  IPAM: {
    Config: [{
      Subnet: '172.28.0.0/16',
      Gateway: '172.28.0.1'
    }]
  }
}
```

**Network access:**

- Agents can reach `host.docker.internal` (the API proxy)
- Agents can reach whitelisted RPC endpoints (if accessible)
- Agents **cannot** reach other containers
- Agents **cannot** reach arbitrary internet hosts

The network is not marked `Internal: true` because agents need to call external RPC nodes and AI APIs (via the proxy).

### Workspace Volume

Each agent gets a persistent, writable volume:

```javascript
Binds: ['assegai-<id>-workspace:/agent-workspace:rw']
```

This volume:

- Is unique per agent (isolated from other agents)
- Persists across container restarts
- Is deleted when the agent is deleted
- Is the only writable location in the container

Agents can store state, logs, or temporary files here.

## Image Building

Agent images are built from the agent's directory with an auto-generated or custom Dockerfile.

### Auto-Generated Dockerfile (Node.js)

If no Dockerfile is present, Assegai generates one:

```dockerfile
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 agent && adduser -D -u 1001 -G agent agent

# Set working directory
WORKDIR /agent-code

# Copy and install dependencies
COPY --chown=agent:agent package*.json ./
RUN npm install --omit=dev

# Copy agent code
COPY --chown=agent:agent . .

# Create and set permissions for workspace
RUN mkdir /agent-workspace && chown agent:agent /agent-workspace
VOLUME /agent-workspace

# Run as non-root user
USER agent

# Execute entrypoint
CMD ["node", "index.js"]
```

Key features:

- **Alpine base**: Minimal attack surface
- **Non-root user**: Agent runs as UID 1001
- **Ownership**: All files owned by `agent:agent`
- **Production dependencies**: `--omit=dev` excludes dev dependencies

### Custom Dockerfiles

Agents can provide custom Dockerfiles for advanced scenarios:

```dockerfile
FROM node:20-alpine

# Install additional system packages (if needed)
RUN apk add --no-cache python3 py3-pip

# Continue with standard setup
RUN addgroup -g 1001 agent && adduser -D -u 1001 -G agent agent
WORKDIR /agent-code
COPY --chown=agent:agent . .
RUN npm install --omit=dev

USER agent
CMD ["node", "index.js"]
```

**Security requirement**: Custom Dockerfiles must run the agent as a non-root user. Failure to do so may bypass some isolation mechanisms.

### Build Process

During installation:

1. Assegai creates a tarball of the agent directory
2. The tarball is streamed to Docker for building
3. Docker builds the image with label `assegai.managed: true`
4. The image is tagged as `assegai-agent-<id>:latest`
5. Build logs are streamed to the console

If the build fails, the installation is aborted with the error details.

## Runtime Environment

Agents receive environment variables for API proxy access:

```bash
NODE_ENV=production
ASSEGAI_API_PROXY=http://host.docker.internal:8765
ASSEGAI_AGENT_ID=<unique-agent-id>
ASSEGAI_AGENT_TOKEN=<unique-auth-token>
```

- **ASSEGAI_API_PROXY**: URL of the API proxy server
- **ASSEGAI_AGENT_ID**: Unique identifier for authentication
- **ASSEGAI_AGENT_TOKEN**: Session-specific authentication token

These variables are injected at container creation and are not visible to other containers or the host filesystem.

### `host.docker.internal`

The `host.docker.internal` hostname resolves to the host machine's IP from inside the container. This is enabled via:

```javascript
ExtraHosts: ['host.docker.internal:host-gateway']
```

This allows agents to communicate with the API proxy running on the host without exposing the proxy to the network.

## Logging

Container logs are captured by Docker with size limits:

```javascript
LogConfig: {
  Type: 'json-file',
  Config: {
    'max-size': '10m',
    'max-file': '3'
  }
}
```

This retains:

- Maximum 10MB per log file
- Maximum 3 log files (30MB total)

Logs automatically rotate and old entries are discarded. Agents should use the SDK's `log()` method to send important messages to Assegai's UI rather than relying solely on stdout.

## Container Lifecycle

### Creation

When an agent starts:

1. Docker creates a new container from the agent's image
2. A unique name is assigned: `assegai-agent-<id>`
3. The workspace volume is created (if it doesn't exist)
4. Environment variables are injected
5. The container is started

### Execution

The container runs until:

- The agent process exits
- The user stops the agent
- Docker daemon stops
- The container exceeds resource limits

### Shutdown

When an agent stops:

1. Docker sends `SIGTERM` to the container
2. The agent has 10 seconds to shut down gracefully
3. Docker sends `SIGKILL` if the agent doesn't exit
4. The container is removed
5. The workspace volume persists

Agents should handle `SIGTERM` to clean up resources:

```javascript
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});
```

### Cleanup

When an agent is deleted:

1. The container is stopped and removed
2. The Docker image is deleted
3. The workspace volume is deleted
4. Database records are purged

This is irreversible.

## Security Boundaries

### What Agents Can Do

- Read their own code and dependencies
- Write to `/agent-workspace`
- Make network requests to whitelisted endpoints (via proxy)
- Query blockchain data (via proxy)
- Request transactions (subject to approval)
- Call AI APIs (via proxy, if configured)

### What Agents Cannot Do

- Access the host filesystem
- Access other containers
- Modify the container's root filesystem
- Escalate privileges
- Make arbitrary network requests
- Execute privileged system calls
- Access Docker socket
- Access the wallet or API keys directly

### Threat Model

Docker isolation protects against:

- **Malicious agents**: Cannot exfiltrate data or compromise the host
- **Compromised dependencies**: Limited blast radius if a package is exploited
- **Accidental errors**: Cannot corrupt system files or other agents

### Improvement areas:

1. **Shared API keys**: All agents use the same keys, so a compromised agent can consume API quotas
2. **Host network access**: Agents can reach any network endpoint accessible from the host (via proxy whitelisting)
3. **Docker daemon access**: Users with Docker access can inspect containers and potentially extract sensitive data

For maximum security, run Assegai on a dedicated machine or VM.

## Advanced: Custom Security Policies

Docker's security options can be extended with additional policies:

### AppArmor (Linux)

Apply an AppArmor profile:

```javascript
SecurityOpt: ['no-new-privileges', 'apparmor=<profile-name>']
```

### SELinux (Linux)

Apply SELinux labels:

```javascript
SecurityOpt: ['no-new-privileges', 'label=type:<selinux_type>']
```

### Seccomp (Linux)

Apply a custom seccomp profile:

```javascript
SecurityOpt: ['no-new-privileges', 'seccomp=<profile.json>']
```

These require host-level configuration and are not currently exposed in Assegai's UI.

## Troubleshooting

### Container Won't Start

Check that:

- Docker is running
- The agent image was built successfully
- Resource limits are reasonable (not too low)
- The workspace volume is accessible

### Network Requests Fail

Verify:

- The proxy is running on port 8765
- `host.docker.internal` resolves correctly
- The agent is authenticating with the correct credentials

On Linux, `host.docker.internal` may not work by default. Use `--add-host` or configure Docker's DNS.

### Agent Crashes with "Permission Denied"

Ensure:

- The agent is not trying to write to read-only locations
- All writes go to `/agent-workspace`
- File permissions are correct in the image

### High Resource Usage

If an agent consumes excessive resources:

- Lower CPU and memory limits in the manifest
- Check for infinite loops or memory leaks
- Review the agent's code for inefficiencies

Docker will throttle or kill agents that exceed limits.

## Best Practices

### For Agent Developers

- Write to `/agent-workspace` for persistent data
- Handle `SIGTERM` gracefully
- Don't assume root filesystem is writable
- Test with minimal resource limits
- Use Alpine-based images for smaller attack surface

### For Users

- Only install agents from trusted sources
- Review Dockerfiles in custom agents
- Monitor container resource usage
- Keep Docker updated for security patches
- Regularly audit running containers

### For Production Deployments

- Use dedicated API keys with spending caps
- Enable Docker's audit logging
- Run Assegai in a VM or isolated environment
- Implement network-level egress filtering
- Regularly review agent logs and transaction history
