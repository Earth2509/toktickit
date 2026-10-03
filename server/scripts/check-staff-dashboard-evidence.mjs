// Read-only aggregate cross-check for the signed-in local demonstration account.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const url = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.pathname !== '/toktickit' || (url.searchParams.get('schema') || 'public') !== 'public') throw new Error('Local toktickit/public only.');
const prisma = new PrismaClient();
try {
  const staff = await prisma.user.findFirst({ where: { displayName: 'Kamon IT Support', role: 'IT_STAFF', isActive: true }, select: { id: true, displayName: true } });
  if (!staff) throw new Error('Expected demonstration account not found.');
  const where = { performedById: staff.id };
  const count = await prisma.actionTaken.count({ where });
  const rows = await prisma.actionTaken.findMany({ where, orderBy: [{ actionAt: 'desc' }, { id: 'desc' }], take: 5, select: { id: true, status: true, ticket: { select: { ticketNumber: true } } } });
  console.log(JSON.stringify({ account: staff.displayName, totalPerformedActions: count, recentActions: rows }));
} finally { await prisma.$disconnect(); }
