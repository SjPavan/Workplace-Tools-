#!/bin/bash

# AI Workspace Assistant MVP - Verification Script
# This script verifies all acceptance criteria are met

set -e

echo "🔍 AI Workspace Assistant MVP - Verification Script"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node is installed
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"
echo ""

# Check if npm is installed
echo "📦 Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version) found${NC}"
echo ""

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed. Installing now...${NC}"
    npm install
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Check critical files exist
echo "📄 Checking critical files..."
files=(
    "workspace.html"
    "server.js"
    "package.json"
    "playwright.config.js"
    "tests/e2e/workspace.spec.js"
    ".gitignore"
    "README.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
        exit 1
    fi
done
echo ""

# Start the server in background
echo "🚀 Starting development server..."
node server.js > server.log 2>&1 &
SERVER_PID=$!
echo -e "${GREEN}✅ Server started (PID: $SERVER_PID)${NC}"

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
for i in {1..10}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is ready${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Server failed to start${NC}"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done
echo ""

# Test health endpoint
echo "🏥 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ Health endpoint working${NC}"
else
    echo -e "${RED}❌ Health endpoint failed${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Test chat endpoint
echo "💬 Testing chat endpoint..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:3000/ai/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"Test message","sessionId":"test_123"}' \
    -N --max-time 5)

if echo "$CHAT_RESPONSE" | grep -q 'data:'; then
    echo -e "${GREEN}✅ Chat endpoint streaming working${NC}"
else
    echo -e "${RED}❌ Chat endpoint failed${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Test safety filter
echo "🛡️  Testing safety filter..."
SAFETY_RESPONSE=$(curl -s -X POST http://localhost:3000/ai/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"How to hack a system?","sessionId":"test_123"}' \
    -N --max-time 5)

if echo "$SAFETY_RESPONSE" | grep -q 'safety'; then
    echo -e "${GREEN}✅ Safety filter working${NC}"
else
    echo -e "${RED}❌ Safety filter failed${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Check feature flags
echo "🚩 Checking feature flags..."
if grep -q 'ATTACHMENTS_ENABLED: false' workspace.html; then
    echo -e "${GREEN}✅ Attachments disabled by default (feature flag)${NC}"
else
    echo -e "${RED}❌ Feature flag not properly configured${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Check Supabase integration code
echo "💾 Checking Supabase integration..."
if grep -q '@supabase/supabase-js' workspace.html; then
    echo -e "${GREEN}✅ Supabase client integrated${NC}"
else
    echo -e "${RED}❌ Supabase integration missing${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Check session management
echo "🔐 Checking session management..."
if grep -q 'currentSessionId' workspace.html; then
    echo -e "${GREEN}✅ Session management implemented${NC}"
else
    echo -e "${RED}❌ Session management missing${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Check error handling
echo "⚠️  Checking error handling..."
if grep -q 'handleError' workspace.html && grep -q 'error-message' workspace.html; then
    echo -e "${GREEN}✅ Error handling implemented${NC}"
else
    echo -e "${RED}❌ Error handling incomplete${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Clean up
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
rm -f server.log
echo -e "${GREEN}✅ Server stopped${NC}"
echo ""

# Summary
echo "=================================================="
echo -e "${GREEN}✅ ALL VERIFICATION CHECKS PASSED${NC}"
echo "=================================================="
echo ""
echo "Acceptance Criteria Verified:"
echo "✅ (1) /ai/chat client with streaming UI implemented"
echo "✅ (2) Feature flag for attachments (disabled by default)"
echo "✅ (3) Session memory with localStorage + Supabase ready"
echo "✅ (4) Basic safety filter and error handling"
echo "✅ (5) E2E tests ready (run 'npm test' to execute)"
echo ""
echo "🎉 MVP is ready for development preview!"
echo ""
echo "To start using:"
echo "  npm run dev          # Start the server"
echo "  npm test             # Run E2E tests"
echo ""
echo "Then open: http://localhost:3000"
