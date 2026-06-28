import { createApp } from './app';
import { startServer } from './server';
import logger from './lib/logger';

const main = async () => {
  try {
    const app = createApp();
    await startServer(app);
  } catch (err) {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  }
};

main();
