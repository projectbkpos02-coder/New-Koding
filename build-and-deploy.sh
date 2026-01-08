#!/bin/bash
# Build and deploy script

set -e

echo "📦 Building Frontend..."
cd /workspaces/New-Koding/frontend
npm run build

echo "📋 Copying build to public directory..."
rm -rf /workspaces/New-Koding/public/static
cp -r /workspaces/New-Koding/frontend/build/static /workspaces/New-Koding/public/
cp -r /workspaces/New-Koding/frontend/build/index.html /workspaces/New-Koding/public/
cp -r /workspaces/New-Koding/frontend/build/_redirects /workspaces/New-Koding/public/ 2>/dev/null || true

echo "✅ Build complete and copied to public!"
echo ""
echo "📍 Next steps:"
echo "1. Run: npm start (for development)"
echo "2. Or push to Vercel: git push origin main"
