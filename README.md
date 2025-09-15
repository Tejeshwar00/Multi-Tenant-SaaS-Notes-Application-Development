<<<<<<< HEAD
# SaaS Notes - Multi-Tenant Notes Application

## 🚀 Project Overview

**SaaS Notes** is a comprehensive multi-tenant Software-as-a-Service (SaaS) application that allows multiple companies (tenants) to securely manage their users and notes with strict data isolation, role-based access control, and subscription-based feature gating.

### Key Features
- **Multi-Tenancy**: Complete data isolation between tenants (Acme & Globex)
- **JWT Authentication**: Secure token-based authentication system
- **Role-Based Access Control**: Admin and Member roles with different permissions
- **Subscription Management**: Free (3 notes limit) and Pro (unlimited) plans
- **REST API**: Full CRUD operations for notes with tenant isolation
- **Responsive Frontend**: Modern web interface with real-time updates

---

## 🏗️ Architecture

### Multi-Tenancy Approach
**Strategy**: **Shared Schema with Tenant ID Column**
- Single database with `tenant_id` column in all tables
- Ensures complete data isolation at the application level
- Cost-effective and easier to manage than separate databases
- All queries include `tenant_id` filter for security

### Technology Stack

#### Backend
- **Framework**: Hono.js (TypeScript) - Lightweight, fast web framework
- **Runtime**: Node.js with TypeScript compilation
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Database**: In-memory mock database (production-ready PostgreSQL schema included)
- **Deployment**: Vercel (Serverless Functions)

#### Frontend
- **Framework**: Vanilla HTML/CSS/JavaScript (no heavy frameworks)
- **Styling**: TailwindCSS (via CDN)
- **Icons**: Font Awesome
- **HTTP Client**: Axios
- **Deployment**: Vercel (Static Hosting)

---

## 📊 Data Models

### Tenants
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'member')),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notes
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌐 API Endpoints

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://3000-isvmc3ntsbz89uqydixia-6532622b.e2b.dev`

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/login` | User login | ❌ |
| `POST` | `/auth/logout` | User logout | ❌ |

### Notes Endpoints (CRUD)
| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| `POST` | `/notes` | Create a note | ✅ | Member/Admin |
| `GET` | `/notes` | List all notes for tenant | ✅ | Member/Admin |
| `GET` | `/notes/:id` | Get specific note | ✅ | Member/Admin |
| `PUT` | `/notes/:id` | Update note | ✅ | Member/Admin |
| `DELETE` | `/notes/:id` | Delete note | ✅ | Member/Admin |

### Tenant Management Endpoints
| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| `GET` | `/tenants/:slug` | Get tenant info | ✅ | Member/Admin |
| `GET` | `/tenants/:slug/subscription` | Get subscription info | ✅ | Member/Admin |
| `POST` | `/tenants/:slug/upgrade` | Upgrade to Pro | ✅ | **Admin Only** |

### Utility Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Health check | ❌ |
| `GET` | `/` | API documentation | ❌ |

---

## 👥 Test Accounts

All test accounts use the password: **`password`**

### Acme Corporation (slug: `acme`)
- **Admin**: `admin@acme.test` / `password`
  - Can create/edit/delete notes
  - Can upgrade subscription to Pro
  - Can invite users (if implemented)
- **Member**: `user@acme.test` / `password`
  - Can create/edit/delete notes
  - Cannot upgrade subscription

### Globex Corporation (slug: `globex`) 
- **Admin**: `admin@globex.test` / `password`
  - Can create/edit/delete notes
  - Can upgrade subscription to Pro
  - Can invite users (if implemented)
- **Member**: `user@globex.test` / `password`
  - Can create/edit/delete notes
  - Cannot upgrade subscription

---

## 💰 Subscription Plans

### Free Plan
- **Note Limit**: Maximum of 3 notes per tenant
- **Users**: Unlimited users per tenant
- **Features**: Basic note CRUD operations
- **Upgrade**: Admin can upgrade to Pro

### Pro Plan
- **Note Limit**: Unlimited notes
- **Users**: Unlimited users per tenant  
- **Features**: All Free features + unlimited notes
- **Billing**: One-time upgrade (demo only)

### Feature Gating Implementation
```typescript
// Example: Note creation with limit checking
if (tenant.subscription_plan === 'free') {
  const noteCount = await countNotesByTenant(tenantId);
  if (noteCount >= 3) {
    return error('Note limit reached. Upgrade to Pro for unlimited notes.');
  }
}
```

---

## 🔒 Security Features

### Tenant Isolation
- **Database Level**: All queries filtered by `tenant_id`
- **API Level**: JWT tokens contain tenant information
- **Middleware**: Automatic tenant validation on all routes
- **URL Validation**: Tenant slug in URLs validated against user's tenant

### Authentication & Authorization
- **JWT Tokens**: Secure, stateless authentication
- **Password Security**: bcrypt hashing with salt rounds
- **Role-Based Access**: Middleware enforces role requirements
- **Token Expiration**: 7-day token lifetime with refresh capability

### Data Validation
- **Input Sanitization**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries (when using real DB)
- **XSS Protection**: HTML escaping in frontend
- **CORS Configuration**: Proper CORS headers for cross-origin requests

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+ and npm
- Git

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Or start with PM2 (recommended)
cd .. && pm2 start ecosystem.config.cjs
```

### Frontend Setup
```bash
# Navigate to frontend directory  
cd frontend

# Start simple HTTP server
python -m http.server 8080
# Or use any static file server

# Access at http://localhost:8080
```

### Development URLs
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:8080
- **API Documentation**: http://localhost:3000/
- **Health Check**: http://localhost:3000/health

---

## 🌐 Deployment

### Backend Deployment (Vercel)
```bash
# In backend directory
npm run build
vercel --prod

# Set environment variables in Vercel dashboard:
# - JWT_SECRET=your-secret-key
# - NODE_ENV=production
# - DATABASE_URL=your-postgres-connection (for production)
```

### Frontend Deployment (Vercel)
```bash
# In frontend directory
vercel --prod

# Update app.js with your backend URL:
# const API_BASE_URL = 'https://your-backend.vercel.app'
```

### Environment Variables

#### Backend (.env)
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Database (for production)
DATABASE_URL=postgresql://user:password@host:port/database

# Server Configuration
PORT=3000
NODE_ENV=production
```

---

## ✅ Testing

### Manual Testing Checklist

#### Authentication
- [ ] Login with all 4 test accounts
- [ ] Invalid login attempts are rejected
- [ ] JWT token expiration handling
- [ ] Logout functionality

#### Tenant Isolation
- [ ] Acme users cannot see Globex notes
- [ ] Globex users cannot see Acme notes
- [ ] Cross-tenant API requests are blocked

#### Notes CRUD
- [ ] Create notes (respecting limits)
- [ ] Read notes (only own tenant)
- [ ] Update notes (only own tenant)
- [ ] Delete notes (only own tenant)

#### Subscription Management
- [ ] Free plan note limit (3 notes max)
- [ ] Admin can upgrade to Pro
- [ ] Members cannot upgrade subscription
- [ ] Pro plan has unlimited notes

#### Role-Based Access
- [ ] Members can manage notes
- [ ] Only Admins can upgrade subscription
- [ ] Role validation on protected endpoints

### API Testing Examples

#### Login Test
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.test", "password": "password"}'
```

#### Create Note Test
```bash
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title": "Test Note", "content": "Note content"}'
```

#### Upgrade Subscription Test
```bash
curl -X POST http://localhost:3000/tenants/acme/upgrade \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

## 📱 Frontend User Guide

### Login Process
1. Open the application in your browser
2. Select a test account from the dropdown
3. Password is pre-filled as "password"
4. Click "Login" to access the dashboard

### Dashboard Features
1. **User Info**: Display current user and tenant information
2. **Subscription Status**: Shows current plan and note count
3. **Create Notes**: Add new notes with title and content
4. **Notes List**: View, edit, and delete existing notes
5. **Upgrade Button**: (Admin only) Upgrade to Pro plan

### Subscription Management
- **Free Plan**: Shows "🆓 Free Plan" with note count (e.g., "2/3 notes")
- **Pro Plan**: Shows "⭐ Pro Plan" with unlimited notes
- **Upgrade**: Admin users see "Upgrade to Pro" button
- **Limit Reached**: Button shows warning when at 3-note limit

---

## 🔧 Project Structure

```
webapp/
├── backend/                          # Hono.js API Backend
│   ├── src/
│   │   ├── routes/                   # API route handlers
│   │   │   ├── auth.ts              # Authentication endpoints
│   │   │   ├── notes.ts             # Notes CRUD endpoints
│   │   │   ├── tenants.ts           # Tenant management
│   │   │   └── health.ts            # Health check
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.ts              # JWT & role validation
│   │   │   └── cors.ts              # CORS configuration
│   │   ├── utils/                    # Utility functions
│   │   │   ├── database.ts          # Database connection
│   │   │   ├── mock-database.ts     # In-memory database
│   │   │   └── jwt.ts               # JWT utilities
│   │   ├── types/                    # TypeScript type definitions
│   │   │   └── index.ts             # All type interfaces
│   │   └── index.ts                 # Application entry point
│   ├── package.json                 # Backend dependencies
│   ├── tsconfig.json               # TypeScript configuration
│   ├── vercel.json                 # Vercel deployment config
│   └── .env.example                # Environment variables template
├── frontend/                        # Static Frontend
│   ├── index.html                  # Main application page
│   ├── app.js                      # Frontend JavaScript logic
│   ├── package.json                # Frontend package info
│   └── vercel.json                 # Vercel deployment config
├── ecosystem.config.cjs            # PM2 process configuration
├── .gitignore                      # Git ignore rules
└── README.md                       # This documentation
```

---

## 🎯 Implementation Highlights

### Multi-Tenancy Implementation
- **Shared Database**: Single database with tenant isolation
- **Middleware Protection**: All routes validate tenant access
- **UUID-based IDs**: Prevents ID enumeration attacks
- **Tenant Context**: JWT tokens carry tenant information

### Security Measures
- **JWT Authentication**: Stateless, secure token system
- **Role-Based Authorization**: Granular permission control
- **Input Validation**: All inputs sanitized and validated
- **Tenant Isolation**: Strict data separation between tenants

### Subscription Logic
- **Real-time Limits**: Note count checked on creation
- **Immediate Upgrades**: Limits lifted instantly after upgrade
- **Admin-Only Upgrades**: Role-based subscription management
- **Graceful Degradation**: Clear messaging when limits reached

---

## 🚧 Development Status

### ✅ Completed Features
1. **Multi-tenant architecture** with complete data isolation
2. **JWT-based authentication** system
3. **Role-based authorization** (Admin/Member)
4. **Full Notes CRUD API** with tenant isolation
5. **Subscription management** with Free/Pro plans
6. **Real-time frontend** with responsive design
7. **Comprehensive API documentation**
8. **Security middleware** and validation
9. **Health monitoring** endpoints
10. **Deployment configuration** for Vercel

### 📋 Future Enhancements
- [ ] User invitation system (Admin can invite new users)
- [ ] Real PostgreSQL database integration
- [ ] Email notifications for important events
- [ ] Advanced note features (tags, search, categories)
- [ ] Audit logging for security compliance
- [ ] API rate limiting and throttling
- [ ] Real payment integration for subscriptions
- [ ] Advanced role management (custom roles)
- [ ] Tenant onboarding flow
- [ ] Analytics dashboard for tenant usage

---

## 🤝 Contributing

### Development Workflow
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/your-feature`
3. **Make changes** and test thoroughly
4. **Commit changes**: `git commit -m "Add your feature"`
5. **Push to branch**: `git push origin feature/your-feature`
6. **Create Pull Request** with detailed description

### Code Standards
- **TypeScript**: Strict typing for backend code
- **ESLint**: Code linting and formatting
- **Meaningful Commits**: Clear, descriptive commit messages
- **Documentation**: Update README for any new features
- **Testing**: Include tests for new functionality

---

## 📞 Support & Contact

### Issues & Bugs
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Refer to this README for guidance
- **Security Issues**: Report privately via email

### Technical Support
- **API Issues**: Check health endpoint and logs
- **Authentication Problems**: Verify JWT token format
- **Tenant Issues**: Ensure proper tenant slug usage
- **Database Problems**: Check connection and schema

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎉 Acknowledgments

- **Hono.js** - Excellent lightweight web framework
- **TailwindCSS** - Beautiful, utility-first CSS framework
- **Vercel** - Seamless deployment platform
- **JWT** - Secure authentication standard
- **TypeScript** - Type safety and developer experience

---

*Built with ❤️ for demonstrating modern multi-tenant SaaS architecture*
=======
# Multi-Tenant-SaaS-Notes-Application-Development
Developed a Multi-Tenant SaaS Notes Application enabling users to create, organize, and securely manage notes across multiple tenants. Implemented role-based access, authentication, and scalable architecture with a clean UI for seamless collaboration and efficient note management.
>>>>>>> ef7d4b24f2dd4fdd580fe9b8204d7fb3ee828f10
