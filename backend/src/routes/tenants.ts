import { Hono } from 'hono';
import { mockDb } from '../utils/mock-database';
import { authMiddleware, adminOnly, validateTenantAccess } from '../middleware/auth';

const tenants = new Hono();

// Apply authentication middleware to all tenant routes
tenants.use('*', authMiddleware);

// POST /tenants/:slug/upgrade - Upgrade tenant subscription (Admin only)
tenants.post('/:slug/upgrade', adminOnly, validateTenantAccess, async (c) => {
  try {
    const tenantSlug = c.req.param('slug');
    const currentUserTenantSlug = c.get('tenantSlug');

    // Ensure user can only upgrade their own tenant
    if (tenantSlug !== currentUserTenantSlug) {
      return c.json({
        success: false,
        error: 'Access denied to this tenant'
      }, 403);
    }

    // Get tenant by slug
    const tenant = await mockDb.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return c.json({
        success: false,
        error: 'Tenant not found'
      }, 404);
    }

    // Check if already on Pro plan
    if (tenant.subscription_plan === 'pro') {
      return c.json({
        success: false,
        error: 'Tenant is already on Pro plan',
        current_plan: tenant.subscription_plan
      }, 400);
    }

    // Upgrade to Pro
    const updatedTenant = await mockDb.updateTenant(tenant.id, {
      subscription_plan: 'pro'
    });

    if (!updatedTenant) {
      return c.json({
        success: false,
        error: 'Failed to upgrade tenant'
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        subscription_plan: updatedTenant.subscription_plan,
        updated_at: updatedTenant.updated_at
      },
      message: 'Tenant successfully upgraded to Pro plan'
    });

  } catch (error) {
    console.error('Tenant upgrade error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// GET /tenants/:slug - Get tenant information
tenants.get('/:slug', validateTenantAccess, async (c) => {
  try {
    const tenantSlug = c.req.param('slug');
    const currentUserTenantSlug = c.get('tenantSlug');

    // Ensure user can only access their own tenant
    if (tenantSlug !== currentUserTenantSlug) {
      return c.json({
        success: false,
        error: 'Access denied to this tenant'
      }, 403);
    }

    const tenant = await mockDb.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return c.json({
        success: false,
        error: 'Tenant not found'
      }, 404);
    }

    // Get note count for this tenant
    const noteCount = await mockDb.countNotesByTenant(tenant.id);

    return c.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        subscription_plan: tenant.subscription_plan,
        note_count: noteCount,
        note_limit: tenant.subscription_plan === 'free' ? 3 : null,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at
      }
    });

  } catch (error) {
    console.error('Get tenant error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// GET /tenants/:slug/subscription - Get subscription information
tenants.get('/:slug/subscription', validateTenantAccess, async (c) => {
  try {
    const tenantSlug = c.req.param('slug');
    const currentUserTenantSlug = c.get('tenantSlug');

    if (tenantSlug !== currentUserTenantSlug) {
      return c.json({
        success: false,
        error: 'Access denied to this tenant'
      }, 403);
    }

    const tenant = await mockDb.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return c.json({
        success: false,
        error: 'Tenant not found'
      }, 404);
    }

    const noteCount = await mockDb.countNotesByTenant(tenant.id);

    return c.json({
      success: true,
      data: {
        plan: tenant.subscription_plan,
        note_count: noteCount,
        note_limit: tenant.subscription_plan === 'free' ? 3 : null,
        can_upgrade: tenant.subscription_plan === 'free',
        limit_reached: tenant.subscription_plan === 'free' && noteCount >= 3
      }
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

export { tenants };