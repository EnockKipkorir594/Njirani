import { describe, expect, it, beforeEach, afterAll } from "vitest";

import prisma from "../../config/database.js";
import { findProviderIdsWithinRadius } from "./geospatial.service.js";

describe("geospatial.service", () => {
  beforeEach(async () => {
    await prisma.providerProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.estate.deleteMany();
    await prisma.serviceCategory.deleteMany();
  });

  afterAll(async () => {
    await prisma.providerProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.estate.deleteMany();
    await prisma.serviceCategory.deleteMany();
      
    await prisma.$disconnect();
  });

  it("returns providers whose estate is within the requested radius", async () => {
    // ------------------------------------------------------------
    // 1. Create a category
    // ------------------------------------------------------------
    const category = await prisma.serviceCategory.create({
      data: {
        name: "Plumbing",
        slug: "plumbing",
        icon: "Wrench",
      },
    });

    // ------------------------------------------------------------
    // 2. Create an estate near the search point
    // ------------------------------------------------------------
    const nearbyEstate = await prisma.estate.create({
      data: {
        name: "Nearby Estate",
        adminId: "00000000-0000-0000-0000-000000000000",
      },
    });

    await prisma.$executeRaw`
      UPDATE estates
      SET location = ST_SetSRID(
        ST_MakePoint(${36.8219}, ${-1.2921}),
        4326
      )
      WHERE id = ${nearbyEstate.id}
    `;

    // ------------------------------------------------------------
    // 3. Create a far-away estate
    // ------------------------------------------------------------
    const farEstate = await prisma.estate.create({
      data: {
        name: "Far Estate",
        adminId: "00000000-0000-0000-0000-000000000000",
      },
    });

    await prisma.$executeRaw`
      UPDATE estates
      SET location = ST_SetSRID(
        ST_MakePoint(${36.9000}, ${-1.3500}),
        4326
      )
      WHERE id = ${farEstate.id}
    `;

    // ------------------------------------------------------------
    // 4. Create provider users attached to those estates
    // ------------------------------------------------------------
    const nearbyUser = await prisma.user.create({
      data: {
        name: "Nearby Provider",
        email: "nearby-provider@test.njirani",
        phone: "+254700000111",
        passwordHash: "test-hash",
        role: "PROVIDER",
        estateId: nearbyEstate.id,
      },
    });

    const farUser = await prisma.user.create({
      data: {
        name: "Far Provider",
        email: "far-provider@test.njirani",
        phone: "+254700000112",
        passwordHash: "test-hash",
        role: "PROVIDER",
        estateId: farEstate.id,
      },
    });

    // ------------------------------------------------------------
    // 5. Create provider profiles
    // ------------------------------------------------------------
    const nearbyProvider = await prisma.providerProfile.create({
      data: {
        userId: nearbyUser.id,
        categoryId: category.id,
        bio: "Nearby plumber",
      },
    });

    await prisma.providerProfile.create({
      data: {
        userId: farUser.id,
        categoryId: category.id,
        bio: "Far plumber",
      },
    });

    // ------------------------------------------------------------
    // 6. Search from the nearby estate within 5 km
    // ------------------------------------------------------------
    const providerIds = await findProviderIdsWithinRadius(
      -1.2921,
      36.8219,
      5,
    );

    expect(providerIds).toContain(nearbyProvider.id);
    expect(providerIds).toHaveLength(1);
  });
});