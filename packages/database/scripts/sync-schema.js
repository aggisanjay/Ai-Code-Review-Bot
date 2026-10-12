/**
 * sync-schema.js
 * Automatically detects whether DATABASE_URL is Neon/PostgreSQL or SQLite
 * and configures the Prisma datasource provider accordingly.
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root or packages/database
const rootEnvPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
dotenv.config();

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
