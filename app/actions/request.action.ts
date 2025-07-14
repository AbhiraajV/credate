"use server";

import { prisma } from "@/prisma/prisma";
import { z } from "zod";

// 1. Schema to validate message
const accessRequestSchema = z.object({
  message: z.string().min(10).max(1000),
});

// 2. Create Access Request
export async function requestAccessToReport(
  userId: string,
  reportId: string,
  input: z.infer<typeof accessRequestSchema>
) {
  try {
    const report = await prisma.report.findUnique({ where: { id: reportId } });

    if (!report) return { success: false, error: "Report not found" };
    if (report.userId === userId)
      return { success: false, error: "You already own this report" };

    const existing = await prisma.reportAccessRequest.findFirst({
      where: {
        reportId,
        requesterId: userId,
      },
    });

    if (existing) {
      return {
        success: false,
        error: `You already have a ${existing.status.toLowerCase()} request for this report.`,
      };
    }

    const parsed = accessRequestSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.message };
    }

    const request = await prisma.reportAccessRequest.create({
      data: {
        requesterId: userId,
        reportId: report.id,
        reportOwnerId: report.userId,
        message: parsed.data.message,
      },
    });

    return { success: true, request };
  } catch (error) {
    return { success: false, error: "Failed to create access request" };
  }
}

// 3. Approve Request
export async function approveAccessRequest(reportOwnerId: string, requestId: string) {
  try {
    const request = await prisma.reportAccessRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) return { success: false, error: "Request not found" };
    if (request.reportOwnerId !== reportOwnerId)
      return { success: false, error: "You don't have permission to approve this request" };

    if (request.status !== "PENDING")
      return { success: false, error: `Request is already ${request.status.toLowerCase()}` };

    const updated = await prisma.reportAccessRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });

    return { success: true, request: updated };
  } catch (error) {
    return { success: false, error: "Failed to approve request" };
  }
}

// 4. Deny Request
export async function denyAccessRequest(reportOwnerId: string, requestId: string) {
  try {
    const request = await prisma.reportAccessRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) return { success: false, error: "Request not found" };
    if (request.reportOwnerId !== reportOwnerId)
      return { success: false, error: "You don't have permission to deny this request" };

    if (request.status !== "PENDING")
      return { success: false, error: `Request is already ${request.status.toLowerCase()}` };

    const updated = await prisma.reportAccessRequest.update({
      where: { id: requestId },
      data: { status: "DENIED" },
    });

    return { success: true, request: updated };
  } catch (error) {
    return { success: false, error: "Failed to deny request" };
  }
}
