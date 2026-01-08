#!/usr/bin/env bash
set -euo pipefail
echo "Running vercel-build.sh for Vercel deployment"

# Determine the root directory - works in both local and Vercel environments
if [ -d "/vercel/path0" ]; then
  ROOT_DIR="/vercel/path0"
elif [ -d "$(pwd)" ] && [ -f "$(pwd)/frontend/package.json" ]; then
  ROOT_DIR="$(pwd)"
else
  ROOT_DIR="$(dirname "$0")"
fi

echo "Root directory: $ROOT_DIR"

# Build frontend
echo "Building frontend..."
cd "$ROOT_DIR/frontend"

# Use npm install instead of npm ci for better compatibility
npm install --legacy-peer-deps --no-audit
npm run build

# Copy frontend build to public/ directory (for Vercel function to serve)
echo "Copying frontend build to public/"
cd "$ROOT_DIR"
mkdir -p public
cp frontend/build/index.html public/
cp -r frontend/build/static public/

echo "Build complete. Files ready for deployment."
ls -la public/
