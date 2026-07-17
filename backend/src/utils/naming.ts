import crypto from 'crypto';

/**
 * Generates a collision-resistant, deterministic target group name.
 * AWS limit: 32 chars, alphanumeric + hyphens only.
 *
 * Format: tg-u{userId}-{hash}
 * Where hash is first 8 chars of SHA-256 hex digest of projectName.
 *
 * Examples:
 *   generateTargetGroupName(123, "my-app") -> "tg-u123-a1b2c3d4"
 *   generateTargetGroupName(123, "my-app-with-very-long-name") -> "tg-u123-e5f6g7h8" (different hash)
 *
 * @param userId - Numeric user ID
 * @param projectName - Full project name (no length restriction)
 * @returns Target group name, max 32 chars
 */
export function generateTargetGroupName(userId: number, projectName: string): string {
  // Hash the full project name to 8 hex chars (4 billion combinations)
  const hash = crypto.createHash('sha256').update(projectName).digest('hex').substring(0, 8);

  // Format: tg-u{userId}-{hash}
  // Max length: "tg-u" (4) + userId (assume max 10 digits) + "-" (1) + hash (8) = 23 chars (well under 32)
  const targetGroupName = `tg-u${userId}-${hash}`;

  // Validate AWS naming constraints
  if (targetGroupName.length > 32) {
    throw new Error(`Target group name exceeds 32 chars: ${targetGroupName}`);
  }

  if (!/^[a-zA-Z0-9-]+$/.test(targetGroupName)) {
    throw new Error(`Target group name contains invalid characters: ${targetGroupName}`);
  }

  return targetGroupName;
}

/**
 * Generates a collision-resistant, deterministic ECS service name.
 *
 * Format: svc-u{userId}-{hash}
 *
 * @param userId - Numeric user ID
 * @param projectName - Full project name
 * @returns Service name for ECS
 */
export function generateServiceName(userId: number, projectName: string): string {
  const hash = crypto.createHash('sha256').update(projectName).digest('hex').substring(0, 8);
  return `svc-u${userId}-${hash}`;
}

/**
 * Generates a collision-resistant, deterministic ECS task family name.
 *
 * Format: task-u{userId}-{hash}
 *
 * @param userId - Numeric user ID
 * @param projectName - Full project name
 * @returns Task family name for ECS
 */
export function generateTaskFamilyName(userId: number, projectName: string): string {
  const hash = crypto.createHash('sha256').update(projectName).digest('hex').substring(0, 8);
  return `task-u${userId}-${hash}`;
}
