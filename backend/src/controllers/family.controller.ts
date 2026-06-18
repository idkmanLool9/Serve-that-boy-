import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { HttpError } from '../middleware/error';

/** Returns the current user's family, its invite code, and the member list. */
export async function getMyFamily(req: Request, res: Response): Promise<void> {
  const family = await prisma.family.findUnique({
    where: { id: req.auth!.familyId },
    include: {
      members: {
        select: { id: true, name: true, role: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!family) {
    throw new HttpError(404, 'Family not found');
  }

  res.json({
    id: family.id,
    name: family.name,
    inviteCode: family.inviteCode,
    members: family.members,
  });
}
