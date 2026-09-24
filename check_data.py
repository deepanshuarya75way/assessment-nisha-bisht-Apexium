import os
import cv2
import matplotlib.pyplot as plt

data_dir = "data"

# get a few filenames from each class
class0_files = os.listdir(os.path.join(data_dir, "Class_0"))[:3]
class1_files = os.listdir(os.path.join(data_dir, "Class_1"))[:3]

fig, axes = plt.subplots(2, 3, figsize=(10, 7))

for i, f in enumerate(class0_files):
    img = cv2.imread(os.path.join(data_dir, "Class_0", f), cv2.IMREAD_GRAYSCALE)
    axes[0, i].imshow(img, cmap="gray")
    axes[0, i].set_title("Class 0 (no oil)")
    axes[0, i].axis("off")

for i, f in enumerate(class1_files):
    img = cv2.imread(os.path.join(data_dir, "Class_1", f), cv2.IMREAD_GRAYSCALE)
    axes[1, i].imshow(img, cmap="gray")
    axes[1, i].set_title("Class 1 (oil)")
    axes[1, i].axis("off")

plt.tight_layout()
plt.show()