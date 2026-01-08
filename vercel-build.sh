#!/usr/bin/env bash
set -euo pipefail
echo "Running vercel-build.sh for Vercel deployment"

# Build frontend
cd /vercel/path0/frontend
echo "Building frontend..."
npm ci
npm run build

# Copy frontend build to public/ directory (for Vercel function to serve)
echo "Copying frontend build to public/"
cd /vercel/path0
mkdir -p public
cp frontend/build/index.html public/
cp -r frontend/build/static public/

echo "Build complete. Files ready for deployment."
ls -la public/
