import numpy as np
from sklearn.utils.class_weight import compute_class_weight

y_train = np.load("y_train.npy")

# Count how many of each class we have in training data
unique, counts = np.unique(y_train, return_counts=True)
print("Class counts in training set:")
for cls, count in zip(unique, counts):
    print(f"  Class {cls}: {count}")

# Compute class weights — this tells the model how much extra
# "attention" to pay to the minority class (oil, class 1)
class_weights = compute_class_weight(
    class_weight="balanced",
    classes=unique,
    y=y_train
)

class_weight_dict = {int(cls): weight for cls, weight in zip(unique, class_weights)}
print("\nComputed class weights:")
print(class_weight_dict)

# Save this so we can reuse it directly when training the model
np.save("class_weights.npy", class_weight_dict)
print("\nSaved class_weights.npy")