import { createHash } from 'node:crypto';
import { createCacheRedisConnection } from '../../config/redis.js';

const redis = createCacheRedisConnection();

const CACHE_TTL_SECONDS = 60;
const CACHE_GENERATION_KEY = 'njirani:provider-search:generation';

export interface ProviderSearchCacheFilters {
    categoryId: string | null;
    categorySlug: string | null;
    search: string | null;
    page: number;
    limit: number;
    sortBy: 'rating' | 'newest' | 'distance';
    lat: number | null;
    lng: number | null;
    radiusKm: number | null;
}

export interface ProviderSearchCacheLookup<T> {
    hit: boolean;
    value?: T;
    generation: string | null;
}

function createCacheKey(
    filters: ProviderSearchCacheFilters,
    generation: string,
): string {
    const hash = createHash('sha256')
        .update(JSON.stringify(filters))
        .digest('hex');

    return `njirani:provider-search:v1:${generation}:${hash}`;
}

export async function getCachedProviderSearch<T>(
    filters: ProviderSearchCacheFilters,
): Promise<ProviderSearchCacheLookup<T>> {
    try {
        const generation =
            (await redis.get(CACHE_GENERATION_KEY)) ?? '0';

        const key = createCacheKey(filters, generation);
        const cachedValue = await redis.get(key);

        if (cachedValue === null) {
            return { hit: false, generation };
        }

        try {
            return {
                hit: true,
                value: JSON.parse(cachedValue) as T,
                generation,
            };
        } catch (error) {
            console.error(
                '[Provider cache] Invalid cached JSON; deleting entry',
                error,
            );

            await redis.del(key);

            return { hit: false, generation };
        }
    } catch (error) {
        console.error(
            '[Provider cache] Read failed; falling back to database',
            error,
        );

        // A null generation means caching is unavailable for this
        // request. The caller should query PostgreSQL normally.
        return { hit: false, generation: null };
    }
}

export async function setCachedProviderSearch<T>(
    filters: ProviderSearchCacheFilters,
    generation: string | null,
    value: T,
): Promise<void> {
    // Do not write a result if Redis was unavailable when we looked
    // up the cache generation.
    if (generation === null) {
        return;
    }

    try {
        const key = createCacheKey(filters, generation);
        const serialized = JSON.stringify(value);

        if (serialized === undefined) {
            return;
        }

        await redis.set(
            key,
            serialized,
            'EX',
            CACHE_TTL_SECONDS,
        );
    } catch (error) {
        console.error(
            '[Provider cache] Write failed; returning database result',
            error,
        );
    }
}

export async function invalidateProviderSearchCache(): Promise<boolean> {
    try {
        // Incrementing the generation makes every previously cached
        // search result unreachable without scanning Redis keys.
        await redis.incr(CACHE_GENERATION_KEY);
        return true;
    } catch (error) {
        console.error(
            '[Provider cache] Invalidation failed',
            error,
        );

        return false;
    }
}

export async function closeProviderSearchCacheConnection(): Promise<void> {
    if (redis.status === 'ready') {
        await redis.quit();
    } else {
        redis.disconnect();
    }
}