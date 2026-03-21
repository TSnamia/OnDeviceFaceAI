import requests
import json

print("🚀 İstek gönderiliyor...")

# Test photo upload
url = "http://127.0.0.1:8000/api/v1/photos/upload"

# Create a REAL image data (minimal valid JPEG)
real_jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9'

test_data = {
    "file": ("test.jpg", real_jpeg_data, "image/jpeg")
}

try:
    print("📤 POST request gönderiliyor...")
    response = requests.post(url, files=test_data, timeout=10)
    
    print(f"✅ Status Code: {response.status_code}")
    print(f"📄 Response: {response.text}")
    print(f"📊 Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        print("🎉 BAŞARILI!")
    else:
        print("❌ HATA VAR!")
        
except requests.exceptions.Timeout:
    print("⏰ TIMEOUT - Backend cevap vermiyor!")
except requests.exceptions.ConnectionError:
    print("🔌 BAĞLANTI HATASI - Backend çalışmıyor!")
except Exception as e:
    print(f"💥 GENEL HATA: {e}")
