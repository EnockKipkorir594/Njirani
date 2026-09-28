import prisma from "../../config/database.js";

export type NearbyProvider = {
  id: string;
  distanceKm: number;
};

export async function findProvidersWithinRadius(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<NearbyProvider[]> {
  const radiusMeters = radiusKm * 1000;

  const providers = await prisma.$queryRaw<
    Array<{
      id: string;
      distanceKm: number;
    }>
  >`
    SELECT
      pp.id,
      ST_Distance(
        e.location::geography,
        ST_SetSRID(
          ST_MakePoint(${lng}, ${lat}),
          4326
        )::geography
      ) / 1000.0 AS "distanceKm"
    FROM provider_profiles pp
    INNER JOIN users u
      ON u.id = pp."userId"
    INNER JOIN estates e
      ON e.id = u."estateId"
    WHERE e.location IS NOT NULL
      AND ST_DWithin(
        e.location::geography,
        ST_SetSRID(
          ST_MakePoint(${lng}, ${lat}),
          4326
        )::geography,
        ${radiusMeters}
      )
    ORDER BY "distanceKm" ASC;
  `;

  return providers.map((provider) => ({
    id: provider.id,
    distanceKm: Number(provider.distanceKm),
  }));
}