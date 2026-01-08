#!/usr/bin/env bash
set -euo pipefail
echo "Running vercel-build.sh"

# Navigate to project root first
cd /vercel/path0
echo "PROJECT ROOT PWD: $(pwd)"

# Build frontend
echo "Building frontend..."
cd frontend
echo "FRONTEND PWD: $(pwd)"
echo "Listing frontend root:" && ls -la || true
echo "Run build"
npm ci
npm run build
echo "Listing build:" && ls -la build || true

# Prepare output directory
mkdir -p /vercel/output
echo "Copying frontend build to /vercel/output"
cp -av build/. /vercel/output/

# Copy API functions and handlers to output
echo "Copying API functions and handlers to /vercel/output"
cd /vercel/path0
cp -r api /vercel/output/api
cp -r lib /vercel/output/lib

# Create a simple server.js wrapper in /vercel/output if it doesn't exist
echo "Creating server wrapper..."
cat > /vercel/output/server.js << 'EOF'
// Vercel serverless entry point
module.exports = require('./api/index.js');
EOF

echo "Listing /vercel/output:" && ls -la /vercel/output || true
echo "Listing /vercel/output/api:" && ls -la /vercel/output/api || true
echo "Listing /vercel/output/lib:" && ls -la /vercel/output/lib || true
