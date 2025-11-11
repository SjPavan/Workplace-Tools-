---
sidebar_position: 1
title: Quick Start
---

# Quick Start Guide

Get Workplace Tools up and running in just a few minutes!

## Prerequisites

Before you begin, ensure you have:

- Node.js 20 or higher
- npm or yarn package manager
- A modern web browser
- Git (for cloning the repository)

## Installation in 5 Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/workplace-tools/repository.git
cd workplace-tools
```

### Step 2: Navigate to the Web Directory

```bash
cd web
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables (Optional)

For full functionality with authentication, copy the example environment file and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

> **Note:** The app will work with default placeholder values if you skip this step.

### Step 5: Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser!

## What's Next?

- 📖 Read the [User Guide](../user-guide/overview) to learn about features
- 🚀 Check out [Deployment Options](../getting-started/setup) to go live
- 🆘 Need help? Visit [Troubleshooting](../support/troubleshooting)

## Common Issues

**Port 3000 Already in Use?**
```bash
# Use a different port
npm run dev -- -p 3001
```

**Dependencies Won't Install?**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Authentication Not Working?**
- Verify your Supabase credentials in `.env.local`
- Check that you have an email/password provider enabled in Supabase
- Restart the development server

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm test` | Run lint and type checks |

## Next Steps

1. Log in with a Supabase user account
2. Explore the dashboard
3. Read the [User Guide](../user-guide/overview) for detailed features
4. Visit [Advanced Tutorials](../tutorials/advanced-features) to unlock full potential

**Happy productivity!** 🎉
