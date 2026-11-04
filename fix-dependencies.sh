#!/bin/bash

# Clarivo Dependency Fix Script
# This script fixes common dependency issues

echo "🔧 Fixing Clarivo Dependencies..."

# Frontend dependency fixes
cd frontend

echo "📦 Updating frontend dependencies..."

# Install missing dependencies that might be needed
npm install --save \
  @types/react@^18.0.0 \
  @types/react-dom@^18.0.0 \
  typescript@^4.9.0 \
  recharts@^2.5.0 \
  lucide-react@^0.263.0 \
  clsx@^1.2.1 \
  tailwindcss@^3.3.0 \
  @headlessui/react@^1.7.0 \
  framer-motion@^10.0.0

# Install dev dependencies
npm install --save-dev \
  @types/node@^18.0.0 \
  autoprefixer@^10.4.0 \
  postcss@^8.4.0

# Fix any peer dependency warnings
npm install --legacy-peer-deps

echo "✅ Frontend dependencies fixed"

cd ..

# Backend dependency fixes
cd backend

echo "📦 Updating backend dependencies..."

# Activate virtual environment
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install additional dependencies that might be missing
pip install \
  fastapi==0.104.1 \
  uvicorn[standard]==0.24.0 \
  python-multipart==0.0.6 \
  pandas==2.1.3 \
  numpy==1.24.3 \
  python-dotenv==1.0.0 \
  pydantic==2.5.0 \
  sqlalchemy==2.0.23 \
  alembic==1.13.0 \
  python-jose[cryptography]==3.3.0 \
  passlib[bcrypt]==1.7.4 \
  aiofiles==23.2.1 \
  openpyxl==3.1.2 \
  xlrd==2.0.1 \
  chardet==5.2.0

echo "✅ Backend dependencies fixed"

cd ..

echo "🎉 All dependencies have been fixed!"