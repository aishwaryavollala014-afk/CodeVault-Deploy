import './config/env'; // validate env first (fail-fast)
import logger from './lib/logger';
import { httpClient } from './lib/httpClient';
import { egressInterceptor } from './lib/egress';
import { startServer } from './server';
import { startScheduler } from './jobs/scheduler';
import { startSyncWorker } from './jobs/sync.job';

// Enforce the SSRF egress allowlist on all outbound platform calls.
httpClient.interceptors.request.use(egressInterceptor);

startServer();
startScheduler();
startSyncWorker();

logger.info('git-service started (server + scheduler + sync worker)');
