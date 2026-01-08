#!/usr/bin/env bash
set -euo pipefail
echo "Running vercel-build.sh"
cd frontend
echo "PWD: $(pwd)"
echo "Listing frontend root:" && ls -la || true
echo "Run build"
npm ci
npm run build
echo "Listing build:" && ls -la build || true
mkdir -p /vercel/output
echo "Copying build to /vercel/output"
cp -av build/. /vercel/output/
echo "Listing /vercel/output:" && ls -la /vercel/output || true
