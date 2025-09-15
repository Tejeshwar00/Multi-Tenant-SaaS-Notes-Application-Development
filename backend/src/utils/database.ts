import { Pool } from 'pg';

class Database {
  private pool: Pool;

  constructor() {
    // For local development, use a simple in-memory simulation
    // In production, this would connect to a real PostgreSQL database
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost/saas_notes',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async query(text: string, params?: any[]): Promise<any> {
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async close() {
    await this.pool.end();
  }

  // Initialize database schema
  async initializeSchema() {
    try {
      // Create tenants table
      await this.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create users table
      await this.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'member')),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create notes table
      await this.query(`
        CREATE TABLE IF NOT EXISTS notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(500) NOT NULL,
          content TEXT,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await this.query('CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_notes_tenant_id ON notes(tenant_id)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)');

      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Error initializing database schema:', error);
      throw error;
    }
  }
}

export const db = new Database();