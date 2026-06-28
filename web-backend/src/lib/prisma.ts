import { PrismaClient } from '@prisma/client';
import { env, isProd } from '../config/env';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: isProd ? ['error'] : ['query', 'info', 'warn', 'error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (!isProd) globalThis.prisma = prisma;
