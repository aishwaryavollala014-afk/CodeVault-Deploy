import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import type { HealthStatus, ReadinessStatus } from '../types';

/** Liveness — the process is up and serving. */
export function getHealth(_req: Request, res: Response): void {
  const body: HealthStatus = {
    status: 'ok',
    service: 'web-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(body);
}

/** Readiness — dependencies (Postgres + Redis) are reachable. */
export async function getReadiness(_req: Request, res: Response): Promise<void> {
  const [database, redisOk] = await Promise.all([
    prisma
      .$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    redis
      .ping()
      .then((r) => r === 'PONG')
      .catch(() => false),
  ]);

  const ready = database && redisOk;
  const body: ReadinessStatus = {
    status: ready ? 'ready' : 'degraded',
    checks: { database, redis: redisOk },
    timestamp: new Date().toISOString(),
  };
  res.status(ready ? 200 : 503).json(body);
}
