import os
import cv2
import numpy as np

data_dir = "data"
img_size = 128  # resize target: 128x128 pixels

def load_images_from_folder(folder_path, label):
    images = []
    labels = []
    filenames = os.listdir(folder_path)
    print(f"Loading {len(filenames)} images from {folder_path} ...")

    for i, fname in enumerate(filenames):
        img_path = os.path.join(folder_path, fname)
        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

        if img is None:
            print(f"  Skipping broken file: {fname}")
            continue

        img_resized = cv2.resize(img, (img_size, img_size))
        images.append(img_resized)
        labels.append(label)

        if (i + 1) % 500 == 0:
            print(f"  ...{i + 1} done")

    return images, labels

# Load both classes
class0_images, class0_labels = load_images_from_folder(os.path.join(data_dir, "Class_0"), 0)
class1_images, class1_labels = load_images_from_folder(os.path.join(data_dir, "Class_1"), 1)

# Combine into one dataset
X = np.array(class0_images + class1_images, dtype=np.uint8)
y = np.array(class0_labels + class1_labels, dtype=np.uint8)

print("\nFinal dataset shape:")
print("X (images):", X.shape)   # should be (total_images, 128, 128)
print("y (labels):", y.shape)   # should be (total_images,)

# Save as .npy files so we don't have to reload images every time
np.save("X.npy", X)
np.save("y.npy", y)
print("\nSaved X.npy and y.npy successfully.")