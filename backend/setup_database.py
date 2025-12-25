#!/usr/bin/env python3
"""
Database Setup Script for POS Rider System
This script creates the required tables in Supabase using the Supabase Python client.
Run this script to initialize the database schema.
"""

import os
from dotenv import load_dotenv
from supabase import create_client
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test connection
try:
    # Try to insert default super admin
    from passlib.context import CryptContext
    import uuid
    from datetime import datetime, timezone
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Check if profiles table exists by trying to query it
    result = supabase.table("profiles").select("id").limit(1).execute()
    print("✓ Database tables exist!")
    print(f"  - Found {len(result.data)} profiles")
    
    # Check categories
    cat_result = supabase.table("categories").select("*").execute()
    print(f"  - Found {len(cat_result.data)} categories")
    
    # Check products
    prod_result = supabase.table("products").select("*").execute()
    print(f"  - Found {len(prod_result.data)} products")
    
    print("\n✓ Database is ready!")
    print("\n--- Default Login ---")
    print("Email: superadmin@pos.com")
    print("Password: admin123")
    print("\nTo setup database, run the SQL in database_schema.sql in Supabase SQL Editor")
    
except Exception as e:
    print(f"\n⚠ Database tables may not exist yet.")
    print(f"Error: {e}")
    print("\n--- SETUP INSTRUCTIONS ---")
    print("1. Go to Supabase Dashboard: https://supabase.com/dashboard")
    print("2. Select your project")
    print("3. Go to SQL Editor (left sidebar)")
    print("4. Copy the contents of 'database_schema.sql' file")
    print("5. Paste and run in SQL Editor")
    print("6. Run this script again to verify")
