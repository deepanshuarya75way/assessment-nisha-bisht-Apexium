import requests

url = "http://localhost:5000/predict"

# Use one of your actual test images
image_path = r"..\model\data\Class_1\class_1_00001.jpg"

with open(image_path, "rb") as f:
    files = {"image": f}
    response = requests.post(url, files=files)

print("Status code:", response.status_code)
print("Response:", response.json())