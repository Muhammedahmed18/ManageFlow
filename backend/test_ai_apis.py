#!/usr/bin/env python
"""
Test script for AI APIs
Run this to verify all AI features are working correctly
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000"
BUSINESS_ID = 1  # Change this to your actual business ID

def test_api_endpoint(endpoint, name):
    """Test an API endpoint and return the response"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n🔍 Testing {name}...")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {name} - SUCCESS!")
            print(f"Response keys: {list(data.keys())}")
            return data
        else:
            print(f"❌ {name} - FAILED!")
            print(f"Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ {name} - ERROR!")
        print(f"Exception: {str(e)}")
        return None

def main():
    print("🚀 AI API Testing Script")
    print("=" * 50)
    
    # Test endpoints
    endpoints = [
        (f"/api/management/predictions/{BUSINESS_ID}/ml-forecast/", "ML Sales Forecast"),
        (f"/api/management/predictions/{BUSINESS_ID}/customer-segmentation/", "Customer Segmentation"),
        (f"/api/management/predictions/{BUSINESS_ID}/anomaly-detection/", "Anomaly Detection"),
        (f"/api/management/predictions/{BUSINESS_ID}/dashboard/", "AI Prediction Dashboard"),
    ]
    
    results = {}
    
    for endpoint, name in endpoints:
        result = test_api_endpoint(endpoint, name)
        results[name] = result
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    success_count = 0
    for name, result in results.items():
        if result:
            print(f"✅ {name}: WORKING")
            success_count += 1
        else:
            print(f"❌ {name}: FAILED")
    
    print(f"\n🎯 Results: {success_count}/{len(endpoints)} APIs working")
    
    if success_count == len(endpoints):
        print("🎉 All AI APIs are working correctly!")
        print("\n📋 Next Steps:")
        print("1. Start your frontend: cd frontend && npm run dev")
        print("2. Navigate to the AI Dashboard in your app")
        print("3. Test the interactive features")
    else:
        print("⚠️  Some APIs failed. Check the errors above.")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure Django server is running")
        print("2. Check if business ID exists")
        print("3. Verify authentication is working")

if __name__ == "__main__":
    main()


