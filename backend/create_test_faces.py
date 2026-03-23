import requests
import json
from pathlib import Path
import time

# API URL
API_URL = "http://localhost:8000/api/v1/photos/upload"

# Create test directory
test_dir = Path("test_faces")
test_dir.mkdir(exist_ok=True)

# Generate 50 different test images with simulated face data
print("🎯 Creating 50 test images with different faces...")

for i in range(1, 51):
    # Create a simple JPEG header with different data for each "face"
    jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9'
    
    # Add unique pattern for each "face"
    unique_data = f"face_{i:03d}".encode() * 10
    modified_jpeg = jpeg_data + unique_data
    
    # Save test image
    test_file = test_dir / f"face_{i:03d}.jpg"
    with open(test_file, 'wb') as f:
        f.write(modified_jpeg)
    
    print(f"✅ Created: {test_file.name}")

print(f"\n🚀 Uploading 50 test images to API...")

# Upload all images
success_count = 0
error_count = 0

for i in range(1, 51):
    try:
        with open(test_dir / f"face_{i:03d}.jpg", 'rb') as f:
            files = {'file': (f"face_{i:03d}.jpg", f, 'image/jpeg')}
            response = requests.post(API_URL, files=files, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {i:3d}/50 - face_{i:03d}.jpg -> ID: {result.get('id', 'N/A')}")
                success_count += 1
            else:
                print(f"❌ {i:3d}/50 - face_{i:03d}.jpg -> Status: {response.status_code}")
                error_count += 1
                
    except Exception as e:
        print(f"💥 {i:3d}/50 - face_{i:03d}.jpg -> Error: {str(e)[:50]}")
        error_count += 1
    
    # Small delay to avoid overwhelming
    time.sleep(0.1)

print(f"\n🎯 UPLOAD COMPLETE!")
print(f"✅ Success: {success_count}")
print(f"❌ Errors:  {error_count}")
print(f"📊 Total:   {success_count + error_count}")

# Test API response
print(f"\n🔍 Testing API response...")
try:
    response = requests.get("http://localhost:8000/api/v1/photos")
    if response.status_code == 200:
        data = response.json()
        total = data.get('total', 0)
        print(f"📸 Total photos in database: {total}")
        
        if total >= 50:
            print("🎉 SUCCESS: All 50 face images uploaded!")
        else:
            print(f"⚠️  WARNING: Expected 50, got {total}")
    else:
        print(f"❌ API Error: {response.status_code}")
except Exception as e:
    print(f"💥 API Test Error: {e}")

print(f"\n🚀 Frontend URL: http://localhost:5173/gallery")
print(f"🔗 Check the gallery to see all uploaded faces!")
