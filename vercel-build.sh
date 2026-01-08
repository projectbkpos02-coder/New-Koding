#!/usr/bin/env bash
set -euo pipefail
echo "Running vercel-build.sh"

# Build frontend
cd frontend
echo "PWD: $(pwd)"
echo "Listing frontend root:" && ls -la || true
echo "Run build"
npm ci
npm run build
echo "Listing build:" && ls -la build || true

# Prepare output directory
mkdir -p /vercel/output
echo "Copying frontend build to /vercel/output"
cp -av build/. /vercel/output/

# Copy API functions to /vercel/output/api
echo "Copying API functions to /vercel/output/api"
cd /vercel/path0
cp -r api /vercel/output/api

echo "Listing /vercel/output:" && ls -la /vercel/output || true
echo "Listing /vercel/output/api:" && ls -la /vercel/output/api || true
