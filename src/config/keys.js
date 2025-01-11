import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Create a data directory if it doesn't exist
const DATA_DIR = join(process.cwd(), 'data');
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR);
}

const KEYS_FILE = join(DATA_DIR, 'keys.json');

class KeyManager {
  constructor() {
    try {
      this.keys = JSON.parse(readFileSync(KEYS_FILE));
    } catch {
      this.keys = {};
      this.saveKeys();
    }
  }

  generateKey() {
    const apiKey = uuidv4();
    this.keys[apiKey] = {
      createdAt: new Date().toISOString(),
      requestCount: 0
    };
    this.saveKeys();
    return apiKey;
  }

  validateKey(apiKey) {
    return this.keys.hasOwnProperty(apiKey);
  }

  incrementRequestCount(apiKey) {
    if (this.keys[apiKey]) {
      this.keys[apiKey].requestCount++;
      this.saveKeys();
    }
  }

  saveKeys() {
    writeFileSync(KEYS_FILE, JSON.stringify(this.keys, null, 2));
  }
}

export const keyManager = new KeyManager();