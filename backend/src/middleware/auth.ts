import { Context, Next } from 'hono';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { mockDb } from '../utils/mock-database';

// Extend Context with user information
declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    userRole: string;
    tenantId: string;
    tenantSlug: string;
  }
}

export async function authenticate(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return c.json({ error: 'Invalid authorization format. Use Bearer <token>' }, 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Verify user still exists
    const user = await mockDb.getUserById(decoded.userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Verify tenant still exists
    const tenant = await mockDb.getTenantById(decoded.tenantId);
    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 401);
    }

    // Set user context
    c.set('userId', decoded.userId);
    c.set('userRole', decoded.role);
    c.set('tenantId', decoded.tenantId);
    c.set('tenantSlug', decoded.tenantSlug);

    await next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole');
    
    if (!allowedRoles.includes(userRole)) {
      return c.json({ 
        error: 'Insufficient permissions', 
        required: allowedRoles,
        current: userRole 
      }, 403);
    }

    await next();
  };
}

// Middleware to ensure tenant isolation
export async function validateTenantAccess(c: Context, next: Next) {
  try {
    const tenantSlugFromUrl = c.req.param('tenantSlug');
    const userTenantSlug = c.get('tenantSlug');

    // If tenant slug is provided in URL, validate it matches user's tenant
    if (tenantSlugFromUrl && tenantSlugFromUrl !== userTenantSlug) {
      return c.json({ 
        error: 'Access denied to this tenant',
        requested: tenantSlugFromUrl,
        allowed: userTenantSlug
      }, 403);
    }

    await next();
  } catch (error) {
    console.error('Tenant validation error:', error);
    return c.json({ error: 'Tenant validation failed' }, 500);
  }
}

// Combined authentication middleware
export const authMiddleware = authenticate;
export const adminOnly = requireRole(['admin']);
export const memberOrAdmin = requireRole(['admin', 'member']);