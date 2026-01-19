import { PrismaClient } from '@/generated/prisma/client';

/**
 * Étendre globalThis pour éviter
 * la recréation du PrismaClient en dev
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Instance unique de PrismaClient
 */
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['error'],
  });

/**
 * En développement, on garde l’instance en mémoire globale
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
