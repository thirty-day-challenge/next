import { viewDailyProgressCompletion } from "@/lib/db/dailyProgress";
import { findUserByClerkId } from "@/lib/db/user";
import { handleError, validateRequest } from "@/lib/util/routeUtils";
import { DailyProgressSchema } from "@30-day-challenge/prisma-zod";
import { NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  clerkId: z.string(),
  challengeId: z.string().optional(),
});
type Schema = z.infer<typeof Schema>;

export async function POST(req: Request) {
  try {
    const parsedData = await validateRequest(Schema, req);

    const { clerkId, challengeId } = parsedData;
    const { id: userId } = await findUserByClerkId(clerkId);

    const data = await viewDailyProgressCompletion(userId, challengeId);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
