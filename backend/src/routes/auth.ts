import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { mockDb } from '../utils/mock-database';
import { generateToken } from '../utils/jwt';
import { LoginRequest, LoginResponse } from '../types';

const auth = new Hono();

// POST /auth/login
auth.post('/login', async (c) => {
  try {
    const { email, password }: LoginRequest = await c.req.json();

    if (!email || !password) {
      return c.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, 400);
    }

    // Find user by email
    const user = await mockDb.getUserByEmail(email);
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'Invalid email or password' 
      }, 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return c.json({ 
        success: false, 
        error: 'Invalid email or password' 
      }, 401);
    }

    // Get tenant information
    const tenant = await mockDb.getTenantById(user.tenant_id);
    if (!tenant) {
      return c.json({ 
        success: false, 
        error: 'Tenant not found' 
      }, 500);
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      tenantSlug: tenant.slug,
    };

    const token = generateToken(tokenPayload);

    const response: LoginResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          subscription_plan: tenant.subscription_plan,
        },
      },
    };

    return c.json({ 
      success: true, 
      data: response,
      message: 'Login successful' 
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

// POST /auth/logout (for completeness, though JWT is stateless)
auth.post('/logout', async (c) => {
  return c.json({ 
    success: true, 
    message: 'Logout successful. Please remove the token from client storage.' 
  });
});

export { auth };