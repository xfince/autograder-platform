import * as dotenv from 'dotenv';
import { startWorkers } from './workers';
import * as path from 'path';

// Load environment variables from the correct location
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function bootstrap() {
  console.log('🚀 Starting AutoGrader Workers...');
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

  try {
    await startWorkers();
    console.log('✅ All workers started successfully!');
  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});

bootstrap();
