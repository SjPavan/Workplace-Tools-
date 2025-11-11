---
sidebar_position: 2
title: Installation Guide
---

# Complete Installation Guide

Detailed step-by-step instructions for installing Workplace Tools on various platforms.

## System Requirements

### Minimum Requirements
- Node.js 20.0 or higher
- npm 10.0 or yarn 1.22+
- 500 MB free disk space
- Modern web browser

### Recommended
- Node.js 20.x LTS or latest stable
- 1+ GB RAM
- SSD for faster installation

## Platform-Specific Installation

### macOS

1. **Install Homebrew** (if not already installed):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. **Install Node.js**:
```bash
brew install node@20
```

3. **Verify installation**:
```bash
node --version
npm --version
```

4. **Clone and setup**:
```bash
git clone https://github.com/workplace-tools/repository.git
cd workplace-tools/web
npm install
npm run dev
```

### Windows

1. **Download Node.js** from [nodejs.org](https://nodejs.org/)
   - Download the LTS version (20.x)
   - Run the installer and follow prompts

2. **Verify installation** (PowerShell):
```powershell
node --version
npm --version
```

3. **Clone repository**:
```powershell
git clone https://github.com/workplace-tools/repository.git
cd workplace-tools\web
npm install
npm run dev
```

### Linux (Ubuntu/Debian)

1. **Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Verify installation**:
```bash
node --version
npm --version
```

3. **Setup repository**:
```bash
git clone https://github.com/workplace-tools/repository.git
cd workplace-tools/web
npm install
npm run dev
```

## Docker Installation

A Docker setup is available for containerized deployment:

1. **Build the Docker image**:
```bash
docker build -t workplace-tools .
```

2. **Run the container**:
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  workplace-tools
```

Access the app at [http://localhost:3000](http://localhost:3000)

## Configuring Authentication

### Supabase Setup

1. **Create a Supabase project**:
   - Visit [supabase.com](https://supabase.com)
   - Click "Create new project"
   - Choose a name and database password

2. **Enable email/password auth**:
   - Go to Authentication → Providers
   - Enable "Email" provider

3. **Get your credentials**:
   - Navigate to Settings → API
   - Copy "Project URL" and "anon/public key"

4. **Configure environment**:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Troubleshooting Installation

### npm install fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Port 3000 in use

**Solution:**
```bash
# Use alternative port
npm run dev -- -p 3001

# Or kill the process using port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows (find PID), then: taskkill /PID <PID> /F
```

### Node version mismatch

**Solution:**
```bash
# Check current version
node --version

# Update Node.js
brew upgrade node           # macOS
nvm install 20 && nvm use 20  # Using nvm
```

### Memory issues during build

**Solution:**
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

## Verifying Installation

1. **Start the dev server**:
```bash
npm run dev
```

2. **Open browser** to [http://localhost:3000](http://localhost:3000)

3. **Create test account**:
   - Sign up with an email address
   - Verify email in Supabase console
   - Log in to verify authentication works

4. **Check health endpoint**:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "app": {
    "name": "Workplace Tools Web",
    "version": "0.1.0"
  }
}
```

## Next Steps

- Review the [User Guide](../user-guide/overview)
- Explore [Initial Setup](./setup)
- Read [Deployment Options](./setup#deployment)

---

**Installation complete?** Start exploring in our [Quick Start Guide](./quick-start)!
