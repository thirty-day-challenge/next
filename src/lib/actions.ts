"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db/(root)/prisma";
import { uploadImage } from "./db/dailyProgress";
import { Challenge } from "@prisma/client";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:franklinzhang06@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

interface WebPushSubscription extends PushSubscription {
  keys: {
    p256dh: string;
    auth: string;
  };
}

let subscription: WebPushSubscription | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

export async function subscribeUser(sub: PushSubscription) {
  const p256dh = sub.getKey("p256dh");
  const auth = sub.getKey("auth");

  if (!p256dh || !auth) {
    throw new Error("Invalid subscription: missing p256dh or auth keys");
  }

  const webPushSubscription: WebPushSubscription = {
    ...sub,
    keys: {
      p256dh: arrayBufferToBase64(p256dh),
      auth: arrayBufferToBase64(auth),
    },
  };

  subscription = webPushSubscription;
  return { success: true };
}

export async function unsubscribeUser() {
  subscription = null;
  return { success: true };
}

export async function sendNotification(message: string) {
  if (!subscription) {
    throw new Error("No subscription available");
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "Test Notification",
        body: message,
        icon: "/icon.png",
      }),
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: "Failed to send notification" };
  }
}

export async function handleDailyProgressImageUpload(file: File) {
  const url = await uploadImage(file, "progress-image.png");

  return url;
}

// FOR DEV DIALOG
export async function deleteDailyProgressAction(challengeId: string) {
  await prisma.dailyProgress.deleteMany({
    where: { challengeId },
  });

  revalidatePath("/");
}

export async function changeDates(
  challenge: Challenge,
  startDateObj: Date,
  endDateObj: Date,
) {
  await prisma.challenge.update({
    where: { id: challenge.id },
    data: {
      startDate: startDateObj,
      endDate: endDateObj,
    },
  });
  await prisma.dailyProgress.deleteMany({
    where: {
      challengeId: challenge.id,
      OR: [{ date: { lt: startDateObj } }, { date: { gt: endDateObj } }],
    },
  });
}
