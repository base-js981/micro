import { SetMetadata } from '@nestjs/common';

export const ABAC_KEY = 'abac';
export interface AbacMetadata {
  resource: string; // e.g., "users", "roles", "documents"
  action: string; // e.g., "read", "write", "delete"
  resourceIdParam?: string; // Route parameter name for resource ID (e.g., "id")
}

/**
 * Decorator to mark a route as requiring ABAC (Attribute-Based Access Control)
 * @param resource - The resource type (e.g., "users", "roles")
 * @param action - The action being performed (e.g., "read", "write", "delete")
 * @param resourceIdParam - Optional route parameter name for resource ID (default: "id")
 */
export const Abac = (resource: string, action: string, resourceIdParam?: string) =>
  SetMetadata(ABAC_KEY, { resource, action, resourceIdParam } as AbacMetadata);

