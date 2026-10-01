// Explicitly authorized local evidence fixture; not a UI creation test.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const url = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.pathname !== '/toktickit' || (url.searchParams.get('schema') || 'public') !== 'public') {
  throw new Error('This fixture is restricted to local toktickit/public.');
}
const prisma = new PrismaClient();
const key = 'lab4-visual-evidence-2026-10-02';
try {
  const ticket = await prisma.$transaction(async tx => {
    const existing = await tx.ticket.findUnique({ where: { idempotencyKey: key } });
    if (existing) return existing;
    const requester = await tx.user.findFirst({ where: { role: 'REQUESTER', isActive: true }, orderBy: { id: 'asc' } });
    const owner = await tx.user.findFirst({ where: { role: 'IT_STAFF', isActive: true, displayName: 'Kamon IT Support' } });
    const category = await tx.category.findFirst({ where: { isActive: true }, orderBy: { id: 'asc' } });
    const system = await tx.relatedSystem.findFirst({ where: { isActive: true }, orderBy: { id: 'asc' } });
    if (!requester || !owner || !category || !system) throw new Error('Required active fixture references unavailable.');
    const created = await tx.ticket.create({ data: {
      ticketNumber: `PENDING-${randomUUID()}`, idempotencyKey: key,
      requesterId: requester.id, ownerId: owner.id, categoryId: category.id, relatedSystemId: system.id,
      summary: 'Lab 4 visual evidence - isolated Action workflow',
      description: 'Dedicated local demonstration fixture, authorized on 2 October 2026. Used only for Action create, edit, complete and cancel screenshot evidence. Existing Tickets are not modified.',
      requestedPriority: 'LOW', itPriority: 'LOW', currentStatus: 'OPEN',
    } });
    return tx.ticket.update({ where: { id: created.id }, data: { ticketNumber: `TT-${created.createdAt.getUTCFullYear()}-${String(created.id).padStart(6, '0')}` } });
  });
  console.log(JSON.stringify({ id: ticket.id, ticketNumber: ticket.ticketNumber, summary: ticket.summary, fixture: true }));
} finally { await prisma.$disconnect(); }
