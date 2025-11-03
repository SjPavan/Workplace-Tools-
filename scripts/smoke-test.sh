#!/bin/bash

# Smoke test script for deployment verification
# Usage: ./scripts/smoke-test.sh [backend-url] [frontend-url]

set -e

BACKEND_URL=${1:-"http://localhost:8000"}
FRONTEND_URL=${2:-"http://localhost:3000"}

echo "🚀 Running smoke tests..."
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Test backend health
echo "📊 Testing backend health endpoint..."
if curl -f -s "$BACKEND_URL/health" > /dev/null; then
    echo "✅ Backend health check passed"
    curl -s "$BACKEND_URL/health" | jq .
else
    echo "❌ Backend health check failed"
    exit 1
fi
echo ""

# Test backend version
echo "📋 Testing backend version endpoint..."
if curl -f -s "$BACKEND_URL/version" > /dev/null; then
    echo "✅ Backend version endpoint working"
    curl -s "$BACKEND_URL/version" | jq .
else
    echo "❌ Backend version endpoint failed"
fi
echo ""

# Test AI endpoint
echo "🤖 Testing AI endpoint (mock response)..."
if curl -f -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello, smoke test!"}' \
    "$BACKEND_URL/api/ai/complete" > /dev/null; then
    echo "✅ AI endpoint working"
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"message": "Hello, smoke test!"}' \
        "$BACKEND_URL/api/ai/complete" | jq .
else
    echo "❌ AI endpoint failed"
fi
echo ""

# Test AI models endpoint
echo "🔧 Testing AI models endpoint..."
if curl -f -s "$BACKEND_URL/api/ai/models" > /dev/null; then
    echo "✅ AI models endpoint working"
    curl -s "$BACKEND_URL/api/ai/models" | jq .
else
    echo "❌ AI models endpoint failed"
fi
echo ""

# Test frontend
echo "🌐 Testing frontend..."
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend not accessible"
    exit 1
fi
echo ""

# Test frontend API integration
echo "🔗 Testing frontend API integration..."
if curl -f -s "$FRONTEND_URL/api/health" > /dev/null; then
    echo "✅ Frontend API proxy working"
else
    echo "⚠️ Frontend API proxy not configured (expected for some setups)"
fi
echo ""

echo "🎉 Smoke tests completed successfully!"