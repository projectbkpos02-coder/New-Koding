#!/bin/bash
# Quick setup script for Vercel deployment

echo "🚀 POS Rider System - Vercel Setup"
echo "===================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📋 Please create .env file using .env.example as template"
    echo ""
    echo "Example:"
    echo "  cp .env.example .env"
    echo "  # Edit .env with your Supabase credentials"
    exit 1
fi

echo "✅ .env file found"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Check if Supabase variables are set
echo ""
echo "🔍 Checking environment variables..."

if grep -q "your-project" .env; then
    echo "⚠️  WARNING: Looks like you haven't set Supabase credentials yet"
    echo "Edit .env file and replace with your actual values"
else
    echo "✅ Environment variables look good"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel: vercel deploy"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Run database schema in Supabase"
echo ""
echo "For more info, see DEPLOYMENT.md"
