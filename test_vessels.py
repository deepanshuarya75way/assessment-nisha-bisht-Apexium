import requests

url = "http://localhost:5000/find_vessels"

payload = {
    "latitude": 28.5,
    "longitude": -90.0,
    "detected_at": "2023-01-28 12:00:00"
}

response = requests.post(url, json=payload)
print("Status code:", response.status_code)
print("Response:", response.json())