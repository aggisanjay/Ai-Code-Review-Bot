/**
 * sync-schema.js
 * Automatically detects whether DATABASE_URL is Neon/PostgreSQL or SQLite
 * and configures the Prisma datasource provider accordingly.
 */
const fs = require('fs');
const path = require('path');

// Safe dotenv loading without crashing if dotenv is not yet installed
try {
  const dotenv = require('dotenv');
  const rootEnvPath = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  }
  dotenv.config();
} catch (_e) {
  // Graceful fallback: manually parse .env if present
  try {
    const rootEnvPath = path.resolve(__dirname, '../../../.env');
    const envFile = fs.existsSync(rootEnvPath) ? rootEnvPath : path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      content.split('\n').forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match && !process.env[match[1]]) {
          let value = (match[2] || '').trim();
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          process.env[match[1]] = value;
        }
      });
    }
  } catch (_err) {}
}

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error('[sync-schema] schema.prisma not found at:', schemaPath);
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Replace provider = "..."
const updatedContent = schemaContent.replace(
  /datasource\s+db\s*\{\s*provider\s*=\s*["'][^"']+["']/,
  `datasource db {\n  provider = "${targetProvider}"`
);

if (schemaContent !== updatedContent) {
  fs.writeFileSync(schemaPath, updatedContent, 'utf8');
  console.log(`[sync-schema] Synchronized Prisma datasource provider to: "${targetProvider}" (Database: ${isPostgres ? 'Neon / PostgreSQL' : 'Local SQLite'})`);
} else {
  console.log(`[sync-schema] Prisma datasource provider is already "${targetProvider}".`);
}
