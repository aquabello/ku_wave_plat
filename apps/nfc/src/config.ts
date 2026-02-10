import * as fs from 'fs';
import * as path from 'path';
import { NfcAgentConfig } from '@ku/types';

const CONFIG_PATH = path.resolve(__dirname, '../config.json');
const CONFIG_EXAMPLE_PATH = path.resolve(__dirname, '../config.example.json');

export function loadConfig(): NfcAgentConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`ERROR: config.json not found at ${CONFIG_PATH}`);
    console.error(`Copy config.example.json to config.json and set your API key.`);
    console.error(`  cp config.example.json config.json`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const config: NfcAgentConfig = JSON.parse(raw);

  // 필수값 검증
  if (!config.apiUrl) throw new Error('config.apiUrl is required');
  if (!config.apiKey) throw new Error('config.apiKey is required');
  if (config.apiKey === 'rdr_YOUR_API_KEY_HERE') {
    throw new Error('config.apiKey must be set to a valid API key from the console');
  }

  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    retryInterval: config.retryInterval ?? 5000,
    offlineQueueMax: config.offlineQueueMax ?? 100,
    buzzerEnabled: config.buzzerEnabled ?? true,
    logLevel: config.logLevel ?? 'info',
  };
}
