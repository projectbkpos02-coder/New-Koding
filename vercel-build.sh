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
# Copy manifest, service worker, icons and images so they are served from root
if [ -f frontend/build/manifest.json ]; then
  cp frontend/build/manifest.json public/ || true
fi
if [ -f frontend/build/service-worker.js ]; then
  cp frontend/build/service-worker.js public/ || true
fi
if [ -d frontend/build/icons ]; then
  cp -r frontend/build/icons public/ || true
fi
if [ -d frontend/public/images ]; then
  mkdir -p public/images
  cp -r frontend/public/images/* public/images/ || true
fi

echo "Build complete. Files ready for deployment."
ls -la public/
