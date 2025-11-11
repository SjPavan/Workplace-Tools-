---
sidebar_position: 2
title: Developer Installation
---

# Developer Installation Guide

Complete guide for developers setting up the development environment.

## Prerequisites

### Required

- **Node.js**: 20.x or higher (LTS recommended)
- **npm**: 10.x or higher
- **Git**: Latest version
- **Code Editor**: VS Code (recommended) or similar
- **Terminal**: bash, zsh, or Windows PowerShell

### Optional

- **Docker**: For containerized development
- **Supabase CLI**: For local Supabase development
- **Postman**: For API testing
- **DBeaver**: For database exploration

### System Requirements

- **RAM**: 4GB minimum (8GB recommended)
- **Disk**: 2GB free space
- **CPU**: Dual-core minimum
- **OS**: macOS, Linux, or Windows

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/workplace-tools/repository.git
cd workplace-tools
```

### 2. Navigate to Web Directory

```bash
cd web
```

### 3. Install Dependencies

```bash
npm install
```

This installs all required packages listed in `package.json`.

**What Gets Installed:**
- Next.js
- React & React DOM
- TypeScript
- Tailwind CSS
- Supabase client
- TanStack Query
- Zustand
- ESLint

**Installation Time:** 5-10 minutes (first time)

### 4. Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Required for full functionality
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Getting Supabase Credentials:**
1. Create project at https://supabase.com
2. Go to Settings → API
3. Copy Project URL and anon key
4. Paste into `.env.local`

### 5. Start Development Server

```bash
npm run dev
```

Expected output:
```
> web@0.1.0 dev
> next dev

  ▲ Next.js 16.0.1
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.1s
```

### 6. Open in Browser

Visit [http://localhost:3000](http://localhost:3000)

You should see:
- Workplace Tools homepage
- Sign up/login options
- Responsive design works

## Verification Steps

### 1. Test Frontend

```bash
# Visit http://localhost:3000
# Should see homepage
# Try navigating pages
# Check console for errors
```

### 2. Test Backend

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Expected response (200 OK):
{
  "status": "ok",
  "app": {
    "name": "Workplace Tools Web",
    "version": "0.1.0"
  }
}
```

### 3. Test Database Connection

If Supabase configured:
```bash
# Try signing up with test account
# Should verify email
# Should be able to login
```

### 4. Test Build

```bash
# Ensure production build works
npm run build

# Should complete without errors
# Output: .next directory created
```

## Development Workflow

### Running Development Server

```bash
npm run dev
```

**Features:**
- Hot module reload (HMR)
- Fast refresh
- Source maps for debugging
- Error overlay display

**Access:**
- Main app: http://localhost:3000
- Health check: http://localhost:3000/api/health

### Type Checking

```bash
# Check TypeScript types
npm run typecheck
```

Catches type errors before runtime.

### Linting

```bash
# Run ESLint
npm run lint
```

Ensures code quality and consistency.

### Testing

```bash
# Run lint and typecheck
npm run test
```

Should pass before committing.

### Building for Production

```bash
# Create optimized build
npm run build

# Start production server
npm run start
```

**Build Output:**
- Optimized bundles
- Minified code
- Source map generation
- Asset optimization

## Debugging

### Using Browser DevTools

**Chrome/Edge:**
1. Open DevTools (F12)
2. Go to Sources tab
3. View compiled code
4. Set breakpoints
5. Step through code

**Console Debugging:**
```javascript
// In your code
console.log('Value:', variable);
console.error('Error occurred:', error);
console.table([{a: 1}, {a: 2}]);

// In DevTools console
// View output here
```

### VS Code Debugging

**Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

**Debugging:**
1. Set breakpoints in editor
2. Press F5 to start debugging
3. DevTools opens automatically
4. Step through code

### Network Debugging

**Browser DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Make requests
4. Inspect network activity
5. Check headers and payloads

**Using cURL:**
```bash
# Test API endpoint
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/user/profile

# Check response
# View headers and body
```

### Environment Debugging

```bash
# Check environment variables
node -e 'console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)'

# In .env.local
# Verify values are set
# Check no typos
# Ensure correct URLs
```

## Common Development Tasks

### Adding a New Page

1. **Create route file**:
   ```bash
   # For /settings page
   mkdir -p app/settings
   touch app/settings/page.tsx
   ```

2. **Add component**:
   ```typescript
   export default function SettingsPage() {
     return <div>Settings Page</div>
   }
   ```

3. **Server automatically reloads**
4. **Visit http://localhost:3000/settings**

### Adding a New Component

1. **Create component file**:
   ```bash
   touch components/MyComponent.tsx
   ```

2. **Write component**:
   ```typescript
   export function MyComponent() {
     return <div>Component</div>
   }
   ```

3. **Import and use**:
   ```typescript
   import { MyComponent } from '@/components/MyComponent'
   
   export default function Page() {
     return <MyComponent />
   }
   ```

### Working with Tailwind CSS

```typescript
// Use Tailwind classes
<div className="flex items-center justify-between p-4 bg-gray-100">
  <h1 className="text-2xl font-bold">Title</h1>
  <button className="px-4 py-2 bg-blue-500 text-white rounded">
    Click me
  </button>
</div>
```

**Utility Classes:**
- `flex`, `grid` - Layout
- `p-4`, `m-4` - Spacing
- `text-2xl`, `font-bold` - Typography
- `bg-blue-500` - Colors
- `rounded`, `shadow` - Effects

### Using Supabase

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function MyComponent() {
  const supabase = createClientComponentClient()
  
  // Use Supabase client
  const { data } = await supabase
    .from('table_name')
    .select()
}
```

### Using Zustand Store

```typescript
import { useStore } from '@/store'

export function MyComponent() {
  const user = useStore(state => state.user)
  const updateUser = useStore(state => state.updateUser)
  
  return (
    <div>
      <p>User: {user.email}</p>
      <button onClick={() => updateUser({...})}>Update</button>
    </div>
  )
}
```

### Using TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query'

export function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile')
      return res.json()
    }
  })
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>{data.email}</div>
}
```

## Troubleshooting Development

### Port Already in Use

```bash
# Use different port
npm run dev -- -p 3001

# Or kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell):
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencies Won't Install

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### TypeScript Errors

```bash
# Type checking failing?
npm run typecheck

# Review errors
# Fix files with issues
# Can still run dev despite errors

# Force ignore (not recommended):
# Use @ts-ignore in code (temporary only)
```

### Hot Reload Not Working

```bash
# Restart dev server
# Press Ctrl+C to stop
npm run dev

# Or check:
# - File permissions
# - Disk space
# - Large files
```

### Build Fails

```bash
# Check build output
npm run build

# Common issues:
# - TypeScript errors
# - Missing dependencies
# - Environment variables

# Fix and retry:
npm run build
```

## IDE Setup

### VS Code Configuration

**.vscode/settings.json:**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.formatOnSave": true,
  "eslint.validate": ["typescript", "typescriptreact"]
}
```

**.vscode/extensions.json:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Recommended Extensions

- **ESLint**: Lint code
- **Prettier**: Format code
- **Tailwind CSS IntelliSense**: CSS completions
- **TypeScript Vue Plugin**: TypeScript support
- **REST Client**: Test API endpoints

## Performance Development

### Profiling

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Performance tab
3. Click record
4. Interact with app
5. Click stop
6. Analyze results

**Lighthouse:**
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Click "Analyze page load"
4. Review performance report

### Optimization

```bash
# Check bundle size
npm run build
# .next/static/chunks/
# Review file sizes
```

## Next Steps

1. Read [User Guide](../user-guide/overview)
2. Explore [Tutorials](../tutorials/basic-usage)
3. Review [API Reference](#)
4. Check [Deployment Guide](../getting-started/setup#deployment)

---

**Having issues?** Check [Troubleshooting](../support/troubleshooting) or contact support@workplace-tools.example.com
