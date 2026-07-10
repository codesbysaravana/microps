import dotenv from 'dotenv';
import path from 'path';
import app from './app';

const isDev = process.env.NODE_ENV === 'development' || process.argv.some(arg => arg.includes('ts-node') || arg.includes('nodemon'));
const envFile = isDev ? '.env.development' : '.env.production';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config(); // fallback to default .env

import { runEnterpriseMigrationAndSeed } from './scripts/init_enterprise_schema';
import { startIdleScaler } from './jobs/idle-scaler.job';

// Use port 8000 to avoid conflict with the learning server (which uses 5000)
const PORT = process.env.PORT || 8000;

// Automatically apply idempotent database schema migrations and seeds on startup
runEnterpriseMigrationAndSeed()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Backend API] Server is running on http://localhost:${PORT}`);
      
      // Start the idle-scale-to-zero job (runs every 5 minutes)
      startIdleScaler();
    });
  })
  .catch((err) => {
    console.error('[Backend API] Failed to initialize database schema on startup:', err);
    process.exit(1);
  });
