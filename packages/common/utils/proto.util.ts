import { join, dirname } from 'path';

// Declare __dirname for TypeScript (available in CommonJS after compilation)
declare const __dirname: string;

/**
 * Get the path to a proto file in the @micro/common package
 * @param protoPath Relative path from protos directory (e.g., 'services/auth-service.proto')
 * @returns Absolute path to the proto file
 */
export function getProtoPath(protoPath: string): string {
  const distDir = dirname(__dirname);
  return join(distDir, 'protos', protoPath);
}

