"use server";

import { prisma } from "@/prisma/prisma";
import { z } from "zod";
// 1. Validation schema for creating/updating reports
const reportInputSchema = z
  .object({
    name: z.string().max(100).optional(),
    instagramId: z.string().max(100).optional(),
    facebookId: z.string().max(100).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().max(20).optional(),
    rating: z.number().min(0).max(10),
    description: z.string().max(1000).optional(),
  })
  .refine(
    (data) =>
      !!(data.name || data.instagramId || data.facebookId || data.email || data.phoneNumber),
    {
      message: "At least one identifier (name, Instagram, Facebook, email, or phone) is required.",
      path: ["name"], // Pointing the error to one field (you could change this)
    }
  );

// 2. Create Report
export async function createReport(userId: string, input: z.infer<typeof reportInputSchema>) {
  try {
    const data = reportInputSchema.parse(input);

    const report = await prisma.report.create({
      data: {
        ...data,
        userId,
      },
    });

    return { success: true, report };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Invalid input" };
  }
}

// 3. Update Report
export async function updateReport(userId: string, reportId: string, input: z.infer<typeof reportInputSchema>) {
  try {
    const existing = await prisma.report.findUnique({ where: { id: reportId } });

    if (!existing) {
      return { success: false, error: "Report not found" };
    }

    if (existing.userId !== userId) {
      return { success: false, error: "Unauthorized: You do not own this report" };
    }

    const data = reportInputSchema.parse(input);

    const updated = await prisma.report.update({
      where: { id: reportId },
      data,
    });

    return { success: true, report: updated };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Invalid input" };
  }
}

// 4. Read Report (with user check)
export async function getReportById(userId: string, reportId: string) {
  try {
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        OR: [
          {
            userId: userId,
          },
          {
            accessRequests: {
              some: {
                requesterId: userId,
                status: "APPROVED",
              },
            },
          },
        ],
      },
    });

    if (!report) {
      return { success: false, error: "Access denied or report not found." };
    }

    return { success: true, report };
  } catch (error) {
    return { success: false, error: "Failed to fetch report" };
  }
}


// 5. Delete Report
export async function deleteReport(userId: string, reportId: string) {
  try {
    const report = await prisma.report.findUnique({ where: { id: reportId } });

    if (!report) {
      return { success: false, error: "Report not found" };
    }

    if (report.userId !== userId) {
      return { success: false, error: "Unauthorized access" };
    }

    await prisma.report.delete({ where: { id: reportId } });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete report" };
  }
}