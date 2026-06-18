import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const pushTokenSchema = z.object({
  pushToken: z.string().nullable(),
});

/** Stores (or clears) the Expo push token for the current device/user. */
export async function updatePushToken(req: Request, res: Response): Promise<void> {
  const { pushToken } = pushTokenSchema.parse(req.body);
  await prisma.user.update({
    where: { id: req.auth!.userId },
    data: { pushToken },
  });
  res.json({ ok: true });
}
