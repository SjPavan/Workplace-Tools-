---
sidebar_position: 1
title: Architecture Overview
---

# Architecture Overview

Technical architecture and design of Workplace Tools.

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Client Browser                     │
│  Next.js App Router | React 19 | Tailwind CSS v4   │
├─────────────────────────────────────────────────────┤
│                   HTTPS Layer                        │
├─────────────────────────────────────────────────────┤
│           API Server (Next.js Backend)               │
│  • Authentication Routes | API Routes | Health Check│
├─────────────────────────────────────────────────────┤
│            External Services Layer                   │
│  • Supabase Auth | Supabase DB | File Storage       │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

**Framework & Libraries:**
- **Next.js**: 16.0.1+ (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x

**Styling:**
- **Tailwind CSS**: v4
- **PostCSS**: Configuration for Tailwind

**State & Data:**
- **Zustand**: State management
- **TanStack Query**: Data fetching & caching
- **next-themes**: Theme management

**PWA & Offline:**
- **Service Worker**: Built into Next.js
- **Web Manifest**: App configuration

### Backend

**Server:**
- **Next.js**: Server components & API routes
- **Async Cookies**: Promise-based cookies API
- **Environment Variables**: Configuration management

**Authentication:**
- **Supabase Auth**: Server-side authentication
- **JWT Tokens**: Session management
- **Secure Cookies**: Protected session storage

**Database:**
- **Supabase PostgreSQL**: Data persistence
- **Row Level Security**: Data access control
- **Real-time Subscriptions**: Live data updates

## Project Structure

```
workplace-tools/
├── web/                        # Next.js Application
│   ├── app/                   # App Router
│   │   ├── (auth)/           # Authentication routes
│   │   ├── (protected)/      # Protected routes
│   │   ├── api/              # API routes
│   │   ├── demo/             # Demo pages
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   ├── globals.css       # Global styles
│   │   └── providers.tsx     # App providers
│   │
│   ├── components/           # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                # Utilities & helpers
│   ├── store/              # Zustand stores
│   ├── public/             # Static assets
│   ├── package.json        # Dependencies
│   ├── tsconfig.json       # TypeScript config
│   ├── next.config.ts      # Next.js config
│   └── README.md           # Web-specific docs
│
├── docs/                     # Docusaurus documentation
│   ├── docs/               # Documentation files
│   ├── sidebars.js         # Documentation structure
│   ├── docusaurus.config.js # Documentation config
│   └── package.json        # Docusaurus dependencies
│
├── DEPLOYMENT.md           # Deployment guide
├── VERCEL_SETUP.md        # Vercel setup guide
├── README.md              # Root documentation
└── .gitignore            # Git ignore rules
```

## Data Flow

### Authentication Flow

```
User Input
    ↓
[Login Form] → Next.js API Route
    ↓
Supabase Auth ← Verify Credentials
    ↓
JWT Token → Set Secure Cookie
    ↓
Redirect to Dashboard
```

### Data Fetching Flow

```
React Component
    ↓
TanStack Query Hook
    ↓
Fetch with JWT Token
    ↓
Next.js API Route
    ↓
Supabase Query
    ↓
Return Data
    ↓
Query Cache ← Store Result
    ↓
Component Render
```

### Real-time Updates

```
Server-side Event
    ↓
Supabase Subscription
    ↓
WebSocket Connection
    ↓
Zustand Store Update
    ↓
Component Re-render
```

## Key Components

### Authentication System

**Features:**
- Email/password authentication
- Session management
- Protected routes
- Server-side validation

**Implementation:**
- Supabase Auth SDK
- JWT tokens
- Secure cookies
- Route guards in middleware

### API Routes

**Available Endpoints:**
- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get session
- `GET /api/user/profile` - Get profile
- `PATCH /api/user/profile` - Update profile
- `POST /api/user/export` - Export data

### Database Schema

**User Tables:**
```sql
auth.users
├── id (UUID)
├── email (string)
├── password (hashed)
└── created_at (timestamp)

public.user_settings
├── id (UUID)
├── user_id (FK to auth.users)
├── theme (string)
├── preferences (JSONB)
└── updated_at (timestamp)
```

**Security:**
- Row Level Security (RLS) enabled
- User can only see own data
- Policies enforce access control

### State Management

**Zustand Store:**
```typescript
store.user - Current authenticated user
store.settings - User preferences
store.theme - Theme preference
store.notifications - Notification settings
```

**TanStack Query:**
```typescript
queries.user - User profile data
queries.settings - User settings
queries.activity - Activity history
```

## Security Architecture

### Authentication Security

- Passwords hashed with bcrypt
- JWT tokens in secure cookies
- HTTPS only (encrypted in transit)
- CSRF protection
- XSS prevention via CSP headers

### Data Security

- Encryption at rest (AES-256)
- Encryption in transit (HTTPS/TLS)
- Row Level Security (RLS)
- Regular security audits
- No sensitive data in logs

### API Security

- API key authentication
- Rate limiting
- Input validation
- CORS configuration
- SQL injection prevention

## Performance Optimization

### Code Splitting

- Dynamic imports for heavy components
- Route-based code splitting
- Lazy loading of features
- Tree shaking of unused code

### Caching Strategy

**Browser Cache:**
- Static assets: 1 year
- Dynamic content: 5 minutes
- API responses: Query-based

**CDN Cache:**
- Vercel Edge Network
- Automatic invalidation
- Geographic distribution

**Application Cache:**
- Service Worker caching
- Offline support
- Background sync

### Image Optimization

- Next.js Image component
- Automatic optimization
- Multiple formats (AVIF, WebP)
- Responsive sizes

### Performance Metrics

Target metrics:
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- First Contentful Paint (FCP): < 1.8s

## Scalability

### Horizontal Scaling

- Stateless backend
- Load balancer support
- CDN distribution
- Database connection pooling

### Vertical Scaling

- Optimize queries
- Cache effectively
- Database indexes
- Resource allocation

### Rate Limiting

- API rate limits
- User quotas
- DDoS protection
- Abuse detection

## Monitoring & Observability

### Health Checks

Endpoint: `GET /api/health`

Returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "app": {
    "name": "Workplace Tools Web",
    "version": "0.1.0",
    "environment": "production"
  },
  "config": {
    "supabaseConfigured": true,
    "aiApiConfigured": false
  }
}
```

### Logging

- Error logs: Error tracking service
- Access logs: Server logs
- Security logs: Audit logs
- Performance logs: APM service

### Metrics

- Response times
- Error rates
- User activity
- API usage
- Resource utilization

## Deployment Architecture

### Development Environment

- Local Next.js server (port 3000)
- Local Supabase instance (optional)
- Hot module reload
- Source maps for debugging

### Production Environment

- Vercel hosting
- Auto-scaling
- Global CDN
- SSL certificates
- Environment variables

### Staging Environment

- Mirror of production
- Testing before deployment
- Preview deployments
- A/B testing capability

## Integration Points

### Supabase Integration

- Authentication service
- PostgreSQL database
- Real-time subscriptions
- File storage
- Webhook support

### Third-Party Services

- Email providers (for notifications)
- Analytics services
- Error tracking
- CDN services
- Payment processors (if applicable)

## API Specifications

### Request Format

```http
POST /api/endpoint
Authorization: Bearer {token}
Content-Type: application/json

{
  "data": "value"
}
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Error Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

## Future Architecture Plans

- Microservices architecture
- GraphQL API
- Real-time collaboration
- Advanced analytics
- Machine learning features
- Mobile native apps

---

**Want to dive deeper?** Check [Installation Guide](../development/installation-guide) or [API Reference](#).
