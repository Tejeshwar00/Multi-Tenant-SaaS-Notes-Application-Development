import { User, Tenant, Note } from '../types';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// In-memory database for demo purposes (replace with real database in production)
class MockDatabase {
  private tenants: Map<string, Tenant> = new Map();
  private users: Map<string, User> = new Map();
  private notes: Map<string, Note> = new Map();

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Create tenants
    const acmeTenant: Tenant = {
      id: uuidv4(),
      name: 'Acme Corporation',
      slug: 'acme',
      subscription_plan: 'free',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const globexTenant: Tenant = {
      id: uuidv4(),
      name: 'Globex Corporation',
      slug: 'globex',
      subscription_plan: 'free',
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.tenants.set(acmeTenant.id, acmeTenant);
    this.tenants.set(globexTenant.id, globexTenant);

    // Create users
    const passwordHash = await bcrypt.hash('password', 10);

    const acmeAdmin: User = {
      id: uuidv4(),
      email: 'admin@acme.test',
      password_hash: passwordHash,
      role: 'admin',
      tenant_id: acmeTenant.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const acmeUser: User = {
      id: uuidv4(),
      email: 'user@acme.test',
      password_hash: passwordHash,
      role: 'member',
      tenant_id: acmeTenant.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const globexAdmin: User = {
      id: uuidv4(),
      email: 'admin@globex.test',
      password_hash: passwordHash,
      role: 'admin',
      tenant_id: globexTenant.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const globexUser: User = {
      id: uuidv4(),
      email: 'user@globex.test',
      password_hash: passwordHash,
      role: 'member',
      tenant_id: globexTenant.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.users.set(acmeAdmin.id, acmeAdmin);
    this.users.set(acmeUser.id, acmeUser);
    this.users.set(globexAdmin.id, globexAdmin);
    this.users.set(globexUser.id, globexUser);
  }

  // Tenant methods
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    for (const tenant of this.tenants.values()) {
      if (tenant.slug === slug) {
        return tenant;
      }
    }
    return null;
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    return this.tenants.get(id) || null;
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    const tenant = this.tenants.get(id);
    if (!tenant) return null;

    const updatedTenant = {
      ...tenant,
      ...updates,
      updated_at: new Date(),
    };
    
    this.tenants.set(id, updatedTenant);
    return updatedTenant;
  }

  // User methods
  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  // Note methods
  async createNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note> {
    const newNote: Note = {
      id: uuidv4(),
      ...note,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    this.notes.set(newNote.id, newNote);
    return newNote;
  }

  async getNotesByTenant(tenantId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.tenant_id === tenantId);
  }

  async getNoteById(id: string): Promise<Note | null> {
    return this.notes.get(id) || null;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    const note = this.notes.get(id);
    if (!note) return null;

    const updatedNote = {
      ...note,
      ...updates,
      updated_at: new Date(),
    };
    
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  async countNotesByTenant(tenantId: string): Promise<number> {
    return Array.from(this.notes.values()).filter(note => note.tenant_id === tenantId).length;
  }
}

export const mockDb = new MockDatabase();