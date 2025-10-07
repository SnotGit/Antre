"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const crypto_1 = require("crypto");
//======= CONFIGURATION =======
const SECRETS_DIR = (0, path_1.join)(__dirname, '..', '..', '..', 'secrets');
const SECRET_FILE = (0, path_1.join)(SECRETS_DIR, 'jwt.json');
//======= SECRET MANAGEMENT =======
const ensureSecretFile = () => {
    if (!(0, fs_1.existsSync)(SECRETS_DIR)) {
        (0, fs_1.mkdirSync)(SECRETS_DIR, { recursive: true, mode: 0o700 });
    }
    if (!(0, fs_1.existsSync)(SECRET_FILE)) {
        const secret = (0, crypto_1.randomBytes)(32).toString('hex');
        const config = { secret };
        (0, fs_1.writeFileSync)(SECRET_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
    }
};
//======= JWT CONFIGURATION =======
const getJwtSecret = () => {
    ensureSecretFile();
    const config = JSON.parse((0, fs_1.readFileSync)(SECRET_FILE, 'utf8'));
    return config.secret;
};
exports.getJwtSecret = getJwtSecret;
