import { createChallenge } from "@/lib/prisma/challenge";
import { findUserByClerkId } from "@/lib/prisma/user";
import { handleError, validateRequest } from "@/lib/util/routeUtils";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ChallengeSchema,
  DailyProgressOptionalDefaultsSchema,
} from "@30-day-challenge/prisma-zod";
import { editDailyProgressCompletion } from "@/lib/prisma/dailyProgress";

const schema = DailyProgressOptionalDefaultsSchema.omit({
  userId: true,
}).extend({ clerkId: z.string() });

type schema = z.infer<typeof schema>;

const handleValidatedData = async (data: schema) => {
  try {
    const { date, challengeId, clerkId, completed } = data;
    const { id: userId } = await findUserByClerkId(clerkId);

    return await editDailyProgressCompletion({
      date,
      challengeId,
      userId,
      completed,
    });
  } catch (e) {
    throw new Error("Failed to create challenge");
  }
};

export async function PUT(req: Request) {
  try {
    const parsedData = await validateRequest(schema, req);
    const data = await handleValidatedData(parsedData);

    return NextResponse.json({ message: "Success", data }, { status: 200 });
  } catch (e) {
    return handleError(e);
  }
}