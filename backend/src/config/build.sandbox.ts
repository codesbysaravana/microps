/**
 * Build Sandbox Configuration
 * 
 * These constraints are applied to every tenant Docker build to prevent:
 * 1. Resource exhaustion (CPU, memory, fork bombs)
 * 2. AWS metadata endpoint access (credential theft)
 * 3. Cross-tenant interference
 */

export const SANDBOX_CONFIG = {
  // Hard resource limits per build container
  MEMORY_LIMIT: '1g',        // 1GB max — sufficient for Node/Python/Java builds
  CPU_LIMIT: '1.5',          // 1.5 CPU cores
  PID_LIMIT: 256,            // Prevents fork bombs

  // Network security
  // Block the AWS EC2 metadata endpoint so build scripts cannot steal instance credentials
  METADATA_BLOCK_HOST: '169.254.169.254:127.0.0.1',

  // Build timeout (seconds) — kills stuck builds
  BUILD_TIMEOUT_SECONDS: 600,  // 10 minutes
} as const;

/**
 * Returns Docker CLI flags that sandbox a build container.
 * These flags are injected into the `docker build` shell command
 * that runs on the EC2 GitHub Actions runner.
 */
export function getSandboxDockerRunFlags(): string {
  return [
    `--memory=${SANDBOX_CONFIG.MEMORY_LIMIT}`,
    `--cpus=${SANDBOX_CONFIG.CPU_LIMIT}`,
    `--pids-limit=${SANDBOX_CONFIG.PID_LIMIT}`,
    `--add-host=${SANDBOX_CONFIG.METADATA_BLOCK_HOST}`,
  ].join(' ');
}

/**
 * Returns Docker build CLI flags (subset safe for `docker build`).
 * `docker build` supports --memory and --cpu-period/--cpu-quota but not --pids-limit.
 * The pids-limit and metadata block are applied at `docker run` time via the generated start script.
 */
export function getSandboxDockerBuildFlags(): string {
  return [
    `--memory=${SANDBOX_CONFIG.MEMORY_LIMIT}`,
    `--cpu-period=100000`,
    `--cpu-quota=150000`,  // 1.5 CPUs worth
  ].join(' ');
}
