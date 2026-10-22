
import {
    afterAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

// Create the mocks before importing modules that use them.
const mocks = vi.hoisted(() => {
    const store = new Map<string, string>();

    const redisClient = {
        status: 'ready',

        on: vi.fn(),

        get: vi.fn(async (key: string) => {
            return store.get(key) ?? null;
        }),

        set: vi.fn(
            async (
                key: string,
                value: string,
                _mode: string,
                _ttlSeconds: number,
            ) => {
                store.set(key, value);
                return 'OK';
            },
        ),

        del: vi.fn(async (key: string) => {
            return store.delete(key) ? 1 : 0;
        }),

        incr: vi.fn(async (key: string) => {
            const nextValue = Number(store.get(key) ?? '0') + 1;
            store.set(key, String(nextValue));
            return nextValue;
        }),

        quit: vi.fn(async () => 'OK'),

        disconnect: vi.fn(),
    };

    return {
        store,
        redisClient,
        findMany: vi.fn(),
        count: vi.fn(),
        findWithinRadius: vi.fn(),
    };
});

// Replace the Redis connection with a deterministic in-memory mock.
vi.mock('../../config/redis.js', () => ({
    createCacheRedisConnection: () => mocks.redisClient,
}));

// Mock only the database operations used by provider discovery.
vi.mock('../../config/database.js', () => ({
    default: {
        providerProfile: {
            findMany: mocks.findMany,
            count: mocks.count,
        },
    },
}));

// Keep geospatial behaviour isolated from PostGIS in these unit tests.
vi.mock('../geospatial/geospatial.service.js', () => ({
    findProvidersWithinRadius: mocks.findWithinRadius,
}));

import { listProviderProfiles } from './providers.service.js';

import {
    closeProviderSearchCacheConnection,
    getCachedProviderSearch,
    invalidateProviderSearchCache,
    setCachedProviderSearch,
    type ProviderSearchCacheFilters,
} from './providers.cache.js';

const providerProfile = {
    id: 'provider-profile-1',
    userId: 'provider-user-1',
    categoryId: 'category-1',
    bio: 'Experienced plumber with residential service experience',
    serviceRadiusKm: 5,
    availability: {
        monday: ['09:00-17:00'],
    },
    ratingCached: 4.5,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    user: {
        id: 'provider-user-1',
        name: 'Test Provider',
        email: 'provider@example.com',
        phone: '+254700000001',
    },
    category: {
        id: 'category-1',
        name: 'Plumbing',
        slug: 'plumbing',
    },
};

const providerSearchResult = {
    profiles: [providerProfile],
    meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
    },
};

function createFilters(
    overrides: Partial<ProviderSearchCacheFilters> = {},
): ProviderSearchCacheFilters {
    return {
        categoryId: null,
        categorySlug: null,
        search: 'plumber',
        page: 1,
        limit: 10,
        sortBy: 'newest',
        lat: null,
        lng: null,
        radiusKm: null,
        ...overrides,
    };
}

describe('Provider search cache', () => {
    beforeEach(() => {
        mocks.store.clear();
        vi.clearAllMocks();

        // Reset the database mock results for each test.
        mocks.findMany.mockResolvedValue([providerProfile]);
        mocks.count.mockResolvedValue(1);

        // One provider is 1.25 km from the requested search point.
        mocks.findWithinRadius.mockResolvedValue([
            {
                id: providerProfile.id,
                distanceKm: 1.25,
            },
        ]);
    });

    afterAll(async () => {
        await closeProviderSearchCacheConnection();
    });

    describe('getCachedProviderSearch', () => {
        it('returns a cache miss when no result exists', async () => {
            const result = await getCachedProviderSearch(
                createFilters(),
            );

            expect(result.hit).toBe(false);
            expect(result.value).toBeUndefined();
            expect(result.generation).toBe('0');
        });

        it('returns a stored result on a cache hit', async () => {
            const filters = createFilters();
            const initialLookup =
                await getCachedProviderSearch(filters);

            expect(initialLookup.hit).toBe(false);
            expect(initialLookup.generation).not.toBeNull();

            await setCachedProviderSearch(
                filters,
                initialLookup.generation,
                providerSearchResult,
            );

            const cachedLookup =
                await getCachedProviderSearch(filters);

            expect(cachedLookup.hit).toBe(true);

            // The cache stores plain JSON, so Date fields come back
            // as ISO strings. Date restoration happens in the
            // listProviderProfiles layer, not in the cache itself.
            expect(cachedLookup.value).toEqual(
                JSON.parse(JSON.stringify(providerSearchResult)),
            );
        });

        it('uses separate cache entries for different filters', async () => {
            const firstFilters = createFilters({
                search: 'plumber',
            });

            const secondFilters = createFilters({
                search: 'electrician',
            });

            const firstLookup =
                await getCachedProviderSearch(firstFilters);

            await setCachedProviderSearch(
                firstFilters,
                firstLookup.generation,
                providerSearchResult,
            );

            const secondLookup =
                await getCachedProviderSearch(secondFilters);

            expect(secondLookup.hit).toBe(false);
        });

        it('uses separate cache entries for different pages', async () => {
            const pageOne = createFilters({ page: 1 });
            const pageTwo = createFilters({ page: 2 });

            const initialLookup =
                await getCachedProviderSearch(pageOne);

            await setCachedProviderSearch(
                pageOne,
                initialLookup.generation,
                providerSearchResult,
            );

            const secondPageLookup =
                await getCachedProviderSearch(pageTwo);

            expect(secondPageLookup.hit).toBe(false);
        });
    });

    describe('setCachedProviderSearch', () => {
        it('sets an expiry on cached search results', async () => {
            const filters = createFilters();
            const lookup =
                await getCachedProviderSearch(filters);

            await setCachedProviderSearch(
                filters,
                lookup.generation,
                providerSearchResult,
            );

            expect(mocks.redisClient.set).toHaveBeenCalledWith(
                expect.stringMatching(
                    /^njirani:provider-search:v1:/,
                ),
                expect.any(String),
                'EX',
                60,
            );
        });

        it('does not write when the cache generation is unavailable', async () => {
            await setCachedProviderSearch(
                createFilters(),
                null,
                providerSearchResult,
            );

            expect(mocks.redisClient.set).not.toHaveBeenCalled();
        });

        it('does not throw if a cache write fails', async () => {
            const filters = createFilters();

            const lookup =
                await getCachedProviderSearch(filters);

            mocks.redisClient.set.mockRejectedValueOnce(
                new Error('Redis write failed'),
            );

            const errorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            try {
                await expect(
                    setCachedProviderSearch(
                        filters,
                        lookup.generation,
                        providerSearchResult,
                    ),
                ).resolves.toBeUndefined();

                expect(errorSpy).toHaveBeenCalled();
            } finally {
                errorSpy.mockRestore();
            }
        });
    });

    describe('invalidateProviderSearchCache', () => {
        it('makes previously cached results unreachable', async () => {
            const filters = createFilters();

            const initialLookup =
                await getCachedProviderSearch(filters);

            await setCachedProviderSearch(
                filters,
                initialLookup.generation,
                providerSearchResult,
            );

            const beforeInvalidation =
                await getCachedProviderSearch(filters);

            expect(beforeInvalidation.hit).toBe(true);

            const invalidated =
                await invalidateProviderSearchCache();

            expect(invalidated).toBe(true);

            const afterInvalidation =
                await getCachedProviderSearch(filters);

            expect(afterInvalidation.hit).toBe(false);
            expect(afterInvalidation.generation).not.toBe(
                beforeInvalidation.generation,
            );
        });

        it('returns false when invalidation fails', async () => {
            mocks.redisClient.incr.mockRejectedValueOnce(
                new Error('Redis unavailable'),
            );

            const errorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            try {
                await expect(
                    invalidateProviderSearchCache(),
                ).resolves.toBe(false);

                expect(errorSpy).toHaveBeenCalled();
            } finally {
                errorSpy.mockRestore();
            }
        });
    });

    describe('listProviderProfiles', () => {
        it('queries the database on a cache miss', async () => {
            const result = await listProviderProfiles({
                search: 'plumber',
                page: 1,
                limit: 10,
            });

            expect(result.profiles).toHaveLength(1);
            expect(result.profiles[0]?.id).toBe(
                providerProfile.id,
            );

            expect(mocks.findMany).toHaveBeenCalledTimes(1);
            expect(mocks.count).toHaveBeenCalledTimes(1);
        });

        it('does not repeat database queries for a cache hit', async () => {
            const filters = {
                search: 'plumber',
                page: 1,
                limit: 10,
            };

            const firstResult =
                await listProviderProfiles(filters);

            const secondResult =
                await listProviderProfiles(filters);

            expect(firstResult).toEqual(secondResult);

            // The first request queries PostgreSQL.
            // The second request is served from the cache.
            expect(mocks.findMany).toHaveBeenCalledTimes(1);
            expect(mocks.count).toHaveBeenCalledTimes(1);
        });

        it('restores Date values after reading cached JSON', async () => {
            await listProviderProfiles({
                search: 'plumber',
            });

            const cachedResult = await listProviderProfiles({
                search: 'plumber',
            });

            expect(
                cachedResult.profiles[0]?.createdAt,
            ).toBeInstanceOf(Date);

            expect(
                cachedResult.profiles[0]?.updatedAt,
            ).toBeInstanceOf(Date);
        });

        it('queries the database when search filters differ', async () => {
            await listProviderProfiles({
                search: 'plumber',
            });

            await listProviderProfiles({
                search: 'electrician',
            });

            expect(mocks.findMany).toHaveBeenCalledTimes(2);
            expect(mocks.count).toHaveBeenCalledTimes(2);
        });

        it('queries the database again after cache invalidation', async () => {
            const originalBio = providerProfile.bio;

            const updatedProfile = {
                ...providerProfile,
                bio: 'Updated plumbing profile with new information',
            };

            mocks.findMany
                .mockResolvedValueOnce([providerProfile])
                .mockResolvedValueOnce([updatedProfile]);

            await listProviderProfiles({
                search: 'plumber',
            });

            await invalidateProviderSearchCache();

            const updatedResult = await listProviderProfiles({
                search: 'plumber',
            });

            expect(updatedResult.profiles[0]?.bio).toBe(
                updatedProfile.bio,
            );

            expect(updatedResult.profiles[0]?.bio).not.toBe(
                originalBio,
            );

            expect(mocks.findMany).toHaveBeenCalledTimes(2);
        });

        it('preserves distanceKm in cached geospatial results', async () => {
            const filters = {
                lat: -1.2921,
                lng: 36.8219,
                radiusKm: 5,
                sortBy: 'distance' as const,
                search: 'plumber',
            };

            const firstResult =
                await listProviderProfiles(filters);

            const secondResult =
                await listProviderProfiles(filters);

            expect(firstResult.profiles[0]).toMatchObject({
                id: providerProfile.id,
                distanceKm: 1.25,
            });

            expect(secondResult.profiles[0]).toMatchObject({
                id: providerProfile.id,
                distanceKm: 1.25,
            });

            expect(
                mocks.findWithinRadius,
            ).toHaveBeenCalledTimes(1);

            expect(mocks.findMany).toHaveBeenCalledTimes(1);
        });

        it('falls back to PostgreSQL when Redis reads fail', async () => {
            mocks.redisClient.get.mockRejectedValueOnce(
                new Error('Redis unavailable'),
            );

            const errorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            try {
                const result = await listProviderProfiles({
                    search: 'plumber',
                });

                expect(result.profiles).toHaveLength(1);
                expect(result.profiles[0]?.id).toBe(
                    providerProfile.id,
                );

                expect(mocks.findMany).toHaveBeenCalledTimes(1);

                // No cache write should be attempted when we could
                // not obtain a valid cache generation.
                expect(
                    mocks.redisClient.set,
                ).not.toHaveBeenCalled();
            } finally {
                errorSpy.mockRestore();
            }
        });

        it('returns database results when Redis writes fail', async () => {
            mocks.redisClient.set.mockRejectedValueOnce(
                new Error('Redis write failed'),
            );

            const errorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            try {
                const result = await listProviderProfiles({
                    search: 'plumber',
                });

                expect(result.profiles).toHaveLength(1);
                expect(result.profiles[0]?.id).toBe(
                    providerProfile.id,
                );

                expect(mocks.findMany).toHaveBeenCalledTimes(1);
            } finally {
                errorSpy.mockRestore();
            }
        });

        it('uses normalized pagination values for the database query and cache key', async () => {
            // Arrange: use a unique search term to avoid an existing cache entry.
            const filters = {
              search: 'pagination-normalization-regression',
              page: 0,
              limit: 100,
            };
          
            // Act
            await listProviderProfiles(filters);
          
            // Assert
            // Verify the Prisma query uses page 1 and a limit of 50.
            expect(mocks.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                  skip: 0,
                  take: 50,
                }),
            );
        });
    });
});
