import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma';
import { signToken } from '../utils/jwt';
import { generateInviteCode } from '../utils/invite';
import { HttpError } from '../middleware/error';

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  familyId: true,
} as const;

function buildAuthResponse(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  familyId: string;
}) {
  const token = signToken({
    userId: user.id,
    familyId: user.familyId,
    role: user.role as 'CUSTOMER' | 'SERVER',
  });
  return { token, user };
}

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(60),
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['CUSTOMER', 'SERVER']),
    // Either create a new family with a name, or join one with an invite code.
    familyName: z.string().min(1).max(60).optional(),
    inviteCode: z.string().min(1).optional(),
  })
  .refine((data) => Boolean(data.familyName) !== Boolean(data.inviteCode), {
    message: 'Provide either a familyName (to create) or an inviteCode (to join)',
    path: ['familyName'],
  });

export async function signup(req: Request, res: Response): Promise<void> {
  const data = signupSchema.parse(req.body);
  const email = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  // Resolve the family: create a new one, or join via invite code.
  let familyId: string;
  if (data.familyName) {
    // Generate a unique invite code (retry on the rare collision).
    let inviteCode = generateInviteCode();
    for (let i = 0; i < 5; i += 1) {
      const clash = await prisma.family.findUnique({ where: { inviteCode } });
      if (!clash) break;
      inviteCode = generateInviteCode();
    }
    const family = await prisma.family.create({
      data: { name: data.familyName.trim(), inviteCode },
    });
    familyId = family.id;
  } else {
    const family = await prisma.family.findUnique({
      where: { inviteCode: data.inviteCode!.toUpperCase().trim() },
    });
    if (!family) {
      throw new HttpError(404, 'No family found with that invite code');
    }
    familyId = family.id;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      passwordHash,
      role: data.role,
      familyId,
    },
    select: publicUser,
  });

  res.status(201).json(buildAuthResponse(user));
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response): Promise<void> {
  const data = loginSchema.parse(req.body);
  const email = data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, 'Invalid email or password');
  }

  res.json(
    buildAuthResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      familyId: user.familyId,
    }),
  );
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: publicUser,
  });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  res.json({ user });
}
