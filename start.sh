#!/bin/bash

# Nepal Elections 2026 - Quick Start
# Run: ./start.sh

set -e

echo "🗳️  Nepal Elections 2026 - Starting..."
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo "📦 Building containers..."
docker compose build

echo ""
echo "🚀 Starting services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Wait for health
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose ps | grep -q "healthy"; then
        break
    fi
    echo "   Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

echo ""
echo "✅ All services started!"
echo ""
echo "   🌐 Frontend:  http://localhost:3000"
echo "   🔌 API:       http://localhost:8000"
echo "   🗄️  Database:  localhost:5432"
echo ""
echo "Commands:"
echo "   docker compose logs -f    # View logs"
echo "   docker compose down       # Stop services"
echo "   make help                 # More commands"
echo ""
