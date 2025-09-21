import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

//======= CONFIGURATION =======

const SECRETS_DIR = join(__dirname, '..', '..', '..', 'secrets');
const SECRET_FILE = join(SECRETS_DIR, 'jwt.json');

//======= SECRET MANAGEMENT =======

const ensureSecretFile = (): void => {
  if (!existsSync(SECRETS_DIR)) {
    mkdirSync(SECRETS_DIR, { recursive: true, mode: 0o700 });
  }

  if (!existsSync(SECRET_FILE)) {
    const secret = randomBytes(32).toString('hex');
    const config = { secret };
    writeFileSync(SECRET_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
  }
};

//======= JWT CONFIGURATION =======

export const getJwtSecret = (): string => {
  ensureSecretFile();
  const config = JSON.parse(readFileSync(SECRET_FILE, 'utf8'));
  return config.secret;
};