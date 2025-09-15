import { Hono } from 'hono';

const health = new Hono();

// GET /health - Health check endpoint
health.get('/', async (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SaaS Notes API',
    version: '1.0.0'
  });
});

export { health };