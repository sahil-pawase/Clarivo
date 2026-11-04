#!/usr/bin/env python3
"""
Test script to check if all imports work correctly
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

try:
    print("Testing imports...")
    
    print("1. Testing core config...")
    from app.core.config import settings
    print(f"   [OK] Settings loaded, API_V1_STR: {settings.API_V1_STR}")
    
    print("2. Testing dataset models...")
    from app.models.dataset import DatasetResponse, ChatMessage
    print("   ✓ Dataset models imported")
    
    print("3. Testing dataset service...")
    from app.services.dataset_service import dataset_service
    print("   ✓ Dataset service imported")
    
    print("4. Testing dataset endpoints...")
    from app.api.api_v1.endpoints.datasets import router
    print(f"   ✓ Dataset router imported, routes: {len(router.routes)}")
    
    print("5. Testing API router...")
    from app.api.api_v1.api import api_router
    print(f"   ✓ API router imported, routes: {len(api_router.routes)}")
    
    print("6. Testing Gemini service...")
    from app.services.gemini_service import gemini_service
    print("   ✓ Gemini service imported")
    
    print("\n✅ All imports successful!")
    
    # Print all routes
    print("\nRegistered routes:")
    for route in api_router.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            print(f"   {route.methods} {route.path}")
    
except Exception as e:
    print(f"❌ Import error: {e}")
    import traceback
    traceback.print_exc()