import prisma from "../../config/database.js";

export async function findProviderIdsWithinRadius(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<string[]> {
  const radiusMeters = radiusKm * 1000;

  const providers = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT pp.id
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
      );
  `;

  return providers.map((provider) => provider.id);
}