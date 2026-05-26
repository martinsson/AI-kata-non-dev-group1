import Fastify from 'fastify';
import cors from '@fastify/cors';
import { recordPing } from './db.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get('/hello', async () => {
  const count = recordPing();
  return { message: 'hello', count };
});

app.get('/health', async () => ({ ok: true }));

const port = Number(process.env.PORT ?? 3001);
await app.listen({ port, host: '0.0.0.0' });
