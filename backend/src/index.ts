import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { corsMiddleware } from './middleware/cors';
import { auth } from './routes/auth';
import { notes } from './routes/notes';
import { tenants } from './routes/tenants';
import { health } from './routes/health';

const app = new Hono();

// Apply CORS middleware globally
app.use('*', corsMiddleware);

// Add request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const end = Date.now();
  console.log(`${c.req.method} ${c.req.url} - ${c.res.status} (${end - start}ms)`);
});

// Health check endpoint (no authentication required)
app.route('/health', health);

// Authentication routes
app.route('/auth', auth);

// Protected API routes
app.route('/notes', notes);
app.route('/tenants', tenants);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'SaaS Notes API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        login: 'POST /auth/login',
        logout: 'POST /auth/logout'
      },
      notes: {
        create: 'POST /notes',
        list: 'GET /notes',
        get: 'GET /notes/:id',
        update: 'PUT /notes/:id',
        delete: 'DELETE /notes/:id'
      },
      tenants: {
        get: 'GET /tenants/:slug',
        upgrade: 'POST /tenants/:slug/upgrade',
        subscription: 'GET /tenants/:slug/subscription'
      }
    },
    test_accounts: {
      acme_admin: 'admin@acme.test / password',
      acme_user: 'user@acme.test / password',
      globex_admin: 'admin@globex.test / password',
      globex_user: 'user@globex.test / password'
    }
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist'
  }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  }, 500);
});

// For local development
const port = parseInt(process.env.PORT || '3000');

if (process.env.NODE_ENV !== 'production') {
  console.log(`🚀 SaaS Notes API starting on http://localhost:${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}`);
  console.log(`🏥 Health check at http://localhost:${port}/health`);
  
  serve({
    fetch: app.fetch,
    port: port,
  });
} else {
  console.log('🚀 SaaS Notes API ready for production');
}

// Export for Vercel
export default app;