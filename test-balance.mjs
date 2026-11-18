import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate .env.local: check current working directory, script directory, and workspace/arl
const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(__dirname, '.env.local'),
  path.resolve(__dirname, 'workspace', 'arl', '.env.local'),
  'C:\\Users\\Roselle Tabuena\\workspace\\arl\\.env.local',
];

const envFile = envPaths.find((p) => fs.existsSync(p));
if (envFile) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = (match[2] || '').trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[match[1]] = val;
    }
  }
} else {
  console.warn('Warning: .env.local not found in search paths.');
}

// Locate philsms-balance-service.ts
const servicePaths = [
  path.resolve(__dirname, 'lib', 'services', 'philsms-balance-service.ts'),
  path.resolve(__dirname, 'workspace', 'arl', 'lib', 'services', 'philsms-balance-service.ts'),
  'C:\\Users\\Roselle Tabuena\\workspace\\arl\\lib\\services\\philsms-balance-service.ts',
];

const serviceFile = servicePaths.find((p) => fs.existsSync(p));

let result;
try {
  if (serviceFile) {
    const { getPhilSmsBalance } = await import(pathToFileURL(serviceFile).href);
    result = await getPhilSmsBalance({ forceRefresh: true });
  } else {
    throw new Error('Service file not found');
  }
} catch {
  // If importing TypeScript directly failed under plain Node without type stripping, query directly
  const apiToken = process.env.PHILSMS_API_TOKEN?.trim();
  const isMock = process.env.PHILSMS_MOCK_DISPATCH === 'true' || !apiToken;
  const configuredSenderId = (process.env.PHILSMS_SENDER_ID || 'PHIL_SMS').trim();
  const baseUrl = (
    process.env.PHILSMS_API_BASE_URL ||
    process.env.PHILSMS_BASE_URL ||
    'https://dashboard.philsms.com/api/v3'
  ).replace(/\/+$/, '');

  if (isMock) {
    result = {
      success: true,
      balance: 9999,
      currency: 'PHP',
      senderId: configuredSenderId,
      isMock: true,
      cached: false,
      warningLevel: 'mock',
      statusText: 'Mock Gateway Mode (Offline Development)',
    };
  } else {
    try {
      const res = await fetch(`${baseUrl}/balance`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      result = {
        success: res.ok,
        status: res.status,
        data,
      };
    } catch (fetchErr) {
      result = {
        success: false,
        error: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
      };
    }
  }
}

console.log('Result:', JSON.stringify(result, null, 2));
