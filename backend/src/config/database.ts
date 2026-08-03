import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from './env.js'


const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
}


const createPrismaClient = () => {
    const adapter = new PrismaPg({
        connectionString: env.DATABASE_URL!,
});
    return new PrismaClient({
        adapter,
        log:
            env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],

    });

}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma