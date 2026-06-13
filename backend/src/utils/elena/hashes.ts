import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const STAGING_DIR = 'staging';
const REGISTRY_PATH = path.join(STAGING_DIR, 'hashes.json');

export function fileHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function loadHashRegistry(): Record<string, string> {
  try {
    if (!existsSync(REGISTRY_PATH)) return {};
    return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveHashRegistry(registry: Record<string, string>): void {
  mkdirSync(STAGING_DIR, { recursive: true });
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}
