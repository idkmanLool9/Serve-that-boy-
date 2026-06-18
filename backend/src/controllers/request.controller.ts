import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { HttpError } from '../middleware/error';
import { emitToFamily } from '../socket';
import { sendPush } from '../utils/push';

// Shape returned to clients for every request.
const requestInclude = {
  customer: { select: { id: true, name: true } },
  server: { select: { id: true, name: true } },
} as const;

// Preset request types the Customer can pick with one tap.
const PRESETS: Record<string, string> = {
  item: 'Bring me an item',
  ice_cream: 'Get me an ice cream',
  clothes: 'Bring my clothes downstairs',
  help: 'Help me with something',
  custom: 'Custom request',
};

const createSchema = z.object({
  type: z.enum(['item', 'ice_cream', 'clothes', 'help', 'custom']),
  // Title is optional for presets (defaulted) but required for custom.
  title: z.string().min(1).max(120).optional(),
  note: z.string().max(500).optional(),
});

/** Customer creates a request. Broadcast to the whole family + push to Servers. */
export async function createRequest(req: Request, res: Response): Promise<void> {
  const data = createSchema.parse(req.body);
  const { userId, familyId } = req.auth!;

  const title = data.title?.trim() || PRESETS[data.type];
  if (!title) {
    throw new HttpError(400, 'A title is required for custom requests');
  }

  const request = await prisma.request.create({
    data: {
      type: data.type,
      title,
      note: data.note?.trim() || null,
      familyId,
      customerId: userId,
    },
    include: requestInclude,
  });

  emitToFamily(familyId, 'request:created', request);

  // Notify all Servers in the family.
  const servers = await prisma.user.findMany({
    where: { familyId, role: 'SERVER', pushToken: { not: null } },
    select: { pushToken: true },
  });
  await Promise.all(
    servers.map((s) =>
      sendPush({
        to: s.pushToken,
        title: `New request from ${request.customer.name}`,
        body: title,
        data: { requestId: request.id, kind: 'request:created' },
      }),
    ),
  );

  res.status(201).json(request);
}

const listSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'COMPLETED']).optional(),
});

/** List requests for the family, newest first. Optionally filter by status. */
export async function listRequests(req: Request, res: Response): Promise<void> {
  const { status } = listSchema.parse(req.query);
  const requests = await prisma.request.findMany({
    where: {
      familyId: req.auth!.familyId,
      ...(status ? { status } : {}),
    },
    include: requestInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
}

async function loadFamilyRequest(id: string, familyId: string) {
  const request = await prisma.request.findUnique({ where: { id }, include: requestInclude });
  if (!request || request.familyId !== familyId) {
    throw new HttpError(404, 'Request not found');
  }
  return request;
}

/** Server accepts a pending request. */
export async function acceptRequest(req: Request, res: Response): Promise<void> {
  const { userId, familyId } = req.auth!;
  const existing = await loadFamilyRequest(req.params.id, familyId);

  if (existing.status !== 'PENDING') {
    throw new HttpError(409, 'Only pending requests can be accepted');
  }

  const request = await prisma.request.update({
    where: { id: existing.id },
    data: { status: 'ACCEPTED', serverId: userId, acceptedAt: new Date() },
    include: requestInclude,
  });

  emitToFamily(familyId, 'request:accepted', request);
  await notifyCustomer(request, `${request.server?.name ?? 'Your server'} accepted your request`, request.title);

  res.json(request);
}

/** Server marks an accepted request as completed (with an optional reply). */
const completeSchema = z.object({ reply: z.string().max(500).optional() });

export async function completeRequest(req: Request, res: Response): Promise<void> {
  const { userId, familyId } = req.auth!;
  const { reply } = completeSchema.parse(req.body);
  const existing = await loadFamilyRequest(req.params.id, familyId);

  if (existing.status === 'COMPLETED') {
    throw new HttpError(409, 'Request is already completed');
  }

  const request = await prisma.request.update({
    where: { id: existing.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      // Claim the request if it was completed straight from pending.
      serverId: existing.serverId ?? userId,
      acceptedAt: existing.acceptedAt ?? new Date(),
      ...(reply !== undefined ? { reply: reply.trim() || null } : {}),
    },
    include: requestInclude,
  });

  emitToFamily(familyId, 'request:completed', request);
  await notifyCustomer(request, `${request.server?.name ?? 'Your server'} completed your request`, request.title);

  res.json(request);
}

/** Server sends or updates a short reply on a request. */
const replySchema = z.object({ reply: z.string().min(1).max(500) });

export async function replyToRequest(req: Request, res: Response): Promise<void> {
  const { familyId } = req.auth!;
  const { reply } = replySchema.parse(req.body);
  const existing = await loadFamilyRequest(req.params.id, familyId);

  const request = await prisma.request.update({
    where: { id: existing.id },
    data: { reply: reply.trim() },
    include: requestInclude,
  });

  emitToFamily(familyId, 'request:replied', request);
  await notifyCustomer(request, `${request.server?.name ?? 'Your server'} replied`, reply.trim());

  res.json(request);
}

async function notifyCustomer(
  request: { customerId: string; id: string },
  title: string,
  body: string,
): Promise<void> {
  const customer = await prisma.user.findUnique({
    where: { id: request.customerId },
    select: { pushToken: true },
  });
  await sendPush({
    to: customer?.pushToken,
    title,
    body,
    data: { requestId: request.id },
  });
}
