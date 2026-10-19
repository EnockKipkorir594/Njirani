import { Redis as IORedis } from 'ioredis';
import { env } from './env.js';

function logRedisErrors(
    connection: IORedis,
    connectionName: string,
): IORedis {
    connection.on('error', (error: Error) => {
        console.error(`[Redis:${connectionName}] ${error.message}`);
    });

    return connection;
}

export function createQueueRedisConnection(): IORedis {
    const connection = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
    });

    return logRedisErrors(connection, 'queue');
}

export function createWorkerRedisConnection(): IORedis {
    const connection = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
    });

    return logRedisErrors(connection, 'worker');
}

export function createCacheRedisConnection(): IORedis {
    const connection = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 1000,
    });

    return logRedisErrors(connection, 'cache');
}