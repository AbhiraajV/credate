"use server";

import { z } from "zod";
import { prisma } from "@/prisma/prisma";

// 1. Input validation schema for Search
const searchInputSchema = z
  .object({
    name: z.string().max(100).optional(),
    instagramId: z.string().max(100).optional(),
    facebookId: z.string().max(100).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().max(20).optional(),
  })
  .refine(
    (data) =>
      !!(data.name || data.instagramId || data.facebookId || data.email || data.phoneNumber),
    {
      message: "At least one identifier (name, Instagram, Facebook, email, or phone) is required.",
    }
  );

// 2. Create search 
export async function createSearch(userId: string, input: z.infer<typeof searchInputSchema>) {
  try {
    const data = searchInputSchema.parse(input);

    // Create the Search entry
    const search = await prisma.search.create({
      data: {
        ...data,
        userId,
      },
    });

    // Build search condition: match ANY of the provided fields
    const orConditions = Object.entries(data)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => ({ [key]: value }));

    if (orConditions.length === 0) {
      return { success: true, search }; // no identifiers, no matches
    }

    // Find matching reports
    const matchingReports = await prisma.report.findMany({
      where: {
        OR: orConditions,
      },
    });

    // Create SearchResult entries
    const searchResults = await prisma.$transaction(
      matchingReports.map((report) => {
        // Find which field(s) matched
        const matchedField = Object.entries(data).find(
          ([key, value]) => report[key as keyof typeof report] === value
        )?.[0] || "unknown";

        return prisma.searchResult.create({
          data: {
            searchId: search.id,
            reportId: report.id,
            matchedOn: matchedField,
          },
        });
      })
    );

    return { success: true, search, searchResults };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Invalid input" };
  }
}

// 3. Update Search
export async function updateSearch(userId: string, searchId: string, input: z.infer<typeof searchInputSchema>) {
  try {
    const existing = await prisma.search.findUnique({ where: { id: searchId } });

    if (!existing) {
      return { success: false, error: "Search not found" };
    }

    if (existing.userId !== userId) {
      return { success: false, error: "Unauthorized: You do not own this search" };
    }

    const data = searchInputSchema.parse(input);

    const updated = await prisma.search.update({
      where: { id: searchId },
      data,
    });

    return { success: true, search: updated };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Invalid input" };
  }
}

// 4. Get Search by ID
export async function getSearchById(userId: string, searchId: string) {
  try {
    const search = await prisma.search.findUnique({
      where: { id: searchId },
      include: {
        searchResults: {
          include: {
            report: true,
          },
        },
      },
    });

    if (!search) {
      return { success: false, error: "Search not found" };
    }

    if (search.userId !== userId) {
      return { success: false, error: "Unauthorized access" };
    }

    return { success: true, search };
  } catch (error) {
    return { success: false, error: "Failed to fetch search" };
  }
}

// 5. Delete Search
export async function deleteSearch(userId: string, searchId: string) {
  try {
    const search = await prisma.search.findUnique({ where: { id: searchId } });

    if (!search) {
      return { success: false, error: "Search not found" };
    }

    if (search.userId !== userId) {
      return { success: false, error: "Unauthorized access" };
    }

    await prisma.search.delete({ where: { id: searchId } });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete search" };
  }
}
